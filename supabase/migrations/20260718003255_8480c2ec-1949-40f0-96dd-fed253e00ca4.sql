
CREATE TABLE public.rfqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  deadline timestamptz,
  anonymous boolean NOT NULL DEFAULT false,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  categories public.party_category[] NOT NULL DEFAULT '{}',
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfqs TO authenticated;
GRANT ALL ON public.rfqs TO service_role;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view RFQs" ON public.rfqs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create RFQs" ON public.rfqs FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Author can update own RFQ" ON public.rfqs FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Author or admin can delete RFQ" ON public.rfqs FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));

-- Helper: is RFQ open?
CREATE OR REPLACE FUNCTION public.rfq_is_open(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rfqs r
    WHERE r.id = _id
      AND r.closed_at IS NULL
      AND (r.deadline IS NULL OR r.deadline > now())
      AND r.created_at > now() - interval '2 months'
  );
$$;

CREATE TABLE public.rfq_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  submitter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  amount numeric,
  anonymous boolean NOT NULL DEFAULT false,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  amend_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rfq_id, submitter_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_quotes TO authenticated;
GRANT ALL ON public.rfq_quotes TO service_role;
ALTER TABLE public.rfq_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submitter or RFQ author can view quote" ON public.rfq_quotes FOR SELECT TO authenticated
  USING (auth.uid() = submitter_id OR auth.uid() = (SELECT created_by FROM public.rfqs WHERE id = rfq_id));
CREATE POLICY "Signed-in can submit quote to open RFQ" ON public.rfq_quotes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = submitter_id
    AND public.rfq_is_open(rfq_id)
    AND auth.uid() <> (SELECT created_by FROM public.rfqs WHERE id = rfq_id)
  );
CREATE POLICY "Submitter can amend own quote once" ON public.rfq_quotes FOR UPDATE TO authenticated
  USING (auth.uid() = submitter_id AND amend_count < 1 AND public.rfq_is_open(rfq_id))
  WITH CHECK (auth.uid() = submitter_id AND amend_count <= 1);
CREATE POLICY "Submitter can delete own quote" ON public.rfq_quotes FOR DELETE TO authenticated
  USING (auth.uid() = submitter_id);

CREATE TABLE public.rfq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  asker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  UNIQUE (rfq_id, asker_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_questions TO authenticated;
GRANT ALL ON public.rfq_questions TO service_role;
ALTER TABLE public.rfq_questions ENABLE ROW LEVEL SECURITY;

-- Questions visible to all signed-in users (so quoters can see prior Q&A)
CREATE POLICY "Signed-in can view questions" ON public.rfq_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in can ask on open RFQ once" ON public.rfq_questions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = asker_id
    AND public.rfq_is_open(rfq_id)
    AND auth.uid() <> (SELECT created_by FROM public.rfqs WHERE id = rfq_id)
  );
CREATE POLICY "Asker cannot edit; RFQ author can answer" ON public.rfq_questions FOR UPDATE TO authenticated
  USING (auth.uid() = (SELECT created_by FROM public.rfqs WHERE id = rfq_id))
  WITH CHECK (auth.uid() = (SELECT created_by FROM public.rfqs WHERE id = rfq_id));

-- Enforce single amendment via trigger (defense-in-depth)
CREATE OR REPLACE FUNCTION public.rfq_quote_amend_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.body IS DISTINCT FROM OLD.body OR NEW.amount IS DISTINCT FROM OLD.amount
     OR NEW.anonymous IS DISTINCT FROM OLD.anonymous OR NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    IF OLD.amend_count >= 1 THEN
      RAISE EXCEPTION 'Quote can only be amended once';
    END IF;
    NEW.amend_count := OLD.amend_count + 1;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER rfq_quote_amend_guard BEFORE UPDATE ON public.rfq_quotes
FOR EACH ROW EXECUTE FUNCTION public.rfq_quote_amend_guard();

CREATE TRIGGER rfqs_touch BEFORE UPDATE ON public.rfqs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_rfqs_created_at ON public.rfqs(created_at DESC);
CREATE INDEX idx_rfq_quotes_rfq ON public.rfq_quotes(rfq_id);
CREATE INDEX idx_rfq_questions_rfq ON public.rfq_questions(rfq_id);
