import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Eraser, Info, Search, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LearnNote } from "@/components/board/LearnNote";
import { BottomNav } from "@/components/AppShell";
import { LangToggle, SceneTabs } from "@/components/board/SceneTabs";
import { StripChip, WordTile } from "@/components/board/WordTile";
import { useBoard } from "@/components/board/BoardProvider";
import { CORE_WORDS, REPAIR_WORD, findWord, type Word } from "@/lib/vocabulary";

/**
 * The AAC Board — the one screen where visual noise is never allowed:
 * no mascot, no badges, no gradients. It renders inside the sensory-reduced
 * scope regardless of the app's global mode.
 *
 * Layout contract (strict):
 *  - Sentence strip is fixed at the very top: Speak (green) + Clear (red).
 *  - Below it, a stable NON-SCROLLING grid: 8x5 on desktop/tablet, 4x5 on
 *    mobile — every tile keeps its physical position. A strict 6px gap
 *    prevents accidental double-taps.
 *  - The bottom three rows are the persistent core vocabulary in soft teal,
 *    and the relative order of core items NEVER shifts between breakpoints
 *    (mobile shows a prefix of the same sequence).
 *  - Scene rows sit above the core, color-coded by modified Fitzgerald Key.
 */

/**
 * Exactly five rows at every breakpoint — the grid never scrolls. Painted
 * row order: desktop = scene ×3 then core ×2; mobile = core ×3 then scene
 * ×2 (core sits just under the toolbar, mid-screen in thumb reach).
 */
const gridStyle = { gridTemplateRows: "repeat(5, minmax(0, 1fr))" } as const;

/** Soft teal for the persistent core vocabulary rows. */
const CORE_BG = "bg-teal-600/15";
const CORE_BORDER = "border-teal-700/35";
const CORE_ICON = "text-teal-800";

function useIsDesktop(): boolean {
  const [isMd, setIsMd] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setIsMd(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMd;
}

export default function Board() {
  const {
    scene,
    sceneTabs,
    setScene,
    lang,
    setLang,
    query,
    setQuery,
    searchResults,
    strip,
    ranked,
    tapWord,
    removeAt,
    clearStrip,
    speakStrip,
    markRepair,
  } = useBoard();

  const isMd = useIsDesktop();
  const [explainId, setExplainId] = useState<string | null>(null);

  const stripWords = useMemo(
    () => strip.map((id) => findWord(id)).filter((w) => w !== undefined),
    [strip],
  );

  const lastStripId =
    stripWords.length > 0 ? stripWords[stripWords.length - 1].id : null;
  const repairTarget = lastStripId ?? "help";

  const searching = searchResults !== null;
  const searchWords = useMemo(
    () => (searchResults ?? []).map((id) => findWord(id)).filter((w) => w !== undefined),
    [searchResults],
  );

  // 8x5 = 40 cells on desktop/tablet (3 scene rows of 8 + 2 core rows of 8),
  // 4x5 = 20 cells on mobile (2 scene rows of 4 + 3 core rows of 4).
  // Prefix-stable: both breakpoints show the same sequences, just longer or
  // shorter, so no core item ever shifts relative to its neighbors.
  const coreCount = isMd ? 15 : 11; // + the repair tile fills the band
  const sceneCount = isMd ? 24 : 8;
  const coreWords = useMemo(
    () => CORE_WORDS.slice(0, coreCount),
    [coreCount],
  );
  const sceneWords = useMemo(
    () => ranked.slice(0, sceneCount),
    [ranked, sceneCount],
  );
  // Custom scenes may have fewer words than cells — keep the grid shape
  // stable with invisible filler cells instead of shrinking rows.
  const fillers = Math.max(0, sceneCount - sceneWords.length);

  /** A cell in the core rows for a word that is not in the library (never in practice). */
  const placeholderTile = (word: Word, onTap: () => void, strong = false) => (
    <button
      type="button"
      onClick={onTap}
      aria-label={word.en}
      className={cn(
        "@container flex h-full min-h-0 w-full flex-col items-center justify-center gap-[3%] rounded-xl border-[3px] px-1 py-[6%] select-none focus-visible:outline-none",
        CORE_BG,
        strong ? "border-ink/40" : CORE_BORDER,
        "active:border-ink/60",
      )}
    >
      <word.icon
        className={cn("h-[34%] w-[34%] min-h-6 min-w-6 shrink-0 stroke-[2.25]", CORE_ICON)}
        aria-hidden
      />
      <span className="max-w-full text-center leading-[1.05] font-medium whitespace-nowrap text-ink text-[clamp(0.68rem,7.5cqw,1.05rem)]">
        {lang === "hi" ? word.hi : word.en}
      </span>
    </button>
  );

  return (
    <div className="mode-sensory flex h-screen flex-col overflow-hidden bg-paper text-ink">
      {/* ——— Sentence strip: fixed at the very top, always visible ——— */}
      <header className="shrink-0 border-b-2 border-line bg-card px-3 pt-3 pb-3 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div
            role="status"
            aria-label="Sentence strip"
            className="flex min-h-20 flex-wrap items-center gap-2 rounded-xl border-2 border-line bg-paper p-2 sm:min-h-24"
          >
            {stripWords.length === 0 ? (
              <span className="px-2 text-base font-semibold text-ink-soft/80">
                {lang === "hi"
                  ? "शब्दों पर टैप करके वाक्य बनाएँ…"
                  : "tap words to build a sentence…"}
              </span>
            ) : (
              stripWords.map((word, i) => (
                <StripChip
                  key={`${word.id}-${i}`}
                  word={word}
                  lang={lang}
                  highlighted={i === stripWords.length - 1}
                  onRemove={() => removeAt(i)}
                />
              ))
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={stripWords.length === 0}
              onClick={speakStrip}
              className={cn(
                "flex min-h-12 flex-1 items-center justify-center gap-2.5 rounded-xl border-2 px-6 py-2.5 text-lg font-extrabold sm:min-h-14 sm:text-xl focus-visible:outline-none",
                stripWords.length === 0
                  ? "border-line bg-muted text-ink-soft/50"
                  : "border-green-800/30 bg-green-600 text-white hover:bg-green-700",
              )}
            >
              <Volume2 className="size-6 shrink-0 sm:size-7" aria-hidden />
              {lang === "hi" ? "बोलो" : "Speak"}
            </button>
            <button
              type="button"
              disabled={stripWords.length === 0}
              onClick={clearStrip}
              aria-label={lang === "hi" ? "साफ़ करें" : "Clear"}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-lg font-extrabold sm:min-h-14 focus-visible:outline-none",
                stripWords.length === 0
                  ? "border-line bg-muted text-ink-soft/50"
                  : "border-red-900/25 bg-red-500 text-white hover:bg-red-600",
              )}
            >
              <Eraser className="size-6 shrink-0 sm:size-7" aria-hidden />
              <span className="hidden sm:inline">{lang === "hi" ? "साफ़" : "Clear"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ——— Toolbar: brand, scene tabs, search, language ——— */}
      <div className="shrink-0 bg-paper px-3 py-2 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              to="/home"
              className="flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-line bg-card px-2.5 py-1.5 text-base font-extrabold text-primary"
            >
              <span aria-hidden className="text-lg leading-none">🧩</span>
              <span className="hidden sm:inline">Sahaayak</span>
            </Link>
            <SceneTabs tabs={sceneTabs} scene={scene} onChange={setScene} lang={lang} />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-[180px] sm:max-w-xs">
              <Search
                className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-soft"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === "hi" ? "खोजें…" : "search…"}
                aria-label={lang === "hi" ? "सभी शब्द खोजें" : "Search all words"}
                className="w-full rounded-xl border-2 border-line bg-card py-1.5 pr-8 pl-8 text-sm font-semibold text-ink placeholder:text-ink-soft/70 focus-visible:outline-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1 text-ink-soft hover:bg-marigold-soft/50"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>
            <LangToggle lang={lang} onChange={setLang} />
            <Link
              to="/insights"
              className="hidden items-center gap-1.5 rounded-xl border-2 border-line bg-card px-2.5 py-1.5 text-sm font-bold text-ink-soft hover:bg-marigold-soft/50 lg:flex"
            >
              <Info className="size-4 shrink-0" aria-hidden />
              {lang === "hi" ? "देखभाल" : "Insights"}
            </Link>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-3 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <LearnNote />
        </div>
      </div>

      {/* ——— The board ——— */}
      {searching ? (
        <section
          aria-label="Search results"
          className="grid min-h-0 flex-1 grid-flow-dense content-start gap-[6px] overflow-y-auto rounded-2xl border-2 border-line bg-card p-2 sm:grid-cols-4 md:grid-cols-6"
        >
          {searchWords.map((word) => (
            <WordTile key={word.id} word={word} lang={lang} onTap={tapWord} />
          ))}
        </section>
      ) : (
        <div
          className="grid min-h-0 flex-1 grid-cols-4 gap-[6px] px-3 pt-1 pb-2 sm:px-6 md:grid-cols-8"
          style={gridStyle}
        >
          {/* Scene rows: on desktop they are the top three rows; on mobile
              they slide below the core band (order). Same words, same order,
              and each keeps its row-internal column position — the board
              stays physically stable at both breakpoints. */}
          {sceneWords.map((scored) => (
            <div
              key={scored.word.id}
              className="relative order-2 h-full min-h-0 md:order-1"
            >
              <WordTile word={scored.word} lang={lang} onTap={tapWord} />
              <button
                type="button"
                aria-label="Why is this here?"
                className="absolute -top-1.5 -right-1.5 z-10 flex size-6 items-center justify-center rounded-full border-2 border-line bg-card text-ink-soft opacity-70 hover:opacity-100 focus-visible:outline-none"
                onClick={() =>
                  setExplainId(explainId === scored.word.id ? null : scored.word.id)
                }
              >
                <span className="text-xs font-extrabold">i</span>
              </button>
              {explainId === scored.word.id && (
                <div
                  role="note"
                  className="absolute top-full right-0 left-0 z-20 mt-1 rounded-xl border-2 border-line bg-card p-2 text-xs leading-snug font-semibold text-ink-soft"
                >
                  {scored.parts
                    .filter((p) => p.points > 0)
                    .map((p) => p.why)
                    .join(" · ")}
                </div>
              )}
            </div>
          ))}

          {/* Core rows: the persistent soft-teal band — bottom three rows on
              mobile (thumb reach), bottom two-plus on desktop. Same items,
              same prefix order at both breakpoints, and the ↩ not-that
              repair control is always the LAST tile of the band. */}
          {coreWords.map((word) => (
            <div key={word.id} className="order-1 h-full min-h-0 md:order-2">
              <WordTile word={word} lang={lang} onTap={tapWord} quiet />
            </div>
          ))}
          <div className="order-1 h-full min-h-0 md:order-2">
            {placeholderTile(REPAIR_WORD, () => markRepair(repairTarget), true)}
          </div>
          {Array.from({ length: fillers }, (_, i) => (
            <div key={`filler-${i}`} aria-hidden className="order-2 md:order-1" />
          ))}
        </div>
      )}

      {/* Reserve exactly the height of the fixed bottom nav — the board itself
          never scrolls and nothing slides underneath it. */}
      <div className="h-16 shrink-0" aria-hidden />
      <BottomNav />
    </div>
  );
}
