import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Lista de opciones. `options` es un arreglo de { value, label }.
 */
export default function Select({
  label,
  hint,
  error,
  options = [],
  placeholder,
  className = '',
  ...props
}) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const hintId = hint ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-dark">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-10 w-full appearance-none rounded border bg-surface pl-3 pr-9 text-base text-ink transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-paper disabled:text-slate-light ${
            error
              ? 'border-alert hover:border-alert'
              : 'border-line-strong hover:border-slate-light'
          }`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
        />
      </div>
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
