import { clsx } from 'clsx';
import { RefreshCw } from 'lucide-react';
import type { TimelineEvent, EventType } from '../../types';
import { TimelineItem, TimelineItemSkeleton } from './TimelineItem';

interface TimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  onRefresh?: () => void;
  maxItems?: number;
  compact?: boolean;
  className?: string;
}

export function Timeline({
  events,
  isLoading = false,
  onRefresh,
  maxItems,
  compact = false,
  className,
}: TimelineProps) {
  // Use compact version if specified
  if (compact) {
    return <TimelineCompact events={events} maxItems={maxItems} />;
  }
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;
  const hasMore = maxItems && events.length > maxItems;

  return (
    <div className={clsx('bg-white rounded-lg border border-slate-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="font-medium text-slate-900">Activity Timeline</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={clsx(
              'p-1.5 hover:bg-slate-100 rounded transition-colors',
              isLoading && 'animate-spin'
            )}
            title="Refresh"
          >
            <RefreshCw size={16} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <>
            <TimelineItemSkeleton />
            <TimelineItemSkeleton />
            <TimelineItemSkeleton />
          </>
        ) : displayEvents.length > 0 ? (
          <>
            {displayEvents.map((event, index) => (
              <TimelineItem
                key={event.id}
                event={event}
                isLast={index === displayEvents.length - 1 && !hasMore}
              />
            ))}
            {hasMore && (
              <div className="text-center py-2">
                <span className="text-sm text-slate-500">
                  +{events.length - maxItems!} more events
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">No activity yet</p>
            <p className="text-xs mt-1">Events will appear here as work progresses</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for sidebars
interface TimelineCompactProps {
  events: TimelineEvent[];
  maxItems?: number;
}

const statusColors: Record<EventType, string> = {
  MISSION_CREATED: 'bg-indigo-500',
  MISSION_STARTED: 'bg-amber-500',
  MISSION_COMPLETED: 'bg-green-500',
  MISSION_ARCHIVED: 'bg-gray-500',
  TODO_CREATED: 'bg-blue-500',
  TODO_STARTED: 'bg-amber-500',
  TODO_COMPLETED: 'bg-green-500',
  TODO_FAILED: 'bg-red-500',
  STEP_COMPLETED: 'bg-green-500',
  AI_QUESTION: 'bg-purple-500',
  AI_ANSWER: 'bg-purple-500',
  COMMENT_ADDED: 'bg-blue-500',
};

export function TimelineCompact({ events, maxItems = 5 }: TimelineCompactProps) {
  const displayEvents = events.slice(0, maxItems);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="space-y-2">
      {displayEvents.map((event) => (
        <div key={event.id} className="flex items-center gap-2 text-sm">
          <div className={clsx('w-2 h-2 rounded-full', statusColors[event.eventType])} />
          <span className="flex-1 truncate text-slate-600">{event.title}</span>
          <span className="text-xs text-slate-400">{formatTime(event.createdAt)}</span>
        </div>
      ))}
      {events.length > maxItems && (
        <div className="text-xs text-slate-400 text-center">
          +{events.length - maxItems} more
        </div>
      )}
    </div>
  );
}
