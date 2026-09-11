import { AlertCircle, CheckCircle2, Eye, EyeOff, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the three unauthenticated screens — sign in, forgot
 * password, reset password.
 *
 * Extracted from SignInScreen, which had it inline when sign-in was the only
 * one. The layout itself was ported from the makemerich frontend's Login.js
 * (gradient hero, floating circles, split marketing panel with glass cards,
 * elevated form card); this keeps all three screens on it rather than letting
 * the two new ones drift.
 */

/** Gradient backdrop and the two-column split. `hero` is desktop-only and
 *  optional — the password screens have no marketing panel, so without one the
 *  card centres instead of sitting in a half-empty grid. */
export function AuthLayout({
  hero,
  children,
}: {
  hero?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-full overflow-hidden bg-[linear-gradient(135deg,#312e81_0%,#6366f1_55%,#8b5cf6_100%)]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 animate-float" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-white/5 animate-float-reverse" />

      <div
        className={cn(
          "relative mx-auto grid min-h-full items-center gap-10 px-6 py-10",
          hero ? "max-w-6xl lg:grid-cols-2" : "max-w-xl",
        )}
      >
        {hero && (
          <div className="hidden text-white animate-fade-in-slow lg:block lg:pr-6">{hero}</div>
        )}
        <div className="mx-auto w-full max-w-[500px] animate-slide-up">{children}</div>
      </div>
    </div>
  );
}

/** The elevated form card: icon badge, uppercase eyebrow, title, subtitle. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/20 bg-card/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-violet to-brand-indigo shadow-[0_16px_40px_rgba(99,102,241,0.45)]">
          <Users className="h-9 w-9 text-white" />
        </div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Account Management
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

/** A tinted status strip. `tone` picks the palette; the markup is identical so
 *  a success and a failure occupy the same space and don't shift the form. */
export function AuthAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: React.ReactNode;
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role="alert"
      className={cn(
        "mb-5 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px]",
        tone === "success"
          ? "border-brand-teal/25 bg-brand-teal/10 text-brand-teal"
          : "border-brand-red/25 bg-brand-red/10 text-brand-red",
      )}
    >
      <Icon className="mt-px h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/** A labelled input with a leading icon and optional trailing control. */
export function Field({
  icon: Icon,
  label,
  value,
  onChange,
  trailing,
  hint,
  className,
  ...props
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div>
      <label className="mb-1.5 block pl-0.5 text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-11 w-full rounded-lg border border-border bg-background pl-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            trailing ? "pr-10" : "pr-3",
            className,
          )}
          {...props}
        />
        {trailing && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {hint && <p className="mt-1.5 pl-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Show/hide toggle for a password field. */
export function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-muted-foreground transition-colors hover:text-foreground"
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

/** A quiet text button for moving between the auth screens. */
export function AuthLink({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-[13px] font-semibold text-primary transition-colors hover:underline",
        className,
      )}
    >
      {children}
    </button>
  );
}
