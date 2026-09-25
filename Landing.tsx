import { useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, CloudUpload, ListChecks, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkle } from "@/components/StoryBackdrop";
import { SCENES, findWord, wordLabel, type BuiltInSceneId } from "@/lib/vocabulary";

const SCENE_ART: Record<BuiltInSceneId, string[]> = {
  home: ["grandma", "go", "house"],
  school: ["teacher", "book", "bus"],
  clinic: ["doctor", "injection", "fever"],
  grandma: ["nani", "bunnies", "roti-fresh"],
  overwhelmed: ["quiet2", "space", "deep-breath"],
};

const FORMULA_LINES = [
  "recency-weighted personal use — words used today float up",
  "+ scene relevance — the right words for this room",
  "+ time-of-day fit — breakfast words in the morning",
  "+ communication value — refusals and repair stay close",
  "+ repair nudges — “not that” reshapes the board",
];

const PROMISES = [
  "The device speaks only what the child taps and confirms — never anything auto-generated.",
  "Refusal, pain, and “no” stay reachable at all times; a scene changes what's on top, never what's allowed to exist.",
  "Everything is offline and on-device by default; sync is opt-in.",
  "The ranking explains itself in plain language — no invisible profiling of the child.",
];

function MiniTile({ wordId }: { wordId: string }) {
  const word = findWord(wordId);
  if (!word) return null;
  const Icon = word.icon;
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-line bg-surface px-2 py-3">
      <Icon className="size-8 stroke-[2.25] text-gold" aria-hidden />
      <span className="text-sm leading-none font-bold text-ink">
        {wordLabel(word, "en")}
      </span>
    </div>
  );
}

/** The live demo: switch scenes, watch words rearrange, run the repair flow. */
function LiveDemo() {
  const [scene, setScene] = useState<BuiltInSceneId>("home");
  const [repaired, setRepaired] = useState(false);

  const words = SCENE_ART[scene].map(findWord).filter((w) => w !== undefined);

  function switchScene(next: BuiltInSceneId) {
    setScene(next);
    setRepaired(false);
  }

  return (
    <div className="storybook-card w-full max-w-md p-4">
      <div className="grid grid-cols-5 gap-1.5 rounded-2xl border-2 border-line bg-muted p-1.5">
        {SCENES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => switchScene(s.id)}
            aria-pressed={scene === s.id}
            className={cn(
              "flex items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-xs font-bold sm:text-sm",
              scene === s.id
                ? cn(s.activeBgClass, s.activeTextClass)
                : cn(s.colorClass, "hover:bg-marigold-soft/50"),
            )}
          >
            <span aria-hidden>{s.emoji}</span>
            <span className="truncate">{s.en.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border-2 border-dashed border-line bg-muted p-3">
        <p className="font-story text-lg text-ink-soft">
          {repaired
            ? "↩ learned — that word moves down, the right ones move up."
            : "tap words to build a sentence…"}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {words.map((w) => (
            <MiniTile key={w.id} wordId={w.id} />
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setRepaired(true)}
          className="flex-1 rounded-full border-2 border-line bg-surface px-4 py-3 text-base font-bold text-ink hover:bg-marigold-soft/60"
        >
          ↩ not that
        </button>
        <div className="flex flex-1 items-center justify-center rounded-full border-2 border-dashed border-line bg-muted px-4 py-3 text-center text-base font-bold text-ink-soft">
          {repaired ? "learned ✓" : "sentence strip"}
        </div>
      </div>
    </div>
  );
}

function PillLink({
  to,
  children,
  tone = "mustard",
  className,
}: {
  to: string;
  children: React.ReactNode;
  tone?: "mustard" | "cream";
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border-2 px-6 py-3.5 text-lg font-extrabold",
        tone === "mustard"
          ? "border-gold bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-line bg-card text-ink-soft hover:bg-marigold-soft/60",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export default function Landing() {
  return (
    <div className="relative min-h-screen text-ink">
      <header className="relative z-10 px-4 py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-story text-2xl text-gold">
            <span aria-hidden className="text-2xl leading-none">🧩</span>
            Sahaayak
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              to="/insights"
              className="hidden rounded-full border-2 border-line bg-card px-5 py-2.5 text-base font-bold text-ink-soft hover:bg-marigold-soft/60 sm:block"
            >
              For caregivers
            </Link>
            <Link
              to="/start"
              className="rounded-full border-2 border-gold bg-primary px-5 py-2.5 text-base font-extrabold text-primary-foreground hover:bg-primary/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4">
        {/* ——— Hero: one centered storybook card ——— */}
        <section className="flex flex-col items-center py-10 lg:py-16">
          <div className="storybook-card relative w-full max-w-3xl px-6 py-10 text-center sm:px-12 sm:py-14">
            <Sparkle className="absolute left-6 top-6 size-7 text-story-pink" />
            <Sparkle className="absolute right-8 top-9 size-5 text-story-blue" />
            <Sparkle className="absolute bottom-8 left-10 size-5 text-story-lavender" />
            <Sparkle className="absolute bottom-10 right-6 size-6 text-story-butter" />

            <p className="font-story text-2xl text-marigold-deep">
              a communication board that grows with the child
            </p>
            <h1 className="mx-auto mt-3 max-w-2xl font-story text-5xl leading-[1.05] text-ink sm:text-6xl">
              Context switches the board.{" "}
              <span className="text-gold">Breakdowns teach it.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed font-semibold text-ink-soft">
              Sahaayak is a picture-word board for children who speak through
              symbols. Scenes bring the right words forward without hiding
              anything else — and every “not that” teaches the board what to
              surface next.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <PillLink to="/start">
                Open the storybook
                <ArrowRight className="size-5" aria-hidden />
              </PillLink>
              <PillLink to="/board" tone="cream">
                Go straight to the board
              </PillLink>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-base font-bold text-ink-soft">
              <WifiOff className="size-5" aria-hidden /> works offline · on-device by default
            </span>

            <div className="mt-10 flex justify-center">
              <LiveDemo />
            </div>
          </div>
        </section>

        {/* ——— The one idea ——— */}
        <section className="storybook-card p-6 sm:p-10">
          <h2 className="font-story text-4xl text-ink">The one idea</h2>
          <p className="mt-4 max-w-3xl text-xl leading-relaxed font-semibold text-ink">
            Most AAC apps give a child one grid for every room in their life.
            The child does the work of navigating; the adult does the work of
            guessing. Sahaayak flips both.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="storybook-note bg-muted p-5">
              <h3 className="font-story text-2xl text-gold">Scenes</h3>
              <p className="mt-2 text-base leading-relaxed text-ink-soft">
                Home, School, Clinic, Grandma's House, Calm Corner — lightweight
                presets that bring the right words to the front without hiding
                anything else. The full vocabulary is always one tap away.
              </p>
            </div>
            <div className="storybook-note bg-muted p-5">
              <h3 className="font-story text-2xl text-gold">Breakdown learning</h3>
              <p className="mt-2 text-base leading-relaxed text-ink-soft">
                Every time a child taps “not that” or backs out of a choice,
                that's logged as signal, not failure. The board rearranges
                itself around what didn't work — the way a good conversation
                partner would.
              </p>
            </div>
          </div>
        </section>

        {/* ——— Scenes ——— */}
        <section className="py-14">
          <h2 className="font-story text-4xl text-ink">Five little worlds, one layout</h2>
          <p className="mt-2 max-w-2xl text-lg font-semibold text-ink-soft">
            A single small color-coded tab strip tells scenes apart — the
            layout never moves, because motor memory matters.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SCENES.map((s) => (
              <div key={s.id} className="storybook-note p-5">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 font-story text-2xl",
                    s.activeBgClass,
                    s.activeTextClass,
                  )}
                >
                  <span aria-hidden>{s.emoji}</span>
                  {s.en}
                </div>
                <p className="mt-2 text-base font-bold text-ink-soft">{s.hi}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {SCENE_ART[s.id].map((id) => (
                    <MiniTile key={id} wordId={id} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ——— Breakdown loop ——— */}
        <section className="storybook-card p-6 sm:p-10">
          <h2 className="font-story text-4xl text-ink">Breakdowns teach the board</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Tap a word", d: "The child taps “help” — it lands in the sentence strip." },
              { n: "2", t: "↩ not that", d: "They didn't mean “help”. One tap logs the correction as signal, not failure." },
              { n: "3", t: "The board shifts", d: "That word moves down; words that fit what they meant move up. Next time, it's already there." },
            ].map((step) => (
              <div key={step.n} className="storybook-note bg-muted p-5">
                <span className="flex size-11 items-center justify-center rounded-full border-2 border-gold bg-marigold font-story text-2xl text-ink-on-marigold">
                  {step.n}
                </span>
                <h3 className="mt-3 font-story text-2xl">{step.t}</h3>
                <p className="mt-1.5 text-base leading-relaxed text-ink-soft">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ——— Formula ——— */}
        <section className="py-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-story text-4xl text-ink">
                One readable formula — not a black box
              </h2>
              <p className="mt-3 text-lg leading-relaxed font-semibold text-ink-soft">
                Rule-based scoring runs in the browser: no model call, no
                latency, works offline. Communication value deliberately boosts
                core words, feelings, refusals, and repair phrases above
                preferred objects — the board never just optimizes for what's
                easiest to tap.
              </p>
              <PillLink to="/board" className="mt-6">
                Try the loop yourself
                <ArrowRight className="size-5" aria-hidden />
              </PillLink>
            </div>
            <div className="storybook-note bg-muted p-6">
              {FORMULA_LINES.map((line) => (
                <p key={line} className="font-story text-xl leading-loose text-ink">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ——— Promises ——— */}
        <section className="storybook-card p-6 sm:p-10">
          <h2 className="font-story text-4xl text-ink">The lines we won't cross</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {PROMISES.map((p) => (
              <li key={p} className="flex gap-3 storybook-note bg-muted p-4">
                <Check className="mt-0.5 size-6 shrink-0 text-gold" aria-hidden />
                <p className="text-base leading-relaxed font-semibold text-ink">{p}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ——— Final CTA ——— */}
        <section className="py-14 text-center">
          <div className="storybook-card mx-auto max-w-2xl px-6 py-10">
            <h2 className="font-story text-4xl text-ink sm:text-5xl">
              A sturdy, honest board for a child you love
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg font-semibold text-ink-soft">
              Free core, offline-first, on-device by default. Hindi and English
              are both first-class from day one.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <PillLink to="/start">Begin the story</PillLink>
              <PillLink to="/insights" tone="cream">
                Caregiver insights
              </PillLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-4 border-t-2 border-line bg-card/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-base font-semibold text-ink-soft sm:flex-row">
          <span className="flex items-center gap-2">
            <ListChecks className="size-5" aria-hidden />
            Sahaayak — सहायक, “the helper”
          </span>
          <span className="flex items-center gap-1.5">
            <CloudUpload className="size-5" aria-hidden />
            on-device by default · sync is opt-in
          </span>
        </div>
      </footer>
    </div>
  );
}
