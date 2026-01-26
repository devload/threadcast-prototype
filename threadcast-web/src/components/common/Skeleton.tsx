import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:400%_100%]',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(
        'bg-slate-200',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={style}
    />
  );
}

// Pre-built skeleton patterns
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonCard() {
  return (
    <div className="p-4 border border-slate-200 rounded-lg space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="40%" />
          <Skeleton height={12} width="60%" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton height={32} width={80} />
        <Skeleton height={32} width={80} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-slate-50 border-b border-slate-200">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={16} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-slate-200 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={16} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
          <SkeletonAvatar size={32} />
          <div className="flex-1 space-y-2">
            <Skeleton height={14} width="70%" />
            <Skeleton height={12} width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMissionCard() {
  return (
    <div className="p-4 border border-slate-200 rounded-lg space-y-3 w-72">
      <div className="flex items-center justify-between">
        <Skeleton height={20} width={60} />
        <Skeleton height={20} width={50} />
      </div>
      <Skeleton height={20} width="80%" />
      <Skeleton height={14} width="100%" />
      <Skeleton height={14} width="60%" />
      <div className="pt-2">
        <Skeleton height={8} width="100%" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex -space-x-2">
          <SkeletonAvatar size={24} />
          <SkeletonAvatar size={24} />
          <SkeletonAvatar size={24} />
        </div>
        <Skeleton height={14} width={60} />
      </div>
    </div>
  );
}

export function SkeletonTodoCard() {
  return (
    <div className="p-3 border border-slate-200 rounded-lg space-y-2 w-72">
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton height={16} width="70%" />
      </div>
      <Skeleton height={12} width="90%" />
      <div className="flex gap-1 pt-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={4} className="flex-1" />
        ))}
      </div>
    </div>
  );
}
