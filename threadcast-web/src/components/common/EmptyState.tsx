import { clsx } from 'clsx';
import { Inbox, Search, FileX, AlertCircle, Plus } from 'lucide-react';
import { type ReactNode } from 'react';
import { Button } from './Button';

type EmptyStateType = 'empty' | 'search' | 'error' | 'no-access';

interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const defaultIcons: Record<EmptyStateType, ReactNode> = {
  empty: <Inbox className="text-slate-300" />,
  search: <Search className="text-slate-300" />,
  error: <AlertCircle className="text-red-300" />,
  'no-access': <FileX className="text-slate-300" />,
};

const sizeStyles = {
  sm: {
    container: 'py-8',
    icon: 'w-10 h-10',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'w-12 h-12',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 'w-16 h-16',
    title: 'text-xl',
    description: 'text-base',
  },
};

export function EmptyState({
  type = 'empty',
  title,
  description,
  icon,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const IconComponent = icon || defaultIcons[type];
  const style = sizeStyles[size];

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center px-4',
        style.container,
        className
      )}
    >
      <div className={clsx('mb-4', style.icon)}>
        {IconComponent}
      </div>
      <h3 className={clsx('font-medium text-slate-900', style.title)}>
        {title}
      </h3>
      {description && (
        <p className={clsx('mt-1 text-slate-500 max-w-sm', style.description)}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              leftIcon={<Plus size={16} />}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Specialized empty states
export function NoMissionsEmpty({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <EmptyState
      title="No missions yet"
      description="Get started by creating your first mission to organize your work."
      action={{
        label: 'Create Mission',
        onClick: onCreateClick,
      }}
    />
  );
}

export function NoTodosEmpty({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <EmptyState
      title="No todos in this mission"
      description="Break down your mission into actionable todos."
      action={{
        label: 'Add Todo',
        onClick: onCreateClick,
      }}
    />
  );
}

export function NoSearchResultsEmpty({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      type="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
      action={{
        label: 'Clear search',
        onClick: onClear,
        variant: 'secondary',
      }}
    />
  );
}

export function ErrorEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      type="error"
      title="Something went wrong"
      description="We encountered an error while loading. Please try again."
      action={{
        label: 'Try again',
        onClick: onRetry,
        variant: 'secondary',
      }}
    />
  );
}

export function NoTimelineEmpty() {
  return (
    <EmptyState
      title="No activity yet"
      description="Start working on missions and todos to see your activity timeline."
      size="sm"
    />
  );
}
