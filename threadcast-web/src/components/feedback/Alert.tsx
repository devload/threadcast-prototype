import { clsx } from 'clsx';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { type ReactNode } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type?: AlertType;
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: boolean;
  className?: string;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    title: 'text-green-800',
    text: 'text-green-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    text: 'text-red-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    title: 'text-amber-800',
    text: 'text-amber-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
};

export function Alert({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon = true,
  className,
}: AlertProps) {
  const Icon = iconMap[type];
  const style = styleMap[type];

  return (
    <div
      className={clsx(
        'flex gap-3 p-4 rounded-lg border',
        style.bg,
        style.border,
        className
      )}
      role="alert"
    >
      {icon && <Icon size={20} className={clsx('flex-shrink-0 mt-0.5', style.icon)} />}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={clsx('text-sm font-medium', style.title)}>{title}</p>
        )}
        <div className={clsx('text-sm', style.text, title && 'mt-1')}>
          {children}
        </div>
      </div>
      {dismissible && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X size={16} className="text-slate-400" />
        </button>
      )}
    </div>
  );
}

// Banner variant for full-width alerts
interface BannerProps {
  type?: AlertType;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Banner({
  type = 'info',
  children,
  dismissible = false,
  onDismiss,
  action,
}: BannerProps) {
  const style = styleMap[type];
  const Icon = iconMap[type];

  return (
    <div
      className={clsx(
        'flex items-center justify-center gap-3 px-4 py-3',
        style.bg
      )}
      role="alert"
    >
      <Icon size={18} className={style.icon} />
      <p className={clsx('text-sm', style.text)}>{children}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={clsx(
            'text-sm font-medium underline hover:no-underline',
            style.title
          )}
        >
          {action.label}
        </button>
      )}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-black/5 rounded transition-colors ml-auto"
        >
          <X size={16} className="text-slate-400" />
        </button>
      )}
    </div>
  );
}
