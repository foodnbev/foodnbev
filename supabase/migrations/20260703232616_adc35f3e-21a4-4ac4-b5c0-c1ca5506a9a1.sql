
-- ============ THREADS ============
CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX threads_project_idx ON public.threads(project_id);
CREATE INDEX threads_updated_idx ON public.threads(updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT ALL ON public.threads TO service_role;

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads_select_auth" ON public.threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "threads_insert_own" ON public.threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "threads_update_own" ON public.threads FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "threads_delete_own" ON public.threads FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER threads_touch BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ THREAD MESSAGES ============
CREATE TABLE public.thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX thread_messages_thread_idx ON public.thread_messages(thread_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thread_messages TO authenticated;
GRANT ALL ON public.thread_messages TO service_role;

ALTER TABLE public.thread_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tmsg_select_auth" ON public.thread_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "tmsg_insert_own" ON public.thread_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tmsg_update_own" ON public.thread_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tmsg_delete_own" ON public.thread_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER tmsg_touch BEFORE UPDATE ON public.thread_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Bump thread updated_at on new message so lists sort by activity
CREATE OR REPLACE FUNCTION public.bump_thread_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.threads SET updated_at = now() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tmsg_bump_thread AFTER INSERT ON public.thread_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_thread_updated_at();

-- ============ CONNECTIONS ============
CREATE TYPE public.connection_status AS ENUM ('pending','accepted','rejected');

CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id)
);
-- prevent duplicates in either direction
CREATE UNIQUE INDEX connections_pair_uniq ON public.connections
  (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));
CREATE INDEX connections_addressee_idx ON public.connections(addressee_id, status);
CREATE INDEX connections_requester_idx ON public.connections(requester_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conn_select_involved" ON public.connections FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "conn_insert_requester" ON public.connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');
-- Addressee can accept/reject; requester can cancel a still-pending request via delete
CREATE POLICY "conn_update_addressee" ON public.connections FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id) WITH CHECK (auth.uid() = addressee_id);
CREATE POLICY "conn_delete_involved" ON public.connections FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE TRIGGER connections_touch BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Helper: are two users mutually accepted?
CREATE OR REPLACE FUNCTION public.are_connected(_a UUID, _b UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
      AND ((requester_id = _a AND addressee_id = _b)
        OR (requester_id = _b AND addressee_id = _a))
  );
$$;

-- ============ DIRECT MESSAGES ============
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT,
  attachment_path TEXT,
  attachment_name TEXT,
  attachment_mime TEXT,
  attachment_size INTEGER,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id),
  CHECK (
    (body IS NOT NULL AND length(trim(body)) > 0)
    OR attachment_path IS NOT NULL
  )
);
CREATE INDEX dm_pair_idx ON public.direct_messages
  (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at);
CREATE INDEX dm_recipient_unread_idx ON public.direct_messages(recipient_id) WHERE read_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_select_involved" ON public.direct_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "dm_insert_if_connected" ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.are_connected(sender_id, recipient_id)
  );
-- Recipient can mark read; sender can delete their own message
CREATE POLICY "dm_update_recipient" ON public.direct_messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE POLICY "dm_delete_sender" ON public.direct_messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- ============ STORAGE: dm-attachments ============
-- Path convention: {sender_id}/{uuid}-{filename}. Access allowed to sender or any connected user.
CREATE POLICY "dm_att_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'dm-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "dm_att_select_involved" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'dm-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.direct_messages dm
        WHERE dm.attachment_path = storage.objects.name
          AND (dm.sender_id = auth.uid() OR dm.recipient_id = auth.uid())
      )
    )
  );
CREATE POLICY "dm_att_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'dm-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
