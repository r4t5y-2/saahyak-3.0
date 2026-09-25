import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ClipboardPlus,
  Eye,
  EyeOff,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { usePrefs } from "@/components/PrefsProvider";
import { categoryBg, categoryBorder } from "@/components/board/WordTile";
import { vocabularyGaps } from "@/lib/progress";
import {
  listCustomScenes,
  saveCustomScene,
  deleteCustomScene,
  CUSTOM_SCENE_LIMITS,
} from "@/lib/customScenes";
import { ALL_WORDS, findWord } from "@/lib/vocabulary";
import { loadRepairs } from "@/lib/eventLog";
import { speak } from "@/lib/tts";
import { cn } from "@/lib/utils";

/**
 * Caregiver / Teacher Portal — a separate, permissioned space: which scenes
 * are active, recent "not that" patterns, vocabulary gaps, a scene editor
 * with a full audit trail for vocabulary removal, and role management.
 */

type CareRole = "parent" | "teacher" | "therapist";

const ROLE_META: Record<CareRole, { label: string; scope: string; emoji: string }> = {
  parent: { label: "Parent", scope: "everything on this device", emoji: "👨‍👩‍👧" },
  teacher: { label: "Teacher", scope: "school scene + progress", emoji: "🏫" },
  therapist: { label: "Therapist", scope: "progress + learning log", emoji: "🩺" },
};

interface AuditEntry {
  action: string;
  detail: string;
  at: number;
}

function loadAudit(): AuditEntry[] {
  try {
    const raw = window.localStorage.getItem("sahaayak:v1:audit");
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

function pushAudit(action: string, detail: string) {
  const entries = loadAudit();
  entries.push({ action, detail, at: Date.now() });
  try {
    window.localStorage.setItem("sahaayak:v1:audit", JSON.stringify(entries.slice(-80)));
  } catch {
    // best-effort
  }
}

export default function Care() {
  const { prefs } = usePrefs();
  const [roles, setRoles] = useState<CareRole[]>(["parent"]);
  const [audit, setAudit] = useState<AuditEntry[]>(() => loadAudit());
  const [scenesVersion, setScenesVersion] = useState(0);
  const [editorScene, setEditorScene] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const scenes = useMemo(() => listCustomScenes(), [scenesVersion]);
  const gaps = useMemo(() => vocabularyGaps(), []);
  const repairs = useMemo(() => loadRepairs().slice(-8).reverse(), []);

  function refresh() {
    setScenesVersion((v) => v + 1);
    setAudit(loadAudit());
  }

  function createScene() {
    const en = title.trim();
    if (!en) return;
    const id = `custom-${Date.now()}`;
    saveCustomScene({ id, en, hi: en, emoji: "✨", wordIds: [] });
    pushAudit("scene created", en);
    setEditorScene(id);
    setTitle("");
    refresh();
  }

  function addWord(sceneId: string, wordId: string) {
    const scene = listCustomScenes().find((s) => s.id === sceneId);
    if (!scene) return;
    if (scene.wordIds.includes(wordId)) return;
    if (scene.wordIds.length >= CUSTOM_SCENE_LIMITS.MAX_WORDS) return;
    saveCustomScene({ ...scene, wordIds: [...scene.wordIds, wordId] });
    pushAudit("word added", `${findWord(wordId)?.en ?? wordId} → ${scene.en}`);
    refresh();
  }

  function removeWord(sceneId: string, wordId: string) {
    const scene = listCustomScenes().find((s) => s.id === sceneId);
    if (!scene) return;
    saveCustomScene({ ...scene, wordIds: scene.wordIds.filter((w) => w !== wordId) });
    pushAudit("word removed", `${findWord(wordId)?.en ?? wordId} from ${scene.en}`);
    refresh();
  }

  function removeScene(sceneId: string) {
    const scene = listCustomScenes().find((s) => s.id === sceneId);
    if (!scene) return;
    deleteCustomScene(sceneId);
    pushAudit("scene removed", scene.en);
    setEditorScene(null);
    refresh();
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="flex size-11 items-center justify-center rounded-xl border-2 border-line bg-card text-ink-soft"
              aria-label="Back to home"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </Link>
            <div>
              <h1 className="font-display text-3xl font-extrabold">Caregiver portal</h1>
              <p className="text-base font-semibold text-ink-soft">
                {prefs.name ? `supporting ${prefs.name}` : "supporting your child"}
              </p>
            </div>
          </div>
          <Link
            to="/insights"
            className="min-h-12 rounded-xl border-2 border-line bg-card px-4 py-2.5 text-base font-bold text-ink-soft"
          >
            device insights
          </Link>
        </header>

        {/* ——— Dashboard: patterns & gaps ——— */}
        <section className="rounded-3xl border-2 border-line bg-card p-5">
          <h2 className="text-lg font-extrabold">Recent “not that” patterns</h2>
          {repairs.length === 0 ? (
            <p className="mt-2 text-base text-ink-soft">No repairs yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {repairs.map((r) => (
                <li key={r.id} className="rounded-xl border-2 border-line bg-paper px-4 py-2.5">
                  <p className="text-base font-bold">
                    rejected <span className="text-marigold-deep">{findWord(r.rejectedId)?.en ?? r.rejectedId}</span>
                    {r.chosenId && (
                      <>
                        {" "}
                        → meant <span className="text-primary">{findWord(r.chosenId)?.en ?? r.chosenId}</span>
                      </>
                    )}
                  </p>
                  <p className="text-sm font-semibold text-ink-soft">{r.scene}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border-2 border-line bg-card p-5">
          <h2 className="text-lg font-extrabold">Vocabulary gaps — core words not yet spoken</h2>
          <div className="mt-3 space-y-2">
            {gaps.map((g) => (
              <p key={g.scene} className="text-base font-semibold">
                <span className="font-extrabold capitalize">{g.scene}:</span>{" "}
                <span className="text-ink-soft">{g.missing.slice(0, 6).join(", ") || "all covered 🎉"}</span>
              </p>
            ))}
          </div>
        </section>

        {/* ——— Scene editor ——— */}
        <section className="rounded-3xl border-2 border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Custom scenes</h2>
            <span className="text-sm font-bold text-ink-soft">
              {scenes.length}/{CUSTOM_SCENE_LIMITS.MAX_SCENES}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="new scene name (e.g. Grandma's house)"
              className="min-h-12 flex-1 rounded-xl border-2 border-line bg-surface px-4 text-base font-semibold text-ink placeholder:text-ink-soft/60 focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={createScene}
              className="flex min-h-12 items-center gap-1.5 rounded-xl border-2 border-primary bg-primary px-4 py-2.5 text-base font-extrabold text-primary-foreground"
            >
              <Plus className="size-5" aria-hidden />
              add
            </button>
          </div>

          {scenes.length === 0 ? (
            <p className="mt-3 text-base text-ink-soft">
              Custom scenes bring chosen words to the front of the board — they never remove
              the always-available row.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {scenes.map((s) => (
                <li key={s.id} className="rounded-2xl border-2 border-line bg-paper p-4">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setEditorScene(editorScene === s.id ? null : s.id)}
                      className="flex items-center gap-2 text-lg font-extrabold"
                    >
                      <span aria-hidden>{s.emoji}</span>
                      {s.en}
                      <span className="text-sm font-bold text-ink-soft">
                        ({s.wordIds.length} words)
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${s.en}`}
                      onClick={() => {
                        if (window.confirm(`Delete scene “${s.en}”?`)) removeScene(s.id);
                      }}
                      className="flex size-10 items-center justify-center rounded-xl border-2 border-destructive/40 text-destructive"
                    >
                      <Trash2 className="size-5" aria-hidden />
                    </button>
                  </div>
                  {editorScene === s.id && (
                    <div className="animate-fade-in mt-3">
                      <div className="flex flex-wrap gap-2">
                        {s.wordIds.map((id) => {
                          const w = findWord(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => removeWord(s.id, id)}
                              className={cn(
                                "flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-base font-bold",
                                w ? cn(categoryBg(w), categoryBorder(w)) : "border-line bg-surface",
                              )}
                            >
                              {w?.en ?? id}
                              <X className="size-4 text-ink-soft" aria-hidden />
                            </button>
                          );
                        })}
                        {s.wordIds.length === 0 && (
                          <p className="text-base text-ink-soft">no words yet — add some below</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPickerOpen(!pickerOpen)}
                        className="mt-3 flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-line bg-surface px-3 py-2 text-base font-bold text-ink-soft"
                      >
                        <ClipboardPlus className="size-5" aria-hidden />
                        {pickerOpen ? "hide word picker" : "add words"}
                      </button>
                      {pickerOpen && (
                        <div className="mt-2 grid max-h-56 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                          {ALL_WORDS.filter((w) => !s.wordIds.includes(w.id)).map((w) => (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => addWord(s.id, w.id)}
                              className={cn(
                                "flex min-h-11 flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-1.5",
                                categoryBg(w),
                                categoryBorder(w),
                              )}
                            >
                              <w.icon className="size-5 stroke-[2.25] text-primary" aria-hidden />
                              <span className="text-xs font-bold">{w.en}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ——— Role management ——— */}
        <section className="rounded-3xl border-2 border-line bg-card p-5">
          <div className="flex items-center gap-2">
            <Users className="size-6 text-primary" aria-hidden />
            <h2 className="text-lg font-extrabold">Who can see what</h2>
          </div>
          <div className="mt-3 space-y-2">
            {(Object.keys(ROLE_META) as CareRole[]).map((r) => {
              const meta = ROLE_META[r];
              const on = roles.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    setRoles((prev) => (on ? prev.filter((x) => x !== r) : [...prev, r]))
                  }
                  className={cn(
                    "flex w-full min-h-14 items-center justify-between rounded-2xl border-2 px-4 py-3 text-left",
                    on ? "border-marigold bg-marigold-soft" : "border-line bg-surface",
                  )}
                >
                  <span className="flex items-center gap-2 text-base font-extrabold">
                    <span aria-hidden>{meta.emoji}</span>
                    {meta.label}
                    <span className="text-sm font-bold text-ink-soft">· {meta.scope}</span>
                  </span>
                  {on ? (
                    <Eye className="size-5 text-primary" aria-hidden />
                  ) : (
                    <EyeOff className="size-5 text-ink-soft" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
            <UserPlus className="size-4" aria-hidden />
            invite co-caregivers by email after deploying with an account
          </p>
        </section>

        {/* ——— Audit trail ——— */}
        <section className="rounded-3xl border-2 border-line bg-card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" aria-hidden />
            <h2 className="text-lg font-extrabold">Audit trail</h2>
          </div>
          {audit.length === 0 ? (
            <p className="mt-2 text-base text-ink-soft">
              Every vocabulary change is recorded here.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {[...audit].reverse().slice(0, 10).map((a, i) => (
                <li key={`${a.at}-${i}`} className="text-base font-semibold">
                  <span className="font-extrabold">{a.action}</span> — {a.detail}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
