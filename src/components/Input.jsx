import { useId } from 'react';

/**
 * Campo de texto con etiqueta, ayuda y error siempre asociados por id,
 * para que un lector de pantalla los anuncie junto al campo.
 */
export default function Input({
  label,
  hint,
  error,
  type = 'text',
  className = '',
  multiline = false,
  rows = 3,
  ...props
}) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const hintId = hint ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const fieldClasses = `w-full rounded border bg-surface px-3 py-2 text-base text-ink transition-colors duration-150 placeholder:text-slate disabled:cursor-not-allowed disabled:bg-paper disabled:text-slate-light ${
    error
      ? 'border-alert hover:border-alert'
      : 'border-line-strong hover:border-slate-light'
  }`;

  const Field = multiline ? 'textarea' : 'input';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-dark">
          {label}
        </label>
      )}
      <Field
        id={id}
        type={multiline ? undefined : type}
        rows={multiline ? rows : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={multiline ? `${fieldClasses} resize-y` : `${fieldClasses} h-10 py-0`}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-sm text-slate">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-alert">
          {error}
        </p>
      )}
    </div>
  );
}
