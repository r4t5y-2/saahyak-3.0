import { useMemo, useState } from "react";
import { PartyPopper, RotateCcw, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { usePrefs } from "@/components/PrefsProvider";
import { badges, currentStreak, trySuggestion } from "@/lib/progress";
import { ALL_WORDS, findWord, wordLabel } from "@/lib/vocabulary";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";

/**
 * Learn / Practice — the low-stakes, gamified space. Momo lives here fully:
 * encouragement, celebration, voice lines. All of it switches off in
 * sensory mode and when Motion is off.
 */

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface Round {
  targetId: string;
  options: string[];
}

function makeRound(): Round {
  const pool = ALL_WORDS.filter((w) => w.cv >= 6);
  const target = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffle(pool.filter((w) => w.id !== target.id)).slice(0, 3);
  return { targetId: target.id, options: shuffle([target.id, ...distractors.map((w) => w.id)]) };
}

export default function Learn() {
  const { prefs } = usePrefs();
  const animated = prefs.motion && prefs.mode === "sunny";

  const streak = useMemo(() => currentStreak(), []);
  const wotdId = useMemo(() => trySuggestion() ?? ALL_WORDS[0].id, []);
  const wotd = findWord(wotdId)!;

  const [round, setRound] = useState<Round>(() => makeRound());
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  function choose(id: string) {
    if (picked) return;
    setPicked(id);
    if (id === round.targetId) {
      setCorrectCount((c) => c + 1);
      if (prefs.sound) speak(wordLabel(findWord(round.targetId)!, prefs.lang), prefs.lang, prefs.voice);
      if ((correctCount + 1) % 3 === 0) {
        setCelebrate(true);
        window.setTimeout(() => setCelebrate(false), 2600);
      }
    } else {
      setWrongCount((c) => c + 1);
    }
  }

  function nextRound() {
    setRound(makeRound());
    setPicked(null);
  }

  const target = findWord(round.targetId)!;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold">Learn & play</h1>
            <p className="mt-1 text-base font-semibold text-ink-soft">
              a quiet place to practice words
            </p>
          </div>
          {prefs.mascot && (
            <Mascot mood={celebrate ? "cheer" : "hello"} animated={animated} size={72} />
          )}
        </header>

        {celebrate && (
          <div
            role="status"
            className="animate-fade-in flex items-center gap-3 rounded-2xl border-2 border-marigold bg-marigold-soft px-4 py-3"
          >
            <PartyPopper className="size-6 shrink-0 text-marigold-deep" aria-hidden />
            <p className="text-lg font-extrabold text-ink">
              {prefs.lang === "hi" ? "शाबाश! तीन सही!" : "Well done! Three in a row!"}
            </p>
          </div>
        )}

        {/* ——— Streak strip ——— */}
        <section className="flex items-center justify-between rounded-2xl border-2 border-line bg-card px-5 py-3">
          <span className="text-base font-bold text-ink-soft">
            {prefs.lang === "hi" ? "लय" : "streak"}
          </span>
          <span className="flex items-center gap-2 text-xl font-extrabold">
            🔥 {streak}{" "}
            <span className="text-base font-bold text-ink-soft">
              {prefs.lang === "hi" ? "दिन" : streak === 1 ? "day" : "days"}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-base font-bold text-success">
            <Trophy className="size-5" aria-hidden />
            {badges().filter((b) => b.earned).length}
          </span>
        </section>

        {/* ——— Word of the day ——— */}
        <section className="rounded-3xl border-2 border-marigold bg-marigold-soft p-5">
          <p className="text-sm font-extrabold text-marigold-deep">word of the day</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-display text-3xl font-extrabold text-ink">
              {wordLabel(wotd, prefs.lang)}
            </p>
            <button
              type="button"
              onClick={() => speak(wordLabel(wotd, prefs.lang), prefs.lang, prefs.voice)}
              aria-label="Hear this word"
              className="min-h-12 rounded-xl border-2 border-marigold-deep bg-surface px-4 py-2.5 text-base font-extrabold text-ink"
            >
              🔊 hear it
            </button>
          </div>
        </section>

        {/* ——— Matching game ——— */}
        <section className="rounded-3xl border-2 border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">
              {prefs.lang === "hi" ? "कौन सा शब्द है…" : "find the word…"}
            </h2>
            <span className="text-base font-bold text-ink-soft">
              ✅ {correctCount} · ❌ {wrongCount}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-paper px-4 py-5">
            <target.icon className="size-14 stroke-[2.25] text-primary" aria-hidden />
            <span className="font-display text-2xl font-extrabold text-ink">
              {wordLabel(target, prefs.lang)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {round.options.map((id) => {
              const w = findWord(id)!;
              const isTarget = id === round.targetId;
              const state =
                picked === null ? "idle" : isTarget ? "right" : picked === id ? "wrong" : "idle";
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => choose(id)}
                  className={cn(
                    "flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-lg font-extrabold focus-visible:outline-none",
                    state === "idle" && "border-line bg-surface text-ink hover:bg-marigold-soft/40",
                    state === "right" && "border-success bg-success/15 text-ink",
                    state === "wrong" && "border-destructive bg-destructive/10 text-ink",
                  )}
                >
                  <w.icon className="size-6 stroke-[2.25] text-primary" aria-hidden />
                  {wordLabel(w, prefs.lang)}
                </button>
              );
            })}
          </div>
          {picked && (
            <button
              type="button"
              onClick={nextRound}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary px-4 py-2.5 text-lg font-extrabold text-primary-foreground"
            >
              <RotateCcw className="size-5" aria-hidden />
              {prefs.lang === "hi" ? "अगला खेल" : "next round"}
            </button>
          )}
        </section>
      </div>
    </AppShell>
  );
}
