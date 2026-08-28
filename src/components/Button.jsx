import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-signal text-white border-signal hover:bg-signal-dark hover:border-signal-dark',
  secondary:
    'bg-surface text-ink border-line-strong hover:bg-paper hover:border-slate-light',
  ghost: 'bg-transparent text-slate-dark border-transparent hover:bg-paper hover:text-ink',
  danger: 'bg-surface text-alert border-alert hover:bg-alert hover:text-white',
  // Para usar sobre la barra lateral azul marino
  onInk: 'bg-ink-600 text-white border-ink-600 hover:bg-signal hover:border-signal',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

/**
 * Boton unico de la aplicacion. El texto siempre dice lo que hace la accion.
 * `icon` recibe un componente de lucide-react, no un emoji.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  const isBlocked = disabled || loading;

  return (
    <button
      type={type}
      disabled={isBlocked}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center rounded border font-sans font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-slate-light ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon aria-hidden="true" className="h-4 w-4" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon aria-hidden="true" className="h-4 w-4" />
      )}
    </button>
  );
}
