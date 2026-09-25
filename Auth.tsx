import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, Rabbit, ShieldCheck, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Sparkle } from "@/components/StoryBackdrop";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, requestOtp, verifyOtp, signInGuest } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      await requestOtp(email);
      setStep({ email });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const code = formData.get("code") as string;
      await verifyOtp(email, code);
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInGuest();
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  const inputClass =
    "min-h-12 w-full rounded-full border-2 border-line bg-muted px-5 text-base font-semibold text-ink placeholder:font-medium placeholder:text-ink-soft/60 focus-visible:outline-none";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 text-ink">
      <div className="storybook-card relative w-full max-w-md px-6 py-10 sm:px-10">
        <Sparkle className="absolute left-5 top-5 size-6 text-story-pink" />
        <Sparkle className="absolute right-6 top-8 size-4 text-story-blue" />
        <Sparkle className="absolute bottom-6 right-8 size-5 text-story-butter" />

        <div className="flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-full border-2 border-gold bg-marigold-soft">
            <Rabbit className="size-9 stroke-[2.25] text-gold" aria-hidden />
          </span>
          <Link to="/" className="mt-3 font-story text-3xl text-gold">
            Sahaayak
          </Link>
          {step === "signIn" ? (
            <p className="mt-1 font-story text-xl text-ink-soft">
              hello! who's reading today?
            </p>
          ) : (
            <p className="mt-1 font-story text-xl text-ink-soft">
              check your letterbox — a code went to {step.email}
            </p>
          )}
        </div>

        {step === "signIn" ? (
          <form onSubmit={handleEmailSubmit} className="mt-7">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft" aria-hidden />
                <input
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  className={`${inputClass} pl-12`}
                  disabled={isLoading}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                aria-label="Send sign-in code"
                className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                ) : (
                  <ArrowRight className="size-5" aria-hidden />
                )}
              </button>
            </div>
            {error && <p className="mt-3 text-base font-bold text-destructive">{error}</p>}

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t-2 border-dashed border-line" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-3 font-story text-lg text-ink-soft">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-line bg-surface px-5 text-base font-extrabold text-ink hover:bg-marigold-soft/60"
            >
              <UserX className="size-5" aria-hidden />
              Continue as guest
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="mt-7">
            <input type="hidden" name="email" value={step.email} />
            <input type="hidden" name="code" value={otp} />

            <div className="flex justify-center">
              <InputOTP
                value={otp}
                onChange={setOtp}
                maxLength={6}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                    const form = (e.target as HTMLElement).closest("form");
                    if (form) {
                      form.requestSubmit();
                    }
                  }
                }}
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && (
              <p className="mt-3 text-center text-base font-bold text-destructive">{error}</p>
            )}
            <p className="mt-4 text-center text-base font-semibold text-ink-soft">
              Didn't receive a code?{" "}
              <button
                type="button"
                onClick={() => setStep("signIn")}
                className="font-extrabold text-gold underline"
              >
                Try again
              </button>
            </p>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-gold bg-primary px-5 text-lg font-extrabold text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  Verifying…
                </>
              ) : (
                <>
                  Verify code
                  <ArrowRight className="size-5" aria-hidden />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep("signIn")}
              disabled={isLoading}
              className="mt-3 min-h-11 w-full rounded-full text-base font-bold text-ink-soft hover:bg-marigold-soft/60"
            >
              Use a different email
            </button>
          </form>
        )}

        <div className="storybook-note mt-8 flex items-center justify-center gap-2 bg-muted px-4 py-3 text-sm font-bold text-ink-soft">
          <ShieldCheck className="size-5 text-gold" aria-hidden />
          Secured by{" "}
          <a
            href="https://freebuff.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline"
          >
            freebuff.com
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
