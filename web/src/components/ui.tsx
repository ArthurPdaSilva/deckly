import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  PropsWithChildren,
  ReactNode,
} from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variant = "primary" | "secondary" | "accent" | "danger" | "ghost";

const BASE =
  "inline-flex min-h-12 items-center justify-center rounded-2xl px-4 py-3 text-center font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:opacity-90",
  secondary:
    "border border-line bg-transparent text-primary hover:bg-primary-muted",
  accent: "bg-accent text-fg hover:opacity-90",
  danger: "bg-danger text-on-primary hover:opacity-90",
  ghost: "bg-primary-muted text-primary hover:opacity-90",
};

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClass(variant, className)}
      type={type}
      {...props}
    />
  );
}

interface LinkButtonProps extends LinkProps {
  variant?: Variant;
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: LinkButtonProps) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function BackLink({ to, children }: PropsWithChildren<{ to: string }>) {
  return (
    <Link
      className="mb-6 inline-block font-bold text-primary hover:underline"
      to={to}
    >
      {children}
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6">
      {eyebrow ? (
        <p className="text-sm font-extrabold uppercase tracking-widest text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{title}</h1>
      {subtitle ? (
        <p className="mt-2 leading-relaxed text-fg-secondary">{subtitle}</p>
      ) : null}
    </header>
  );
}

export function Panel({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`rounded-3xl border border-line bg-elevated p-5 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-fg-secondary">{children}</p>;
}

export function ErrorState({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 text-danger" role="alert">
      {children}
    </p>
  );
}
