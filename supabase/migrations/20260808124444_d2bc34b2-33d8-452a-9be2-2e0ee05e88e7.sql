-- 1. Profiles: no longer readable by anonymous visitors
DROP POLICY IF EXISTS "profiles readable by all" ON public.profiles;
CREATE POLICY "profiles readable by signed-in users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- 2. Companies: only the creator (or an admin) can edit a listing
DROP POLICY IF EXISTS "auth users edit companies" ON public.companies;
CREATE POLICY "creators edit own companies"
  ON public.companies FOR UPDATE TO authenticated
  USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role));