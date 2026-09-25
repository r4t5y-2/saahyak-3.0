import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefs } from "@/components/PrefsProvider";
import { Mascot } from "@/components/Mascot";
import { speak } from "@/lib/tts";
import { saveEnabledScenes } from "@/lib/customScenes";
import { SCENES, type BuiltInSceneId } from "@/lib/vocabulary";
import type { Role, TextSize } from "@/lib/prefs";

/**
 * Onboarding — five short steps, each skippable. The mascot greets with a
 * voice line and a big tap-to-continue: no reading required to start.
 */

const ROLES: { id: Role; en: string; hi: string; emoji: string }[] = [
  { id: "child", en: "A child", hi: "बच्चा", emoji: "🧒" },
  { id: "parent", en: "A parent", hi: "माता-पिता", emoji: "👨‍👩‍👧" },
  { id: "teacher", en: "A teacher", hi: "शिक्षक", emoji: "🏫" },
  { id: "therapist", en: "A therapist", hi: "चिकित्सक", emoji: "🩺" },
];

export default function Start() {
  const navigate = useNavigate();
  const { prefs, setRole, setName, setLang, setTextSize, setMotion, setSound, setMode } =
    usePrefs();
  const [step, setStep] = useState(0);
  const [name, setNameLocal] = useState(prefs.name);
  const [pickedScenes, setPickedScenes] = useState<BuiltInSceneId[]>([
    "home",
    "school",
    "clinic",
  ]);

  function next() {
    setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }
  function finish() {
    saveEnabledScenes(pickedScenes.length > 0 ? pickedScenes : ["home", "school", "clinic"]);
    navigate("/home");
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-8">
        {/* progress dots — position never changes, one step at a time */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                "h-2.5 w-8 rounded-full",
                i === step ? "bg-marigold" : i < step ? "bg-primary" : "bg-line",
              )}
            />
          ))}
        </div>

        {step === 0 && (
          <section className="animate-fade-in flex flex-1 flex-col items-center justify-center text-center">
            <Mascot mood="hello" animated={prefs.motion} size={140} />
            <h1 className="font-display mt-6 text-4xl font-extrabold">नमस्ते! Hello!</h1>
            <p className="mt-3 max-w-sm text-lg leading-relaxed text-ink-soft">
              I'm Momo. I help you find your words.
            </p>
            <button
              type="button"
              onClick={() => {
                if (prefs.sound) speak("Hello! Let's get started.", "en", prefs.voice);
                next();
              }}
              className="mt-10 min-h-16 rounded-2xl border-2 border-primary bg-primary px-10 py-4 text-xl font-extrabold text-primary-foreground"
            >
              Tap to continue
            </button>
            <Link to="/home" className="mt-4 text-base font-bold text-ink-soft underline">
              skip setup
            </Link>
          </section>
        )}

        {step === 1 && (
          <section className="animate-fade-in flex flex-1 flex-col justify-center">
            <h1 className="font-display text-3xl font-extrabold">Who's using this today?</h1>
            <p className="mt-2 text-lg text-ink-soft">You can change this later in Settings.</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 px-4 py-5 text-lg font-extrabold focus-visible:outline-none",
                    prefs.role === r.id
                      ? "border-marigold bg-marigold-soft text-ink"
                      : "border-line bg-card text-ink hover:bg-marigold-soft/40",
                  )}
                >
                  <span aria-hidden className="text-3xl">{r.emoji}</span>
                  {r.en}
                  <span className="text-base font-bold text-ink-soft">{r.hi}</span>
                </button>
              ))}
            </div>
            <NavRow onBack={back} onNext={next} />
          </section>
        )}

        {step === 2 && (
          <section className="animate-fade-in flex flex-1 flex-col justify-center">
            <h1 className="font-display text-3xl font-extrabold">Pick a language pack</h1>
            <p className="mt-2 text-lg text-ink-soft">
              Hindi and English are both first-class — the board works fully in either.
            </p>
            <div className="mt-8 space-y-3">
              {(
                [
                  { id: "en", label: "English", sub: "टैप करें या English चुनें" },
                  { id: "hi", label: "हिंदी", sub: "English भी हमेशा उपलब्ध" },
                ] as const
              ).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLang(l.id);
                    setName(name);
                  }}
                  className={cn(
                    "flex w-full min-h-16 items-center justify-between rounded-2xl border-2 px-5 py-4 text-lg font-extrabold focus-visible:outline-none",
                    prefs.lang === l.id
                      ? "border-marigold bg-marigold-soft"
                      : "border-line bg-card hover:bg-marigold-soft/40",
                  )}
                >
                  <span>
                    {l.label}
                    <span className="ml-3 text-base font-bold text-ink-soft">{l.sub}</span>
                  </span>
                  {prefs.lang === l.id && <Check className="size-6 text-primary" aria-hidden />}
                </button>
              ))}
            </div>
            <NavRow onBack={back} onNext={next} />
          </section>
        )}

        {step === 3 && (
          <section className="animate-fade-in flex flex-1 flex-col justify-center">
            <h1 className="font-display text-3xl font-extrabold">Starting scenes</h1>
            <p className="mt-2 text-lg text-ink-soft">
              Pick where the words should begin. You can add more — even your own scenes — later.
            </p>
            <label
              htmlFor="child-name"
              className="mt-6 text-base font-bold text-ink-soft"
            >
              Child's first name (optional, stays on this device)
            </label>
            <input
              id="child-name"
              value={name}
              onChange={(e) => {
                setNameLocal(e.target.value);
                setName(e.target.value);
              }}
              placeholder="e.g. Aarav"
              className="mt-2 min-h-14 w-full rounded-2xl border-2 border-line bg-card px-4 text-lg font-semibold text-ink placeholder:text-ink-soft/60 focus-visible:outline-none"
            />
            <div className="mt-6 grid grid-cols-2 gap-3">
              {SCENES.map((s) => {
                const picked = pickedScenes.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setPickedScenes((prev) =>
                        prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                      )
                    }
                    className={cn(
                      "flex min-h-20 items-center gap-3 rounded-2xl border-2 px-4 py-4 text-lg font-extrabold focus-visible:outline-none",
                      picked
                        ? cn(s.activeBgClass, s.activeTextClass)
                        : "border-line bg-card text-ink hover:bg-marigold-soft/40",
                    )}
                  >
                    <span aria-hidden className="text-2xl">{s.emoji}</span>
                    {s.en}
                    {picked && <Check className="ml-auto size-6" aria-hidden />}
                  </button>
                );
              })}
            </div>
            <NavRow onBack={back} onNext={next} />
          </section>
        )}

        {step === 4 && (
          <section className="animate-fade-in flex flex-1 flex-col justify-center">
            <h1 className="font-display text-3xl font-extrabold">Comfort setup</h1>
            <p className="mt-2 text-lg text-ink-soft">
              Skippable — everything here lives in Settings forever.
            </p>
            <div className="mt-6 space-y-5">
              <ChoiceRow
                label="Text size"
                options={[
                  { id: "normal", label: "Normal" },
                  { id: "large", label: "Large" },
                  { id: "xlarge", label: "Extra large" },
                ]}
                value={prefs.textSize}
                onChange={(v) => setTextSize(v as TextSize)}
              />
              <ChoiceRow
                label="Colors"
                options={[
                  { id: "sunny", label: "Sunny (bright)" },
                  { id: "sensory", label: "Calm (low sensory)" },
                ]}
                value={prefs.mode}
                onChange={(v) => setMode(v as "sunny" | "sensory")}
              />
              <ToggleRow label="Motion & mascot animations" value={prefs.motion} onChange={setMotion} />
              <ToggleRow label="Sounds & voice lines" value={prefs.sound} onChange={setSound} />
            </div>
            <button
              type="button"
              onClick={finish}
              className="mt-8 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary px-6 py-4 text-xl font-extrabold text-primary-foreground"
            >
              Start using Sahaayak
              <ArrowRight className="size-6" aria-hidden />
            </button>
            <NavRow onBack={back} onNext={undefined} />
          </section>
        )}
      </div>
    </div>
  );
}

function NavRow({ onBack, onNext }: { onBack: () => void; onNext?: () => void }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="min-h-12 rounded-xl border-2 border-line bg-card px-5 py-2.5 text-base font-bold text-ink-soft"
      >
        Back
      </button>
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-primary bg-primary px-6 py-2.5 text-lg font-extrabold text-primary-foreground"
        >
          Next <ArrowRight className="size-5" aria-hidden />
        </button>
      )}
    </div>
  );
}

function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-base font-bold text-ink-soft">{label}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "min-h-12 rounded-xl border-2 px-2 py-2.5 text-base font-bold focus-visible:outline-none",
              value === o.id
                ? "border-marigold bg-marigold-soft text-ink"
                : "border-line bg-card text-ink-soft hover:bg-marigold-soft/40",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full min-h-14 items-center justify-between rounded-2xl border-2 border-line bg-card px-4 py-3 text-base font-bold focus-visible:outline-none"
    >
      {label}
      <span
        aria-hidden
        className={cn(
          "flex h-8 w-14 items-center rounded-full border-2 p-0.5",
          value ? "border-primary bg-primary" : "border-line bg-muted",
        )}
      >
        <span
          className={cn(
            "size-6 rounded-full bg-surface transition-none",
            value && "ml-auto",
          )}
        />
      </span>
    </button>
  );
}
