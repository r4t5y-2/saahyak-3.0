import { useMemo } from "react";
import { Link } from "react-router";
import { Share2, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { usePrefs } from "@/components/PrefsProvider";
import { badges, last14Days, milestones } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * Progress & Rewards — quiet encouragement in green. Rings per goal, a capped
 * badge shelf (a handful visible, "see all" for the rest — never a wall of
 * icons), and a plain-language summary for caregivers/therapists.
 */
export default function Progress() {
  const { prefs } = usePrefs();
  const goals = useMemo(() => milestones(), []);
  const badgeList = useMemo(() => badges(), []);
  const days = useMemo(() => last14Days(), []);

  const earned = badgeList.filter((b) => b.earned);
  const visibleBadges = badgeList.slice(0, 4);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold">Progress</h1>
            <p className="mt-1 text-base font-semibold text-ink-soft">
              small steps, honestly counted
            </p>
          </div>
          <span
            aria-hidden
            className="flex size-12 items-center justify-center rounded-2xl bg-success/15 text-2xl"
          >
            🌱
          </span>
        </header>

        {/* ——— Goal rings ——— */}
        <section className="grid grid-cols-2 gap-3">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            return (
              <div
                key={g.id}
                className="flex items-center gap-4 rounded-3xl border-2 border-line bg-card p-4"
              >
                <Ring pct={pct} />
                <div>
                  <p className="text-xl font-extrabold">
                    {g.current}
                    <span className="text-base font-bold text-ink-soft">/{g.target}</span>
                  </p>
                  <p className="text-sm leading-tight font-bold text-ink-soft">
                    {prefs.lang === "hi" ? g.hi : g.en}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* ——— 14-day activity strip ——— */}
        <section className="rounded-3xl border-2 border-line bg-card p-5">
          <h2 className="text-lg font-extrabold">last 14 days</h2>
          <div className="mt-3 flex items-end gap-1.5" aria-hidden>
            {days.map((d) => {
              const max = Math.max(...days.map((x) => x.taps), 1);
              const h = Math.max(4, Math.round((d.taps / max) * 56));
              return (
                <span
                  key={d.day}
                  className={cn("flex-1 rounded-t-md", d.taps > 0 ? "bg-success" : "bg-line")}
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>
          <p className="mt-2 text-sm font-semibold text-ink-soft">
            taller bars = more words tapped that day
          </p>
        </section>

        {/* ——— Badge shelf (capped) ——— */}
        <section className="rounded-3xl border-2 border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">badges</h2>
            <span className="text-base font-bold text-ink-soft">
              {earned.length}/{badgeList.length} earned
            </span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {visibleBadges.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center",
                  b.earned ? "border-marigold bg-marigold-soft" : "border-line bg-paper opacity-50",
                )}
              >
                <span aria-hidden className="text-2xl">{b.emoji}</span>
                <span className="text-xs leading-tight font-bold text-ink">{b.en}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold text-ink-soft">
            {badgeList.length - visibleBadges.length} more to discover as you go
          </p>
        </section>

        {/* ——— Plain-language caregiver summary ——— */}
        <section className="rounded-3xl border-2 border-line bg-card p-5">
          <div className="flex items-center gap-2">
            <Users className="size-6 text-primary" aria-hidden />
            <h2 className="text-lg font-extrabold">for your caregivers</h2>
          </div>
          <p className="mt-3 text-base leading-relaxed text-ink-soft">
            In plain words: this week used {days.reduce((s, d) => s + d.taps, 0)} taps,{" "}
            {days.reduce((s, d) => s + d.speaks, 0)} spoken sentences and made{" "}
            {days.reduce((s, d) => s + d.repairs, 0)} “not that” repairs — each one a moment of
            self-advocacy, not a failure.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/insights"
              className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-primary bg-primary px-4 py-2.5 text-base font-extrabold text-primary-foreground"
            >
              <Share2 className="size-5" aria-hidden />
              full caregiver view
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 60 60" className="size-16 shrink-0" role="img" aria-label={`${pct}% complete`}>
      <circle cx="30" cy="30" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke="var(--success)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 30 30)"
      />
      <text
        x="30"
        y="35"
        textAnchor="middle"
        className="fill-ink text-sm font-extrabold"
        style={{ font: "700 13px var(--font-sans)" }}
      >
        {pct}%
      </text>
    </svg>
  );
}
