import { clsx } from 'clsx';
import { LayoutGrid, List, Table2, Calendar, LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';

export type ViewMode = 'board' | 'list' | 'table' | 'calendar' | 'timeline';

export interface ViewOption {
  id: ViewMode;
  label: string;
  icon: ReactNode;
}

export interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  options?: ViewMode[];
  size?: 'sm' | 'md';
  className?: string;
}

const defaultIcons: Record<ViewMode, ReactNode> = {
  board: <LayoutGrid size={16} />,
  list: <List size={16} />,
  table: <Table2 size={16} />,
  calendar: <Calendar size={16} />,
  timeline: <LayoutDashboard size={16} />,
};

const defaultLabels: Record<ViewMode, string> = {
  board: 'Board',
  list: 'List',
  table: 'Table',
  calendar: 'Calendar',
  timeline: 'Timeline',
};

export function ViewSwitcher({
  value,
  onChange,
  options = ['board', 'list'],
  size = 'md',
  className,
}: ViewSwitcherProps) {
  const sizeStyles = {
    sm: 'h-7 text-xs',
    md: 'h-9 text-sm',
  };

  const iconSizeStyles = {
    sm: 'w-6',
    md: 'w-8',
  };

  return (
    <div
      className={clsx(
        'inline-flex bg-slate-100 rounded-lg p-1',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={clsx(
            'inline-flex items-center justify-center rounded-md transition-all',
            sizeStyles[size],
            iconSizeStyles[size],
            value === option
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
          title={defaultLabels[option]}
        >
          {defaultIcons[option]}
        </button>
      ))}
    </div>
  );
}

// Variant with labels
export interface ViewSwitcherWithLabelsProps {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  options?: ViewMode[];
  className?: string;
}

export function ViewSwitcherWithLabels({
  value,
  onChange,
  options = ['board', 'list'],
  className,
}: ViewSwitcherWithLabelsProps) {
  return (
    <div
      className={clsx(
        'inline-flex bg-slate-100 rounded-lg p-1',
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
            value === option
              ? 'bg-white text-slate-900 shadow-sm font-medium'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {defaultIcons[option]}
          <span>{defaultLabels[option]}</span>
        </button>
      ))}
    </div>
  );
}

// Segmented control style
export interface SegmentedViewSwitcherProps {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  options?: Array<{ id: ViewMode; label: string }>;
  className?: string;
}

export function SegmentedViewSwitcher({
  value,
  onChange,
  options = [
    { id: 'board', label: 'Board' },
    { id: 'list', label: 'List' },
  ],
  className,
}: SegmentedViewSwitcherProps) {
  return (
    <div
      className={clsx(
        'inline-flex border border-slate-200 rounded-lg overflow-hidden',
        className
      )}
    >
      {options.map((option, index) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            index > 0 && 'border-l border-slate-200',
            value === option.id
              ? 'bg-indigo-50 text-indigo-700'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Dropdown style for mobile
export interface ViewDropdownProps {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  options?: ViewMode[];
  className?: string;
}

export function ViewDropdown({
  value,
  onChange,
  options = ['board', 'list', 'table'],
  className,
}: ViewDropdownProps) {
  return (
    <div className={clsx('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ViewMode)}
        className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {defaultLabels[option]}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        {defaultIcons[value]}
      </div>
    </div>
  );
}
