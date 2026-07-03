import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  getConnectionBetween, sendConnectionRequest, respondToConnection,
  type ConnectionRow,
} from "@/lib/social";
import { MessageSquare, UserPlus, Check, X, Clock } from "lucide-react";

export function ConnectButton({ otherUserId, otherAlias }: { otherUserId: string; otherAlias?: string | null }) {
  const { user } = useAuth();
  const [conn, setConn] = useState<ConnectionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.id === otherUserId) { setLoading(false); return; }
    let alive = true;
    getConnectionBetween(user.id, otherUserId)
      .then((c) => alive && setConn(c))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [user, otherUserId]);

  if (!user || user.id === otherUserId || loading) return null;

  if (conn?.status === "accepted") {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/messages/$userId" params={{ userId: otherUserId }}>
          <MessageSquare className="size-3.5" /> Message
        </Link>
      </Button>
    );
  }

  if (conn?.status === "pending") {
    if (conn.addressee_id === user.id) {
      return (
        <div className="flex gap-1.5">
          <Button size="sm" variant="default" onClick={async () => {
            try { await respondToConnection(conn.id, true); setConn({ ...conn, status: "accepted" }); toast.success("Connected"); }
            catch (e: any) { toast.error(e.message); }
          }}><Check className="size-3.5" /> Accept</Button>
          <Button size="sm" variant="outline" onClick={async () => {
            try { await respondToConnection(conn.id, false); setConn({ ...conn, status: "rejected" }); }
            catch (e: any) { toast.error(e.message); }
          }}><X className="size-3.5" /> Reject</Button>
        </div>
      );
    }
    return <Button size="sm" variant="outline" disabled><Clock className="size-3.5" /> Request sent</Button>;
  }

  if (conn?.status === "rejected") {
    return <Button size="sm" variant="ghost" disabled>Request declined</Button>;
  }

  return (
    <Button size="sm" variant="outline" onClick={async () => {
      try {
        const c = await sendConnectionRequest(user.id, otherUserId);
        setConn(c);
        toast.success(`Request sent${otherAlias ? ` to ${otherAlias}` : ""}`);
      } catch (e: any) { toast.error(e.message); }
    }}><UserPlus className="size-3.5" /> Connect</Button>
  );
}
