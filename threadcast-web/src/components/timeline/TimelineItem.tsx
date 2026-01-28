import { clsx } from 'clsx';
import {
  Rocket,
  CheckCircle2,
  PlayCircle,
  MessageSquare,
  HelpCircle,
  AlertCircle,
  Plus,
  Archive,
} from 'lucide-react';
import type { TimelineEvent, EventType } from '../../types';

interface TimelineItemProps {
  event: TimelineEvent;
  isLast?: boolean;
}

const eventConfig: Record<
  EventType,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  MISSION_CREATED: { icon: Rocket, color: 'text-indigo-600', bgColor: 'bg-indigo-100', label: 'Mission Created' },
  MISSION_STARTED: { icon: PlayCircle, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Mission Started' },
  MISSION_COMPLETED: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Mission Completed' },
  MISSION_ARCHIVED: { icon: Archive, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Mission Archived' },
  TODO_CREATED: { icon: Plus, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Todo Created' },
  TODO_STARTED: { icon: PlayCircle, color: 'text-amber-600', bgColor: 'bg-amber-100', label: 'Todo Started' },
  TODO_COMPLETED: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Todo Completed' },
  TODO_FAILED: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Todo Failed' },
  STEP_COMPLETED: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Step Completed' },
  AI_QUESTION: { icon: HelpCircle, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'AI Question' },
  AI_ANSWER: { icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'AI Response' },
  COMMENT_ADDED: { icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Comment Added' },
};

export function TimelineItem({ event, isLast = false }: TimelineItemProps) {
  const config = eventConfig[event.eventType];
  const Icon = config.icon;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex gap-3">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center', config.bgColor)}>
          <Icon size={16} className={config.color} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between">
          <span className={clsx('text-sm font-medium', config.color)}>
            {config.label}
          </span>
          <span className="text-xs text-slate-400">{formatTime(event.createdAt)}</span>
        </div>

        {/* Event title/content */}
        <h4 className="text-sm font-medium text-slate-900 mt-1">{event.title}</h4>

        {/* Optional description */}
        {event.description && (
          <p className="text-sm text-slate-500 mt-1">{event.description}</p>
        )}

        {/* Optional metadata */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
            {Object.entries(event.metadata).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TimelineItemSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-slate-200" />
        <div className="w-0.5 flex-1 bg-slate-200 my-2" />
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between">
          <div className="w-24 h-4 bg-slate-200 rounded" />
          <div className="w-12 h-3 bg-slate-200 rounded" />
        </div>
        <div className="w-48 h-4 bg-slate-200 rounded mt-2" />
        <div className="w-full h-3 bg-slate-200 rounded mt-2" />
      </div>
    </div>
  );
}
