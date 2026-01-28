import { clsx } from 'clsx';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-3',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-slate-200 border-t-indigo-600',
        sizeStyles[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

// Full page loading
interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

// Inline loading
interface LoadingInlineProps {
  message?: string;
  size?: SpinnerSize;
}

export function LoadingInline({ message, size = 'sm' }: LoadingInlineProps) {
  return (
    <div className="flex items-center gap-2">
      <Spinner size={size} />
      {message && <span className="text-sm text-slate-500">{message}</span>}
    </div>
  );
}

// Card/Section loading placeholder
interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center p-8 bg-slate-50 rounded-lg border border-slate-200',
        className
      )}
    >
      <Spinner size="md" />
    </div>
  );
}

// Button loading state
interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span className={clsx('inline-flex gap-1', className)}>
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1 h-1 bg-current rounded-full animate-bounce" />
    </span>
  );
}
