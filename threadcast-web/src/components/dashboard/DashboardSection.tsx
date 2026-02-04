import { clsx } from 'clsx';
import type { ReactNode, HTMLAttributes } from 'react';

export interface DashboardSectionProps extends HTMLAttributes<HTMLElement> {
  /** Section title */
  title?: string;
  /** Optional icon before title */
  icon?: ReactNode;
  /** Optional description */
  description?: string;
  /** Section content */
  children: ReactNode;
  /** Action button/link on the right */
  action?: ReactNode;
  /** Spacing variant */
  spacing?: 'sm' | 'md' | 'lg';
}

const spacingStyles = {
  sm: 'mb-4',
  md: 'mb-6',
  lg: 'mb-8',
};

/**
 * A section wrapper for organizing dashboard content.
 * Provides consistent heading styles and spacing.
 */
export function DashboardSection({
  title,
  icon,
  description,
  children,
  action,
  spacing = 'md',
  className,
  ...props
}: DashboardSectionProps) {
  return (
    <section className={clsx(spacingStyles[spacing], className)} {...props}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && <span className="text-xl">{icon}</span>}
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              {description && (
                <p className="text-sm text-slate-500">{description}</p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * A page header component for dashboard pages.
 */
export interface DashboardPageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Page title */
  title: string;
  /** Optional icon/emoji */
  icon?: ReactNode;
  /** Page description */
  description?: string;
  /** Breadcrumbs */
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  /** Right side actions */
  actions?: ReactNode;
}

export function DashboardPageHeader({
  title,
  icon,
  description,
  breadcrumbs,
  actions,
  className,
  ...props
}: DashboardPageHeaderProps) {
  return (
    <div className={clsx('mb-6', className)} {...props}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {crumb.href || crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="hover:text-slate-900 hover:underline"
                >
                  {crumb.label}
                </button>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {description && (
              <p className="text-slate-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
