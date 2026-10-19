import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from "react";
import { useLanguage } from "../i18n/LanguageProvider";

const CONTROL =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-fg placeholder:text-fg-muted focus:border-primary";

interface FieldShellProps {
  label: string;
  error?: string;
  children: (ids: { inputId: string; errorId: string }) => ReactNode;
}

function FieldShell({ label, error, children }: FieldShellProps) {
  const { t } = useLanguage();
  const inputId = useId();
  const errorId = useId();

  return (
    <div className="mt-4">
      <label className="mb-1 block font-semibold" htmlFor={inputId}>
        {label}
      </label>
      {children({ inputId, errorId })}
      {error ? (
        <p className="mt-1 text-sm text-danger" id={errorId} role="alert">
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, ...props }, ref) => (
    <FieldShell error={error} label={label}>
      {({ inputId, errorId }) => (
        <input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className={CONTROL}
          id={inputId}
          ref={ref}
          {...props}
        />
      )}
    </FieldShell>
  ),
);
TextField.displayName = "TextField";

interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  error?: string;
}

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps
>(({ label, error, ...props }, ref) => (
  <FieldShell error={error} label={label}>
    {({ inputId, errorId }) => (
      <textarea
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className={`${CONTROL} min-h-28`}
        id={inputId}
        ref={ref}
        {...props}
      />
    )}
  </FieldShell>
));
TextAreaField.displayName = "TextAreaField";

interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  error?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, children, ...props }, ref) => (
    <FieldShell error={error} label={label}>
      {({ inputId, errorId }) => (
        <select
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          className={CONTROL}
          id={inputId}
          ref={ref}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldShell>
  ),
);
SelectField.displayName = "SelectField";
