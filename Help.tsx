import { useState } from "react";
import { Link } from "react-router";
import { ChevronRight, GraduationCap, HeartHandshake } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { usePrefs } from "@/components/PrefsProvider";
import { cn } from "@/lib/utils";

const TUTORIALS = [
  {
    id: "build",
    en: "Build a sentence",
    hi: "वाक्य बनाएँ",
    steps: [
      "Tap picture words to add them to the strip at the top.",
      "Tap the green Speak button — the device says exactly your words.",
      "Tap a word in the strip to remove it.",
    ],
  },
  {
    id: "repair",
    en: "Use “not that”",
    hi: "“वो नहीं” का उपयोग",
    steps: [
      "Tap a word — it lands in the strip.",
      "Not what you meant? Tap ↩ not that.",
      "The board learns and moves that word down. You stay in charge.",
    ],
  },
  {
    id: "scenes",
    en: "Switch scenes",
    hi: "दृश्य बदलें",
    steps: [
      "The colored tabs at the top are places: Home, School, Clinic.",
      "Tap one — the board brings the right words forward.",
      "The always-available row never moves.",
    ],
  },
];

export default function Help() {
  const { prefs } = usePrefs();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold">Help</h1>
            <p className="mt-1 text-base font-semibold text-ink-soft">
              short guides — skip any time
            </p>
          </div>
          {prefs.mascot && <Mascot mood="hello" size={56} />}
        </header>

        <section className="space-y-3">
          {TUTORIALS.map((t) => {
            const open = openId === t.id;
            return (
              <div key={t.id} className="rounded-3xl border-2 border-line bg-card">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : t.id)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-lg font-extrabold">
                    {prefs.lang === "hi" ? t.hi : t.en}
                  </span>
                  <ChevronRight
                    className={cn("size-6 text-ink-soft transition-none", open && "rotate-90")}
                    aria-hidden
                  />
                </button>
                {open && (
                  <ol className="animate-fade-in space-y-2 px-5 pb-5">
                    {t.steps.map((s, i) => (
                      <li key={i} className="flex gap-3 text-base leading-relaxed font-semibold">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-marigold text-sm font-extrabold text-ink-on-marigold">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl border-2 border-line bg-card p-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-6 text-primary" aria-hidden />
            <h2 className="text-lg font-extrabold">For therapists & teachers</h2>
          </div>
          <p className="mt-2 text-base leading-relaxed text-ink-soft">
            The caregiver portal shows learning patterns in plain language — scenes used,
            repair patterns, vocabulary gaps — with role-scoped visibility and a full audit
            trail for vocabulary changes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/care"
              className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-primary bg-primary px-4 py-2.5 text-base font-extrabold text-primary-foreground"
            >
              open caregiver portal
            </Link>
            <Link
              to="/insights"
              className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-line bg-surface px-4 py-2.5 text-base font-bold text-ink"
            >
              device insights
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border-2 border-dashed border-line bg-card p-5">
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
            <p className="text-base leading-relaxed font-semibold text-ink-soft">
              Sahaayak is a communication tool, not a medical device. For diagnosis and
              therapy plans, work with your speech-language pathologist.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
