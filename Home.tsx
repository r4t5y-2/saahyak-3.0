import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Play, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { usePrefs } from "@/components/PrefsProvider";
import { SceneTabs } from "@/components/board/SceneTabs";
import { last14Days, currentStreak, trySuggestion } from "@/lib/progress";
import { findWord, wordLabel } from "@/lib/vocabulary";
import { listCustomScenes, loadEnabledScenes } from "@/lib/customScenes";
import { cn } from "@/lib/utils";
import type { SceneId } from "@/lib/vocabulary";
import type { SceneTab } from "@/components/board/BoardProvider";

/**
 * Home / Today — the child's landing screen. Warm but quiet: the mascot sits
 * in a small static corner spot, the scene switcher is one tap away, and the
 * progress summary is compact, not the main event.
 */
export default function Home() {
  const { prefs } = usePrefs();
  const [scene, setScene] = useState<SceneId>(() => {
    try {
      return (window.localStorage.getItem("sahaayak:v1:scene") as SceneId) ?? "home";
    } catch {
      return "home";
    }
  });

  const tabs = useMemo<SceneTab[]>(() => {
    const enabled = new Set(loadEnabledScenes());
    return [
      ...SCENES_TABS_BUILT_IN.filter((s) => enabled.has(s.id)),
      ...listCustomScenes().map((s) => ({
        id: s.id,
        en: s.en,
        hi: s.hi,
        emoji: s.emoji,
        custom: true,
      })),
    ];
  }, []);

  const days = useMemo(() => last14Days(), []);
  const today = days[days.length - 1];
  const streak = useMemo(() => currentStreak(), []);
  const suggestionId = useMemo(() => trySuggestion(), []);
  const suggestion = suggestionId ? findWord(suggestionId) : undefined;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5">
        {/* ——— Greeting + static mascot ——— */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-ink-soft">{greeting}</p>
            <h1 className="font-display text-3xl font-extrabold">
              {prefs.name ? prefs.name : "friend"}!
            </h1>
          </div>
          {prefs.mascot && (
            <Mascot mood="hello" size={64} className="opacity-95" />
          )}
        </header>

        {/* ——— Current scene + quick switcher ——— */}
        <section aria-label="Scenes" className="rounded-3xl border-2 border-line bg-card p-3">
          <p className="mb-2 px-1 text-base font-bold text-ink-soft">
            where are you right now?
          </p>
          <SceneTabs tabs={tabs} scene={scene} onChange={setScene} lang={prefs.lang} />
        </section>

        {/* ——— Continue where you left off ——— */}
        <Link
          to="/board"
          className="flex items-center gap-4 rounded-3xl border-2 border-primary bg-primary px-5 py-5 text-primary-foreground"
        >
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-primary-foreground/30 bg-surface">
            <Play className="size-7 text-primary" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-extrabold">
              {prefs.lang === "hi" ? "वहीं से जारी रखें" : "Continue where you left off"}
            </span>
            <span className="block text-base font-semibold opacity-85">
              {prefs.lang === "hi" ? "बोर्ड खोलें" : "open the board"}
            </span>
          </span>
          <span aria-hidden className="text-2xl font-extrabold opacity-70">›</span>
        </Link>

        {/* ——— Compact progress summary ——— */}
        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border-2 border-line bg-card px-3 py-4 text-center">
            <p className="text-2xl font-extrabold">{today.taps}</p>
            <p className="text-sm font-bold text-ink-soft">
              {prefs.lang === "hi" ? "टैप आज" : "taps today"}
            </p>
          </div>
          <div className="rounded-2xl border-2 border-line bg-card px-3 py-4 text-center">
            <p className="text-2xl font-extrabold">{today.speaks}</p>
            <p className="text-sm font-bold text-ink-soft">
              {prefs.lang === "hi" ? "बोले आज" : "spoken today"}
            </p>
          </div>
          <div className="rounded-2xl border-2 border-line bg-card px-3 py-4 text-center">
            <p className="text-2xl font-extrabold">{streak}🔥</p>
            <p className="text-sm font-bold text-ink-soft">
              {prefs.lang === "hi" ? "दिन की लय" : "day streak"}
            </p>
          </div>
        </section>

        {/* ——— One "Try this" card ——— */}
        <section
          className={cn(
            "flex items-center gap-4 rounded-3xl border-2 border-marigold bg-marigold-soft p-4",
          )}
        >
          {prefs.mascot && <Mascot mood="think" size={56} />}
          <div className="flex-1">
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-marigold-deep">
              <Sparkles className="size-4" aria-hidden />
              try this today
            </p>
            {suggestion ? (
              <p className="font-display mt-1 text-2xl font-extrabold text-ink">
                {wordLabel(suggestion, prefs.lang)}
              </p>
            ) : (
              <p className="mt-1 text-lg font-bold text-ink">
                {prefs.lang === "hi" ? "आज कुछ नया नहीं — शाबाश!" : "nothing new today — well done!"}
              </p>
            )}
          </div>
          {suggestion && (
            <Link
              to="/board"
              className="min-h-12 shrink-0 rounded-xl border-2 border-marigold-deep bg-surface px-4 py-2.5 text-base font-extrabold text-ink"
            >
              {prefs.lang === "hi" ? "बोर्ड में" : "on the board"}
            </Link>
          )}
        </section>

        {/* ——— Explore & help ——— */}
        <section className="grid grid-cols-2 gap-3">
          <Link
            to="/explore"
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-line bg-card text-center"
          >
            <span aria-hidden className="text-2xl">🧭</span>
            <span className="text-base font-extrabold">Explore words</span>
            <span className="text-sm font-bold text-ink-soft">packs & stories</span>
          </Link>
          <Link
            to="/help"
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-line bg-card text-center"
          >
            <span aria-hidden className="text-2xl">❓</span>
            <span className="text-base font-extrabold">Help</span>
            <span className="text-sm font-bold text-ink-soft">short guides</span>
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

const SCENES_TABS_BUILT_IN: SceneTab[] = [
  { id: "home", en: "Home", hi: "घर", emoji: "🏠" },
  { id: "school", en: "School", hi: "स्कूल", emoji: "🏫" },
  { id: "clinic", en: "Clinic", hi: "क्लिनिक", emoji: "🩺" },
  { id: "grandma", en: "Grandma's House", hi: "नानी का घर", emoji: "🐇" },
  { id: "overwhelmed", en: "Calm Corner", hi: "शांत कोना", emoji: "🌙" },
];
