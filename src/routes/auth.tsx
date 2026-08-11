import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import logoAsset from "@/assets/foodnbev-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — food n bev" }, { name: "description", content: "Sign in or create a food n bev account to add, edit and rate F&B construction projects." }] }),
  validateSearch: z.object({ redirect: z.string().optional() }).optional(),
  component: AuthPage,
});

const SignUpSchema = z.object({
  alias: z.string().trim().min(2, "Alias must be at least 2 characters").max(40),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  involved: z.boolean(),
  full_name: z.string().trim().max(120).optional().or(z.literal("")),
  mobile: z.string().trim().max(30).optional().or(z.literal("")),
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const redirectTo = typeof search.redirect === "string" ? search.redirect : "/";
  useEffect(() => { if (user) navigate({ to: redirectTo, replace: true }); }, [user, navigate, redirectTo]);

  return (
    <AppShell>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <img src={logoAsset} alt="food n bev" className="h-8 w-auto" />
        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Join the community to add projects, contractor info and ratings.
        </p>

        <Tabs defaultValue="signin" className="mt-8 w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin"><SignInForm /></TabsContent>
          <TabsContent value="signup"><SignUpForm /></TabsContent>
        </Tabs>

        <div className="my-6 flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
          Continue with Google
        </Button>
      </div>
    </AppShell>
  );
}

async function signInWithGoogle() {
  const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
  if (r.error) toast.error("Google sign-in failed");
  else if (!r.redirected) window.location.href = "/";
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Signed in");
    window.location.href = "/";
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="si-pw">Password</Label>
        <Input id="si-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

function SignUpForm() {
  const [form, setForm] = useState({ alias: "", email: "", password: "", involved: true, full_name: "", mobile: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = SignUpSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          alias: parsed.data.alias,
          full_name: parsed.data.full_name || null,
          mobile: parsed.data.mobile || null,
          involved: parsed.data.involved,
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    window.location.href = "/";
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-4">
      <Field label="Alias *" id="su-alias">
        <Input id="su-alias" value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} required maxLength={40} />
      </Field>
      <Field label="Email *" id="su-email">
        <Input id="su-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </Field>
      <Field label="Password *" id="su-pw">
        <Input id="su-pw" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      </Field>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="su-inv">Involved (or hoping to be) in F&amp;B projects? *</Label>
          <p className="text-xs text-muted-foreground">Required.</p>
        </div>
        <Switch id="su-inv" checked={form.involved} onCheckedChange={(v) => setForm({ ...form, involved: v })} />
      </div>
      <Field label="Full name (optional)" id="su-name">
        <Input id="su-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </Field>
      <Field label="Mobile (optional)" id="su-mob">
        <Input id="su-mob" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
      </Field>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
      <p className="text-center text-xs text-muted-foreground">
        Already have an account? <Link to="/auth" className="underline">Sign in</Link>
      </p>
    </form>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

