import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  Languages,
  Trash2,
  User,
  Volume2,
  WifiOff,
} from "lucide-react";
import { backend } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { usePrefs } from "@/components/PrefsProvider";
import { speak, ttsSupported } from "@/lib/tts";
import { loadPrefs, savePrefs } from "@/lib/prefs";
import { clearLog } from "@/lib/eventLog";
import { cn } from "@/lib/utils";

/**
 * Settings — accessibility first, then the Mode A/B bridge, voice, language,
 * and the account & data controls. Everything here is revisitable.
 */
export default function Settings() {
  const { prefs, setMode, setLang, setTextSize, setMotion, setSound, setMascot, setContrast, setVoice } =
    usePrefs();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useMemo(() => {
    if (ttsSupported) setVoices(window.speechSynthesis.getVoices());
  }, []);

  const [mirrorCount, setMirrorCount] = useState(0);

  useEffect(() => {
    // The count is informational; failure simply means the user is not sharing.
    void backend.getEvents().then((events) => setMirrorCount(events.length)).catch(() => setMirrorCount(0));
  }, []);

  function exportData() {
    const lines: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("sahaayak:")) {
        lines.push(`## ${key}`);
        lines.push(window.localStorage.getItem(key) ?? "");
      }
    }
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sahaayak-data.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5">
        <header>
          <h1 className="font-display text-3xl font-extrabold">Settings</h1>
          <p className="mt-1 text-base font-semibold text-ink-soft">
            comfort first — revisit any time
          </p>
        </header>

        {/* ——— Accessibility ——— */}
        <Section title="Accessibility" icon={<Eye className="size-5" aria-hidden />}>
          <Row label="Text size">
            <Segmented
              options={[
                { id: "normal", label: "A" },
                { id: "large", label: "A+" },
                { id: "xlarge", label: "A++" },
              ]}
              value={prefs.textSize}
              onChange={(v) => setTextSize(v as typeof prefs.textSize)}
            />
          </Row>
          <Row label="High-contrast text">
            <Switch value={prefs.contrast} onChange={setContrast} />
          </Row>
          <Row label="Motion & mascot animations">
            <Switch value={prefs.motion} onChange={setMotion} />
          </Row>
          <Row label="Sounds & voice lines">
            <Switch value={prefs.sound} onChange={setSound} />
          </Row>
          <Row label="Show Momo (mascot)">
            <Switch value={prefs.mascot} onChange={setMascot} />
          </Row>
        </Section>

        {/* ——— Sensory mode ——— */}
        <Section title="Sensory mode" icon={<WifiOff className="size-5" aria-hidden />}>
          <p className="text-base leading-relaxed font-semibold text-ink-soft">
            Calm mode mutes colors, removes the mascot and disables all animation — everywhere.
            The Board always uses calm colors regardless of this setting.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("sunny")}
              className={cn(
                "min-h-16 rounded-2xl border-2 px-4 py-3 text-base font-extrabold focus-visible:outline-none",
                prefs.mode === "sunny"
                  ? "border-marigold bg-marigold-soft text-ink"
                  : "border-line bg-surface text-ink-soft",
              )}
            >
              ☀️ Sunny
              <span className="block text-sm font-bold text-ink-soft">bright & friendly</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("sensory")}
              className={cn(
                "min-h-16 rounded-2xl border-2 px-4 py-3 text-base font-extrabold focus-visible:outline-none",
                prefs.mode === "sensory"
                  ? "border-marigold bg-marigold-soft text-ink"
                  : "border-line bg-surface text-ink-soft",
              )}
            >
              🌙 Calm
              <span className="block text-sm font-bold text-ink-soft">low sensory load</span>
            </button>
          </div>
        </Section>

        {/* ——— Voice ——— */}
        <Section title="Voice" icon={<Volume2 className="size-5" aria-hidden />}>
          <Row label="Test voice">
            <button
              type="button"
              onClick={() => speak("Hello! This is my voice.", prefs.lang, prefs.voice)}
              className="min-h-12 rounded-xl border-2 border-line bg-surface px-4 py-2.5 text-base font-bold text-ink"
            >
              ▶ play
            </button>
          </Row>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {voices.slice(0, 8).map((v) => (
              <button
                key={v.voiceURI}
                type="button"
                onClick={() => setVoice(v.name)}
                className={cn(
                  "flex w-full min-h-12 items-center justify-between rounded-xl border-2 px-4 py-2.5 text-base font-bold focus-visible:outline-none",
                  prefs.voice === v.name
                    ? "border-marigold bg-marigold-soft text-ink"
                    : "border-line bg-surface text-ink-soft",
                )}
              >
                <span className="truncate">{v.name}</span>
                <span className="ml-3 shrink-0 text-sm text-ink-soft">{v.lang}</span>
              </button>
            ))}
            {voices.length === 0 && (
              <p className="text-sm font-semibold text-ink-soft">
                System voices appear here when the browser provides them.
              </p>
            )}
          </div>
        </Section>

        {/* ——— Language ——— */}
        <Section title="Language" icon={<Languages className="size-5" aria-hidden />}>
          <Row label="Word language">
            <Segmented
              options={[
                { id: "en", label: "English" },
                { id: "hi", label: "हिंदी" },
              ]}
              value={prefs.lang}
              onChange={(v) => setLang(v as "en" | "hi")}
            />
          </Row>
        </Section>

        {/* ——— Account & data ——— */}
        <Section title="Account & data" icon={<User className="size-5" aria-hidden />}>
          <p className="text-base leading-relaxed font-semibold text-ink-soft">
            Everything runs on this device by default. The account only powers opt-in sync
            ({mirrorCount} rows mirrored right now).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportData}
              className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-line bg-surface px-4 py-2.5 text-base font-bold text-ink"
            >
              <Download className="size-5" aria-hidden />
              export my data
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Delete all activity data on this device?")) {
                  clearLog();
                  savePrefs(loadPrefs());
                  window.location.reload();
                }
              }}
              className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-destructive bg-destructive/10 px-4 py-2.5 text-base font-bold text-destructive"
            >
              <Trash2 className="size-5" aria-hidden />
              delete activity data
            </button>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border-2 border-line bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-2">
      <span className="text-base font-bold">{label}</span>
      {children}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-xl border-2 border-line">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "min-h-12 px-4 py-2.5 text-base font-bold focus-visible:outline-none",
            value === o.id ? "bg-marigold text-ink-on-marigold" : "bg-surface text-ink-soft",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="focus-visible:outline-none"
      aria-label="toggle"
    >
      <span
        aria-hidden
        className={cn(
          "flex h-8 w-14 items-center rounded-full border-2 p-0.5",
          value ? "border-primary bg-primary" : "border-line bg-muted",
        )}
      >
        <span className={cn("size-6 rounded-full bg-surface", value && "ml-auto")} />
      </span>
    </button>
  );
}
