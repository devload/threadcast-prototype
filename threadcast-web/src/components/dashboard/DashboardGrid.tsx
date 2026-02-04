import { clsx } from 'clsx';
import type { ReactNode, HTMLAttributes } from 'react';

export interface DashboardGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Number of columns on different breakpoints */
  cols?: {
    default?: 1 | 2 | 3 | 4 | 5 | 6;
    sm?: 1 | 2 | 3 | 4 | 5 | 6;
    md?: 1 | 2 | 3 | 4 | 5 | 6;
    lg?: 1 | 2 | 3 | 4 | 5 | 6;
    xl?: 1 | 2 | 3 | 4 | 5 | 6;
  };
  /** Gap between grid items */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

const colsMap = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

const smColsMap = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
};

const mdColsMap = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
};

const lgColsMap = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

const xlColsMap = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
};

const gapMap = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

/**
 * A responsive grid layout component for dashboard layouts.
 * Supports configurable columns at different breakpoints.
 */
export function DashboardGrid({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className,
  ...props
}: DashboardGridProps) {
  return (
    <div
      className={clsx(
        'grid',
        gapMap[gap],
        cols.default && colsMap[cols.default],
        cols.sm && smColsMap[cols.sm],
        cols.md && mdColsMap[cols.md],
        cols.lg && lgColsMap[cols.lg],
        cols.xl && xlColsMap[cols.xl],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface DashboardGridItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Span across multiple columns */
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full';
  /** Span across multiple rows */
  rowSpan?: 1 | 2 | 3;
}

const colSpanMap = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  full: 'col-span-full',
};

const rowSpanMap = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
};

/**
 * A grid item component that can span multiple columns/rows.
 */
export function DashboardGridItem({
  children,
  colSpan = 1,
  rowSpan = 1,
  className,
  ...props
}: DashboardGridItemProps) {
  return (
    <div
      className={clsx(colSpanMap[colSpan], rowSpanMap[rowSpan], className)}
      {...props}
    >
      {children}
    </div>
  );
}
