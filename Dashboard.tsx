import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, LogOut, MessageCircle } from "lucide-react";
import { Link } from "react-router";

export default function Dashboard() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <main className="min-h-screen bg-paper px-6 py-10 text-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-marigold-deep">
              signed in {user?.isAnonymous ? "as guest" : `as ${user?.email ?? user?.name ?? "caregiver"}`}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
              Welcome{user?.name ? `, ${user.name}` : ""}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex cursor-pointer items-center gap-2 self-start rounded-xl border-2 border-line bg-card px-4 py-2.5 text-base font-bold text-ink-soft hover:bg-marigold-soft/50"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/board"
            className="rounded-3xl border-2 border-line bg-card p-6 hover:border-primary"
          >
            <span aria-hidden className="text-3xl">🧩</span>
            <h2 className="mt-3 text-xl font-extrabold text-primary">
              Open the board
            </h2>
            <p className="mt-2 text-base leading-relaxed text-ink-soft">
              The child's communication board — scenes, sentence strip, speak,
              and the ↩ not-that repair loop.
            </p>
          </Link>
          <Link
            to="/insights"
            className="rounded-3xl border-2 border-line bg-card p-6 hover:border-primary"
          >
            <LayoutDashboard className="size-7 text-primary" aria-hidden />
            <h2 className="mt-3 text-xl font-extrabold text-primary">
              Caregiver insights
            </h2>
            <p className="mt-2 text-base leading-relaxed text-ink-soft">
              Taps, learning log, and spoken sentences from this device — with
              opt-in sync you control.
            </p>
          </Link>
        </div>

        <div className="rounded-3xl border-2 border-dashed border-line bg-card p-5">
          <p className="flex items-start gap-3 text-base leading-relaxed font-semibold text-ink-soft">
            <MessageCircle className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
            The board works fully offline and on-device. Your account only
            powers optional, opt-in sync for therapists and co-parents.
          </p>
        </div>
      </div>
    </main>
  );
}
