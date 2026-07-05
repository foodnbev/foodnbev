import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/foodnbev-logo.png.asset.json";
import { LogOut, Plus, UserRound } from "lucide-react";

export function Header() {
  const { user, loading } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoAsset.url} alt="food n bev" className="h-7 w-auto" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/" activeOptions={{ exact: true }} className="text-foreground/70 hover:text-foreground [&.active]:text-foreground">
            Home
          </Link>
          <Link to="/projects" className="text-foreground/70 hover:text-foreground [&.active]:text-foreground">
            Projects
          </Link>
          <Link to="/companies" className="text-foreground/70 hover:text-foreground [&.active]:text-foreground">
            Directory
          </Link>
          {user && (
            <>
              <Link to="/threads" className="text-foreground/70 hover:text-foreground [&.active]:text-foreground">
                Discussions
              </Link>
              <Link to="/messages" className="text-foreground/70 hover:text-foreground [&.active]:text-foreground">
                Messages
              </Link>
              <Link to="/account" className="text-foreground/70 hover:text-foreground [&.active]:text-foreground">
                My account
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {!loading && user ? (
            <>
              <Button asChild size="sm" variant="default">
                <Link to="/projects/new"><Plus className="size-4" /> New project</Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={signOut} aria-label="Sign out">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : !loading ? (
            <Button asChild size="sm" variant="default">
              <Link to="/auth"><UserRound className="size-4" /> Sign in</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
