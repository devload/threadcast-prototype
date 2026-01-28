import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useTimelineStore, useUIStore, useAuthStore } from '../stores';
import { Spinner } from '../components/common/Loading';
import { SettingsModal } from '../components/settings/SettingsModal';
import { useTranslation } from '../hooks/useTranslation';
import type { TimelineEvent, ActorType, EventType } from '../types';

// Group events by date
function groupEventsByDate(
  events: TimelineEvent[],
  locale: string,
  todayLabel: string,
  yesterdayLabel: string
): Map<string, TimelineEvent[]> {
  const groups = new Map<string, TimelineEvent[]>();

  events.forEach(event => {
    const date = new Date(event.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateLocale = locale === 'ko' ? 'ko-KR' : 'en-US';
    let dateKey: string;
    if (date.toDateString() === today.toDateString()) {
      dateKey = `${todayLabel} - ${date.toLocaleDateString(dateLocale, { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = `${yesterdayLabel} - ${date.toLocaleDateString(dateLocale, { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } else {
      dateKey = date.toLocaleDateString(dateLocale, { month: 'long', day: 'numeric', year: 'numeric' });
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(event);
  });

  return groups;
}

// Get icon class based on actor type
function getIconClass(actorType?: ActorType): string {
  switch (actorType) {
    case 'AI':
      return 'timeline-icon-ai';
    case 'USER':
      return 'timeline-icon-user';
    default:
      return 'timeline-icon-system';
  }
}

// Get icon emoji based on actor type
function getIconEmoji(actorType?: ActorType): string {
  switch (actorType) {
    case 'AI':
      return '🤖';
    case 'USER':
      return '👤';
    default:
      return '⚙️';
  }
}

// Get status badge based on event type
function getStatusBadge(
  eventType: EventType,
  t: (key: string) => string
): { label: string; className: string } | null {
  switch (eventType) {
    case 'MISSION_COMPLETED':
    case 'TODO_COMPLETED':
    case 'STEP_COMPLETED':
      return { label: `✅ ${t('status.woven')}`, className: 'bg-green-100 text-green-700' };
    case 'MISSION_STARTED':
    case 'TODO_STARTED':
      return { label: `🧵 ${t('status.threading')}`, className: 'bg-amber-100 text-amber-700' };
    case 'AI_QUESTION':
      return { label: `🤔 ${t('timeline.questionWaiting')}`, className: 'bg-pink-100 text-pink-700' };
    default:
      return null;
  }
}

// Get event title based on event type
function getEventTitle(eventType: EventType, t: (key: string) => string): string {
  switch (eventType) {
    case 'MISSION_CREATED':
      return t('timeline.missionCreated');
    case 'MISSION_STARTED':
      return t('timeline.missionStarted');
    case 'MISSION_COMPLETED':
      return t('timeline.missionCompleted');
    case 'MISSION_ARCHIVED':
      return t('timeline.missionArchived');
    case 'TODO_CREATED':
      return t('timeline.todoCreated');
    case 'TODO_STARTED':
      return t('timeline.todoStarted');
    case 'TODO_COMPLETED':
      return t('timeline.todoCompleted');
    case 'TODO_FAILED':
      return t('timeline.todoFailed');
    case 'STEP_COMPLETED':
      return t('timeline.stepCompleted');
    case 'AI_QUESTION':
      return t('timeline.aiQuestion');
    case 'AI_ANSWER':
      return t('timeline.aiAnswer');
    case 'COMMENT_ADDED':
      return t('timeline.commentAdded');
    default:
      return t('timeline.activity');
  }
}

type FilterType = 'all' | 'missions' | 'todos' | 'ai' | 'system';

export function TimelinePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspaceId } = useUIStore();
  const { user } = useAuthStore();
  const { events, isLoading, hasMore, fetchEvents, fetchMore } = useTimelineStore();
  const { t, language } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Determine active view
  const getActiveView = () => {
    if (location.pathname.includes('/timeline')) return 'timeline';
    return 'missions';
  };

  const activeView = getActiveView();

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchEvents({ workspaceId: currentWorkspaceId, size: 50 });
    }
  }, [currentWorkspaceId, fetchEvents]);

  const handleViewChange = (view: string) => {
    switch (view) {
      case 'missions':
        navigate('/missions');
        break;
      case 'timeline':
        navigate('/timeline');
        break;
    }
  };

  const handleLoadMore = () => {
    if (currentWorkspaceId && hasMore && !isLoading) {
      fetchMore({ workspaceId: currentWorkspaceId, size: 20 });
    }
  };

  // Filter events based on active filter
  const filteredEvents = events.filter(event => {
    switch (activeFilter) {
      case 'missions':
        return event.eventType.startsWith('MISSION_');
      case 'todos':
        return event.eventType.startsWith('TODO_') || event.eventType.startsWith('STEP_');
      case 'ai':
        return event.actorType === 'AI' || event.eventType.startsWith('AI_');
      case 'system':
        return event.actorType === 'SYSTEM';
      default:
        return true;
    }
  });

  // Group filtered events by date
  const groupedEvents = groupEventsByDate(
    filteredEvents,
    language,
    t('timeline.today'),
    t('timeline.yesterday')
  );

  // Calculate filter counts
  const filterCounts = {
    all: events.length,
    missions: events.filter(e => e.eventType.startsWith('MISSION_')).length,
    todos: events.filter(e => e.eventType.startsWith('TODO_') || e.eventType.startsWith('STEP_')).length,
    ai: events.filter(e => e.actorType === 'AI' || e.eventType.startsWith('AI_')).length,
    system: events.filter(e => e.actorType === 'SYSTEM').length,
  };

  const filters: { id: FilterType; label: string; icon: string }[] = [
    { id: 'all', label: t('timeline.allActivity'), icon: '📊' },
    { id: 'missions', label: t('timeline.missions'), icon: '🧵' },
    { id: 'todos', label: t('timeline.todos'), icon: '📋' },
    { id: 'ai', label: t('timeline.aiActivity'), icon: '🤖' },
    { id: 'system', label: t('timeline.systemEvents'), icon: '⚙️' },
  ];

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar Filters - Timeline specific */}
      <aside className="w-[260px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-y-auto flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-lg mb-3">
            <span className="text-xl">🧵</span>
            <span>ThreadCast</span>
          </div>
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md text-sm dark:text-slate-200">
            {user?.name ? t('nav.myWorkspace', { name: user.name }) : t('nav.myWorkspaceDefault')}
          </div>
        </div>

        {/* Filters - takes remaining space like Navigation in main sidebar */}
        <div className="flex-1 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3 px-2">
            {t('common.filter')}
          </div>
          <div className="space-y-0.5">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
                <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full ${
                  activeFilter === filter.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                }`}>
                  {filterCounts[filter.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Activity Stats - at bottom like Overview in main sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3 px-2">
            {t('timeline.overview')}
          </div>
          <div className="grid grid-cols-2 gap-2 px-2">
            <div className="stat-card">
              <div className="stat-value">{events.filter(e => e.eventType === 'MISSION_COMPLETED' || e.eventType === 'TODO_COMPLETED').length}</div>
              <div className="stat-label">{t('status.woven')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{events.filter(e => e.eventType === 'MISSION_STARTED' || e.eventType === 'TODO_STARTED').length}</div>
              <div className="stat-label">{t('status.threading')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{events.filter(e => e.actorType === 'AI').length}</div>
              <div className="stat-label">{t('timeline.aiActions')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{events.length}</div>
              <div className="stat-label">{t('timeline.totalEvents')}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('timeline.activityTimeline')}</h1>
            <div className="view-switcher">
              <button
                className={`view-btn ${activeView === 'missions' ? 'active' : ''}`}
                onClick={() => handleViewChange('missions')}
              >
                🧵 {t('nav.missions')}
              </button>
              <button
                className={`view-btn ${activeView === 'timeline' ? 'active' : ''}`}
                onClick={() => handleViewChange('timeline')}
              >
                📊 {t('nav.timeline')}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              title={t('settings.title')}
            >
              <Settings size={20} className="text-slate-500 dark:text-slate-400" />
            </button>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" title={t('common.export')}>
              <span className="text-slate-500 dark:text-slate-400">📥</span>
            </button>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors" title={t('common.refresh')}>
              <span className="text-slate-500 dark:text-slate-400">🔄</span>
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && events.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
              <span className="text-6xl mb-4 opacity-50">📭</span>
              <p className="text-lg mb-2">{t('timeline.noActivity')}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('timeline.noActivityHint')}</p>
            </div>
          ) : (
            <div className="max-w-[900px] mx-auto">
              {Array.from(groupedEvents.entries()).map(([date, dateEvents]) => (
                <div key={date} className="mb-8">
                  {/* Date Header */}
                  <div className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 pl-14">
                    {date}
                  </div>

                  {/* Timeline Items */}
                  <div className="space-y-0">
                    {dateEvents.map((event, index) => {
                      const statusBadge = getStatusBadge(event.eventType, t);
                      const isLast = index === dateEvents.length - 1;
                      const timeLocale = language === 'ko' ? 'ko-KR' : 'en-US';

                      return (
                        <div key={event.id} className="flex gap-4 py-4">
                          {/* Icon */}
                          <div className={`timeline-icon ${getIconClass(event.actorType)} relative`}>
                            {getIconEmoji(event.actorType)}
                            {!isLast && (
                              <div className="timeline-connector" />
                            )}
                          </div>

                          {/* Content Card */}
                          <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 cursor-pointer transition-all hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {getEventTitle(event.eventType, t)}
                                </span>
                                {statusBadge && (
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge.className}`}>
                                    {statusBadge.label}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                {new Date(event.createdAt).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                              {event.description || event.title}
                            </p>

                            {/* Meta */}
                            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                              {event.missionId && (
                                <span className="meta-tag meta-tag-mission">
                                  MISSION-{event.missionId.slice(-4).toUpperCase()}
                                </span>
                              )}
                              {event.todoId && (
                                <span className="meta-tag meta-tag-todo">
                                  TODO-{event.todoId.slice(-4).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? t('common.loading') : t('common.loadMore')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
