import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ChevronRight, PartyPopper, Plus, Volume2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { usePrefs } from "@/components/PrefsProvider";
import { ALL_WORDS, findWord, wordLabel, type Word } from "@/lib/vocabulary";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";

/**
 * Explore — browse vocabulary packs by theme and practice sequencing in
 * story mode. Tapping a word here always speaks the child's own tap; nothing
 * is ever spoken automatically.
 */

const PACKS: { id: string; en: string; hi: string; emoji: string; match: (w: Word) => boolean }[] = [
  {
    id: "family",
    en: "Family & people",
    hi: "परिवार",
    emoji: "👨‍👩‍👧",
    match: (w) => ["grandma", "mum", "dad", "friend", "teacher", "doctor", "nurse"].includes(w.id),
  },
  {
    id: "feelings",
    en: "Feelings",
    hi: "भावनाएँ",
    emoji: "💛",
    match: (w) => ["happy", "sad", "scared", "scared2", "angry", "tired", "dizzy", "feelings", "love-you"].includes(w.id),
  },
  {
    id: "food",
    en: "Food & drink",
    hi: "खाना-पीना",
    emoji: "🍎",
    match: (w) =>
      ["hungry", "eat", "drink", "milk", "water", "banana", "eggs", "roti", "fruit", "biscuit", "cake", "snack", "ice-cream", "lunch"].includes(w.id),
  },
  {
    id: "actions",
    en: "Doing words",
    hi: "काम",
    emoji: "🏃",
    match: (w) =>
      ["go", "play", "walk", "read", "write", "draw", "paint", "again", "repeat", "stop", "wait", "break", "come-back", "hug", "hug2"].includes(w.id),
  },
  {
    id: "body",
    en: "Body & health",
    hi: "शरीर",
    emoji: "🩹",
    match: (w) =>
      ["pain", "hurt", "hurt2", "hurts-here", "head", "tummy", "tummy2", "ear", "throat", "fever", "cough", "medicine", "injection", "bandage"].includes(w.id),
  },
  {
    id: "calm",
    en: "Feeling calm",
    hi: "शांति",
    emoji: "🌊",
    match: (w) =>
      ["quiet", "quiet2", "space", "alone", "deep-breath", "dark", "music-quiet", "rain", "waves", "weighted", "squeeze", "safe", "slow-down", "snail2"].includes(w.id),
  },
  {
    id: "school",
    en: "School things",
    hi: "स्कूल",
    emoji: "🎒",
    match: (w) =>
      ["book", "backpack", "bus", "class", "bell", "puzzle", "blocks", "prize", "star", "finished", "understand", "dont-understand", "answer", "question"].includes(w.id),
  },
  {
    id: "important",
    en: "Most important words",
    hi: "ज़रूरी शब्द",
    emoji: "⭐",
    match: (w) => w.cv >= 9,
  },
];

const STORIES: { id: string; en: string; hi: string; emoji: string; steps: string[] }[] = [
  {
    id: "grandma",
    en: "Visiting grandma",
    hi: "दादी के घर",
    emoji: "💝",
    steps: ["grandma", "go", "house", "love-you"],
  },
  {
    id: "school-day",
    en: "My school day",
    hi: "मेरा स्कूल दिन",
    emoji: "🎒",
    steps: ["bus", "class", "book", "finished", "home2"],
  },
  {
    id: "not-feeling-well",
    en: "Not feeling well",
    hi: "तबीयत ठीक नहीं",
    emoji: "🤒",
    steps: ["tummy", "pain", "mum2", "rest"],
  },
];

export default function Explore() {
  const { prefs } = usePrefs();
  const [packId, setPackId] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const pack = packId ? PACKS.find((p) => p.id === packId) : undefined;
  const packWords = useMemo(
    () => (pack ? ALL_WORDS.filter((w) => pack.match(w)) : []),
    [pack],
  );

  const story = storyId ? STORIES.find((s) => s.id === storyId) : undefined;
  const storyDone = story && stepIndex >= story.steps.length;

  function hear(word: Word) {
    speak(wordLabel(word, prefs.lang), prefs.lang, prefs.voice);
  }

  function startStory(id: string) {
    setStoryId(id);
    setStepIndex(0);
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5">
        <header className="flex items-center gap-3">
          {(pack || story) && (
            <button
              type="button"
              aria-label="Back"
              onClick={() => {
                setPackId(null);
                setStoryId(null);
                setStepIndex(0);
              }}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-line bg-card text-ink-soft"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </button>
          )}
          <div>
            <h1 className="font-display text-3xl font-extrabold">Explore</h1>
            <p className="text-base font-semibold text-ink-soft">
              {pack ? pack.en : story ? "story mode" : "word packs & stories"}
            </p>
          </div>
        </header>

        {/* ——— Story mode ——— */}
        {story && (
          <section className="rounded-3xl border-2 border-line bg-card p-5">
            <p className="text-lg font-extrabold">
              <span aria-hidden className="mr-2">{story.emoji}</span>
              {prefs.lang === "hi" ? story.hi : story.en}
            </p>
            {!storyDone ? (
              <>
                <div className="mt-3 flex items-center gap-1.5" aria-hidden>
                  {story.steps.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-2.5 w-8 rounded-full",
                        i < stepIndex ? "bg-primary" : i === stepIndex ? "bg-marigold" : "bg-line",
                      )}
                    />
                  ))}
                </div>
                <p className="mt-4 text-base font-bold text-ink-soft">
                  {prefs.lang === "hi" ? "अगला शब्द चुनें:" : "tap the next word of the story:"}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {story.steps.map((id, i) => {
                    const w = findWord(id);
                    if (!w) return null;
                    const isNext = i === stepIndex;
                    const done = i < stepIndex;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          if (!isNext) return;
                          hear(w);
                          setStepIndex((s) => s + 1);
                        }}
                        className={cn(
                          "flex min-h-16 items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-base font-extrabold",
                          done
                            ? "border-success bg-success/10 text-ink"
                            : isNext
                              ? "border-marigold bg-marigold-soft text-ink"
                              : "border-line bg-surface text-ink-soft opacity-50",
                        )}
                      >
                        <w.icon className="size-6 shrink-0 stroke-[2.25] text-primary" aria-hidden />
                        {wordLabel(w, prefs.lang)}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-marigold bg-marigold-soft px-4 py-4">
                <PartyPopper className="size-7 shrink-0 text-marigold-deep" aria-hidden />
                <p className="flex-1 text-lg font-extrabold">
                  {prefs.lang === "hi" ? "कहानी पूरी! 🎉" : "Story told! 🎉"}
                </p>
                <button
                  type="button"
                  onClick={() => startStory(story.id)}
                  className="min-h-12 rounded-xl border-2 border-marigold-deep bg-surface px-4 py-2.5 text-base font-extrabold"
                >
                  again
                </button>
              </div>
            )}
          </section>
        )}

        {/* ——— Pack detail ——— */}
        {pack && !story && (
          <section>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {packWords.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => hear(w)}
                  className="flex aspect-square min-h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-line bg-surface px-2 py-4 text-center focus-visible:outline-none"
                >
                  <w.icon className="size-10 shrink-0 stroke-[2.25] text-primary" aria-hidden />
                  <span className="text-base leading-tight font-bold break-words text-ink">
                    {wordLabel(w, prefs.lang)}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-base font-semibold text-ink-soft">
              <Volume2 className="size-5" aria-hidden />
              tap a word to hear it
            </p>
          </section>
        )}

        {/* ——— Landing lists ——— */}
        {!pack && !story && (
          <>
            <section className="grid gap-3 sm:grid-cols-2">
              {PACKS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPackId(p.id)}
                  className="flex min-h-20 items-center justify-between rounded-3xl border-2 border-line bg-card px-5 py-4 text-left focus-visible:outline-none hover:border-primary"
                >
                  <span className="flex items-center gap-3 text-lg font-extrabold">
                    <span aria-hidden className="text-2xl">{p.emoji}</span>
                    {prefs.lang === "hi" ? p.hi : p.en}
                  </span>
                  <ChevronRight className="size-6 text-ink-soft" aria-hidden />
                </button>
              ))}
            </section>

            <section className="rounded-3xl border-2 border-line bg-card p-5">
              <h2 className="text-lg font-extrabold">story mode</h2>
              <p className="mt-1 text-base font-semibold text-ink-soft">
                tell a little story, one word at a time
              </p>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                {STORIES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => startStory(s.id)}
                    className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-line bg-surface px-3 py-4 text-center focus-visible:outline-none hover:border-primary"
                  >
                    <span aria-hidden className="text-3xl">{s.emoji}</span>
                    <span className="text-base leading-tight font-extrabold">
                      {prefs.lang === "hi" ? s.hi : s.en}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <Link
              to="/care"
              className="flex min-h-16 items-center justify-between rounded-3xl border-2 border-dashed border-line bg-card px-5 py-4"
            >
              <span className="flex items-center gap-3 text-lg font-extrabold text-ink">
                <Plus className="size-6 text-primary" aria-hidden />
                make your own scene
              </span>
              <ChevronRight className="size-6 text-ink-soft" aria-hidden />
            </Link>
          </>
        )}
      </div>
    </AppShell>
  );
}
