import { useEffect } from 'react';
import { useTimelineStore, useUIStore } from '../stores';
import { Timeline } from '../components/timeline/Timeline';
import { PageHeader } from '../components/layout/Header';
import { Spinner } from '../components/common/Loading';
import { NoTimelineEmpty } from '../components/common/EmptyState';

export function TimelinePage() {
  const { currentWorkspaceId } = useUIStore();
  const { events, isLoading, hasMore, fetchEvents, fetchMore } = useTimelineStore();

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchEvents({ workspaceId: currentWorkspaceId, size: 20 });
    }
  }, [currentWorkspaceId, fetchEvents]);

  const handleLoadMore = () => {
    if (currentWorkspaceId && hasMore && !isLoading) {
      fetchMore({ workspaceId: currentWorkspaceId, size: 20 });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Timeline"
        description="Activity feed for your workspace"
      />

      <div className="flex-1 overflow-auto p-6">
        {isLoading && events.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : events.length === 0 ? (
          <NoTimelineEmpty />
        ) : (
          <div className="max-w-2xl mx-auto">
            <Timeline events={events} />

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
