import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Cloud,
  Download,
  Heart,
  Lock,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { backend } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Sparkle } from "@/components/StoryBackdrop";
import {
  loadEvents,
  loadRepairs,
  loadSentences,
  clearLog,
  type SentenceRecord,
} from "@/lib/eventLog";
import { SCENES, findWord } from "@/lib/vocabulary";

/**
 * Therapist dashboard — the grown-up pages of the storybook.
 *
 * Everything is read from this device's own log; nothing leaves the device
 * unless sharing is switched on below. Metrics are presented as pastel
 * stickers and hand-drawn charts, never as an analytics table.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const PASTELS = ["#f3aec4", "#a8cbea", "#b5e0c5", "#cfc3ec", "#f7d574"];

const PRIVACY_STICKERS = [
  { icon: Lock, label: "Private & protected" },
  { icon: Cloud, label: "No raw message history" },
  { icon: Heart, label: "Child-led communication" },
  { icon: ShieldCheck, label: "Shared only with the care team" },
] as const;

function timeAgo(at: number): string {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function dayKey(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function shortDay(at: number): string {
  return new Date(at).toLocaleDateString("en", { weekday: "short" });
}

/** A soft hand-drawn bar chart — wobbly pastel bars on a crayon baseline. */
function StoryBars({
  bars,
  title,
}: {
  bars: { label: string; value: number; color: string }[];
  title: string;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div>
      <p className="font-story text-2xl text-ink">{title}</p>
      <div className="mt-4 flex items-end gap-3">
        {bars.map((b, i) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="font-story text-lg text-ink-soft">{b.value}</span>
            <div
              className={cn(
                "w-full rounded-t-xl border-2 border-gold/50",
                i % 2 === 0 ? "rotate-[-1.2deg]" : "rotate-[1deg]",
              )}
              style={{
                height: `${Math.max(10, Math.round((b.value / max) * 120))}px`,
                backgroundColor: b.color,
              }}
            />
            <span className="font-story text-lg text-ink-soft">{b.label}</span>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 300 8" className="mt-1 w-full" aria-hidden>
        <path
          d="M2 5 Q 40 2, 75 5 T 150 5 T 225 4 T 298 5"
          fill="none"
          stroke="#c98a2e"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function Insights() {
  const events = useMemo(() => loadEvents().slice(-400).reverse(), []);
  const repairs = useMemo(() => loadRepairs().slice(-60).reverse(), []);
  const sentences = useMemo(() => loadSentences().slice(-40).reverse(), []);

  const [mirror, setMirror] = useState<Awaited<ReturnType<typeof backend.getEvents>>>([]);
  const [mirrorRepairsCount, setMirrorRepairsCount] = useState(0);

  useEffect(() => {
    // Load only the opt-in mirror. The board's normal activity remains local.
    void Promise.all([backend.getEvents(), backend.getRepairs()])
      .then(([events, repairs]) => {
        setMirror(events);
        setMirrorRepairsCount(repairs.length);
      })
      .catch(() => {
        setMirror([]);
        setMirrorRepairsCount(0);
      });
  }, []);

  const mirrorEvents = (events: Parameters<typeof backend.pushEvents>[0]) =>
    backend.pushEvents(events).then(() => backend.getEvents().then(setMirror));
  const mirrorRepairs = (repairs: Parameters<typeof backend.pushRepairs>[0]) =>
    backend.pushRepairs(repairs).then(() => backend.getRepairs().then((rows) => setMirrorRepairsCount(rows.length)));
  const mirrorSentences = (sentences: Parameters<typeof backend.pushSentences>[0]) =>
    backend.pushSentences(sentences);
  const clearMirror = () =>
    backend.clearMirror().then(() => {
      setMirror([]);
      setMirrorRepairsCount(0);
    });

  const taps = events.filter((e) => e.kind === "tap");

  // ——— Storybook metrics ———
  const moments = taps.length + events.filter((e) => e.kind === "speak").length;
  const wordsShared = useMemo(() => new Set(taps.map((t) => t.wordId)).size, [taps]);
  const helpfulRepairs = repairs.length;
  const newPatterns = useMemo(() => {
    const weekAgo = Date.now() - 7 * DAY_MS;
    const pairs = new Set<string>();
    for (const r of repairs) {
      if (r.chosenId && r.at >= weekAgo) pairs.add(`${r.rejectedId}→${r.chosenId}`);
    }
    return pairs.size;
  }, [repairs]);

  // ——— Pastel charts ———
  const weekBars = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of taps) {
      counts.set(dayKey(t.at), (counts.get(dayKey(t.at)) ?? 0) + 1);
    }
    return Array.from({ length: 7 }, (_, i) => {
      const at = Date.now() - (6 - i) * DAY_MS;
      return {
        label: shortDay(at),
        value: counts.get(dayKey(at)) ?? 0,
        color: PASTELS[i % PASTELS.length],
      };
    });
  }, [taps]);

  const sceneBars = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      if (e.kind === "tap" && e.scene) {
        counts.set(e.scene, (counts.get(e.scene) ?? 0) + 1);
      }
    }
    return SCENES.map((s, i) => ({
      label: s.en.split(" ")[0],
      value: counts.get(s.id) ?? 0,
      color: PASTELS[i % PASTELS.length],
    }));
  }, [events]);

  const topWords = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of taps) {
      if (t.wordId) counts.set(t.wordId, (counts.get(t.wordId) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [taps]);

  // Per-scene usage for the illustrated scene cards.
  const sceneTaps = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of taps) {
      if (t.scene) counts.set(t.scene, (counts.get(t.scene) ?? 0) + 1);
    }
    return counts;
  }, [taps]);

  function downloadWeeklyStory() {
    const lines: string[] = [
      "Sahaayak — my weekly story",
      "".padEnd(32, "~"),
      `This week there were ${moments} communication moments.`,
      `${wordsShared} different words were shared, and ${helpfulRepairs} gentle “not that” moments helped the board learn.`,
      newPatterns > 0
        ? `${newPatterns} new pattern(s) were discovered — times a correction taught us what was really meant.`
        : "No new patterns this week — every choice landed just right.",
      "",
      "Favourite words:",
      ...topWords.map(([id, n]) => {
        const w = findWord(id);
        return `  • ${w?.en ?? id} — ${n} time(s)`;
      }),
      "",
      "Learning moments:",
      ...(repairs.length
        ? repairs.slice(0, 6).map((r) => {
            const rejected = findWord(r.rejectedId);
            const chosen = r.chosenId ? findWord(r.chosenId) : undefined;
            return `  • tried “${rejected?.en ?? r.rejectedId}”${chosen ? ` → meant “${chosen.en}”` : ""} (${r.scene})`;
          })
        : ["  • none yet — and that's okay."]),
      "",
      `${sentences.length} sentence(s) were spoken out loud, all tapped word by word by the child.`,
      "",
      "The end. (Generated on-device — nothing was uploaded.)",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sahaayak-weekly-story.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative min-h-screen text-ink">
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        {/* ——— Header page ——— */}
        <header className="storybook-card relative px-6 py-6">
          <Sparkle className="absolute right-6 top-5 size-5 text-story-pink" />
          <Sparkle className="absolute right-12 top-10 size-4 text-story-blue" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-story text-2xl text-marigold-deep">
                the grown-ups' pages
              </p>
              <h1 className="font-story text-4xl text-ink">Our week with words</h1>
              <p className="mt-1 max-w-xl text-base leading-relaxed font-semibold text-ink-soft">
                A gentle look at how communication went — drawn from this
                device's own diary. Nothing here is shared unless you choose to.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/board"
                className="flex items-center gap-2 rounded-full border-2 border-line bg-surface px-4 py-2.5 text-base font-bold text-gold"
              >
                <ArrowLeft className="size-5" aria-hidden />
                Back to the board
              </Link>
              <Link
                to="/care"
                className="rounded-full border-2 border-line bg-surface px-4 py-2.5 text-base font-bold text-ink-soft hover:bg-marigold-soft/60"
              >
                Caregiver portal
              </Link>
            </div>
          </div>
        </header>

        {/* ——— Privacy stickers ——— */}
        <section className="relative z-10 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Privacy promises">
          {PRIVACY_STICKERS.map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className={cn(
                "storybook-note flex items-center gap-2.5 bg-muted px-4 py-3",
                i % 2 === 0 ? "rotate-[-1deg]" : "rotate-[0.8deg]",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-gold/60 bg-surface">
                <Icon className="size-5 text-gold" aria-hidden />
              </span>
              <span className="text-sm leading-tight font-extrabold text-ink">{label}</span>
            </div>
          ))}
        </section>

        {/* ——— Metric stickers ——— */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { n: moments, label: "Communication moments", color: "#f3aec4" },
            { n: wordsShared, label: "Words shared", color: "#a8cbea" },
            { n: helpfulRepairs, label: "Helpful repairs", color: "#b5e0c5" },
            { n: newPatterns, label: "New patterns", color: "#cfc3ec" },
          ].map((m, i) => (
            <div
              key={m.label}
              className={cn(
                "storybook-note relative px-5 py-5 text-center",
                i % 2 === 0 ? "rotate-[-0.8deg]" : "rotate-[0.8deg]",
              )}
              style={{ backgroundColor: m.color }}
            >
              <Sparkle className="absolute right-2 top-2 size-4 text-white/80" />
              <p className="font-story text-5xl text-ink">{m.n}</p>
              <p className="mt-1 text-sm leading-tight font-extrabold text-ink/80">
                {m.label}
              </p>
            </div>
          ))}
        </section>

        {/* ——— Hand-drawn charts ——— */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="storybook-card relative px-6 py-6">
            <Sparkle className="absolute left-5 top-4 size-4 text-story-lavender" />
            <StoryBars title="Words through the week" bars={weekBars} />
          </section>
          <section className="storybook-card relative px-6 py-6">
            <Sparkle className="absolute right-6 top-5 size-4 text-story-butter" />
            <StoryBars title="Where the words went" bars={sceneBars} />
          </section>
        </div>

        {/* ——— Favourite words + weekly story button ——— */}
        <section className="storybook-card px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-64 flex-1">
              <p className="font-story text-2xl text-ink">Favourite words this week</p>
              {topWords.length === 0 ? (
                <p className="mt-2 font-story text-xl text-ink-soft">
                  No words yet — the board is waiting patiently.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {topWords.map(([id, count], i) => {
                    const word = findWord(id);
                    return (
                      <li key={id} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 font-story text-xl text-ink">
                          {word?.en ?? id}
                        </span>
                        <span className="h-4 flex-1 overflow-hidden rounded-full border-2 border-gold/40 bg-muted">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${Math.round((count / topWords[0][1]) * 100)}%`,
                              backgroundColor: PASTELS[i % PASTELS.length],
                            }}
                          />
                        </span>
                        <span className="w-8 text-right font-story text-xl text-ink-soft">
                          {count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="flex flex-col items-stretch gap-2">
              <button
                type="button"
                onClick={downloadWeeklyStory}
                className="flex min-h-13 items-center justify-center gap-2 rounded-full border-2 border-gold bg-primary px-6 py-3.5 text-lg font-extrabold text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-5" aria-hidden />
                Download my weekly story
              </button>
              <span className="flex items-center justify-center gap-1.5 text-sm font-bold text-ink-soft">
                <Sparkles className="size-4 text-gold" aria-hidden />
                written on-device, just for your care team
              </span>
            </div>
          </div>
        </section>

        {/* ——— Illustrated scene cards ——— */}
        <section>
          <p className="mb-3 text-center font-story text-3xl text-ink">
            The places these words live
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SCENES.map((s) => {
              const count = sceneTaps.get(s.id) ?? 0;
              return (
                <Link
                  key={s.id}
                  to="/board"
                  className="storybook-note group block px-4 py-5 text-center transition-transform hover:-rotate-1"
                >
                  <span
                    className={cn(
                      "mx-auto flex size-14 items-center justify-center rounded-full border-2 border-gold/40 text-3xl",
                      s.activeBgClass,
                    )}
                    aria-hidden
                  >
                    {s.emoji}
                  </span>
                  <p className="mt-2 font-story text-2xl text-ink">{s.en}</p>
                  <p className="text-sm font-bold text-ink-soft">{s.hi}</p>
                  <p className="mt-1 font-story text-xl text-gold">
                    {count} {count === 1 ? "word" : "words"} shared here
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ——— Learning log as storybook pages ——— */}
        <section className="storybook-card px-6 py-6">
          <p className="font-story text-3xl text-ink">Little lessons we learned</p>
          <p className="mt-1 text-base font-semibold text-ink-soft">
            Every “not that” is signal, not failure — each note below helped
            the board listen better.
          </p>
          {repairs.length === 0 ? (
            <div className="storybook-note mt-4 bg-muted px-5 py-6 text-center">
              <p className="font-story text-2xl text-ink-soft">
                No lessons yet — the story is just beginning.
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {repairs.slice(0, 8).map((r, i) => {
                const rejected = findWord(r.rejectedId);
                const chosen = r.chosenId ? findWord(r.chosenId) : undefined;
                return (
                  <li
                    key={r.id}
                    className={cn(
                      "storybook-note bg-muted px-4 py-3",
                      i % 2 === 0 ? "rotate-[-0.6deg]" : "rotate-[0.6deg]",
                    )}
                  >
                    <p className="font-story text-xl leading-snug text-ink">
                      tried <span className="text-destructive">“{rejected?.en ?? r.rejectedId}”</span>
                      {chosen && (
                        <>
                          {" "}→ meant{" "}
                          <span className="text-gold">“{chosen.en}”</span>
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-ink-soft">
                      {r.scene} · {timeAgo(r.at)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ——— Sentences as little quotes ——— */}
        <section className="storybook-card px-6 py-6">
          <p className="font-story text-3xl text-ink">Sentences spoken aloud</p>
          <p className="mt-1 text-base font-semibold text-ink-soft">
            The device says only what the child tapped and confirmed — nothing
            is ever invented for them.
          </p>
          {sentences.length === 0 ? (
            <div className="storybook-note mt-4 bg-muted px-5 py-6 text-center">
              <p className="font-story text-2xl text-ink-soft">
                Nothing spoken yet — first sentence coming soon.
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {sentences.slice(0, 8).map((s: SentenceRecord, i) => (
                <li
                  key={`${s.at}-${i}`}
                  className={cn(
                    "storybook-note bg-muted px-4 py-3",
                    i % 2 === 0 ? "rotate-[0.5deg]" : "rotate-[-0.5deg]",
                  )}
                >
                  <p className="font-story text-xl leading-snug text-ink">“{s.text}”</p>
                  <p className="mt-0.5 text-sm font-bold text-ink-soft">
                    {s.scene} · {timeAgo(s.at)}
                    {s.lang === "hi" ? " · हिंदी" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ——— Sharing (opt-in sync) ——— */}
        <section className="storybook-card px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-gold/60 bg-marigold-soft">
                <Share2 className="size-6 text-gold" aria-hidden />
              </span>
              <div>
                <p className="font-story text-2xl text-ink">Share with the care team</p>
                <p className="mt-1 max-w-lg text-base leading-relaxed font-semibold text-ink-soft">
                  Mirror this device's diary to your caregiver account so a
                  therapist or co-parent can read it too. You can remove the
                  shared copy at any time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                aria-label="Share activity"
                onCheckedChange={(on) => {
                  if (!on) {
                    void clearMirror();
                    return;
                  }
                  void mirrorEvents({
                    events: loadEvents().map((e) => ({
                      kind: e.kind,
                      wordId: e.wordId,
                      scene: e.scene,
                      at: e.at,
                    })),
                  });
                  void mirrorRepairs({
                    repairs: loadRepairs().map((r) => ({
                      localId: r.id,
                      rejectedId: r.rejectedId,
                      chosenId: r.chosenId,
                      scene: r.scene,
                      at: r.at,
                    })),
                  });
                  void mirrorSentences({
                    sentences: loadSentences().map((s) => ({
                      text: s.text,
                      lang: s.lang,
                      scene: s.scene,
                      at: s.at,
                    })),
                  });
                }}
              />
              <span className="text-base font-extrabold text-ink-soft">
                {mirror && mirror.length > 0
                  ? `${mirror.length} synced`
                  : mirrorRepairsCount > 0
                    ? `${mirrorRepairsCount} synced`
                    : "off"}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Erase this device's diary? The board keeps working; its learning starts fresh.")) {
                  clearLog();
                  window.location.reload();
                }
              }}
              className="flex min-h-12 items-center gap-2 rounded-full border-2 border-line bg-surface px-5 py-2.5 text-base font-bold text-destructive"
            >
              <Trash2 className="size-5" aria-hidden />
              Erase this diary
            </button>
            <span className="text-sm font-bold text-ink-soft">
              {events.length} pages written on this device
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
