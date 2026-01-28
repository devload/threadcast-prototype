import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMissionStore, useTimelineStore, useUIStore } from '../stores';
import { PageHeader } from '../components/layout/Header';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { PriorityBadge } from '../components/common/Badge';
import { Timeline } from '../components/timeline/Timeline';
import { Spinner } from '../components/common/Loading';
import { Target, CheckSquare, Clock, TrendingUp } from 'lucide-react';

export function DashboardPage() {
  const { currentWorkspaceId } = useUIStore();
  const { missions, isLoading: missionsLoading, fetchMissions } = useMissionStore();
  const { events, isLoading: timelineLoading, fetchEvents } = useTimelineStore();

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchMissions(currentWorkspaceId);
      fetchEvents({ workspaceId: currentWorkspaceId, size: 5 });
    }
  }, [currentWorkspaceId, fetchMissions, fetchEvents]);

  // Calculate stats
  const stats = {
    totalMissions: missions.length,
    activeMissions: missions.filter((m) => m.status === 'THREADING').length,
    completedMissions: missions.filter((m) => m.status === 'WOVEN').length,
    totalTodos: missions.reduce((acc, m) => acc + m.todoStats.total, 0),
    completedTodos: missions.reduce((acc, m) => acc + m.todoStats.woven, 0),
  };

  const activeMissions = missions
    .filter((m) => m.status === 'THREADING')
    .slice(0, 5);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Dashboard"
        description="Overview of your workspace"
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Target size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalMissions}</p>
                  <p className="text-sm text-slate-500">Total Missions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.activeMissions}</p>
                  <p className="text-sm text-slate-500">Active Missions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckSquare size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.completedTodos}/{stats.totalTodos}
                  </p>
                  <p className="text-sm text-slate-500">Todos Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.totalTodos > 0
                      ? Math.round((stats.completedTodos / stats.totalTodos) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-slate-500">Overall Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Missions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Active Missions</h2>
                  <Link to="/missions" className="text-sm text-indigo-600 hover:underline">
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {missionsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Spinner />
                  </div>
                ) : activeMissions.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No active missions. Start one from the Missions page.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activeMissions.map((mission) => (
                      <Link
                        key={mission.id}
                        to={`/missions/${mission.id}/todos`}
                        className="block p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-slate-900">{mission.title}</h3>
                          <PriorityBadge priority={mission.priority} />
                        </div>
                        <p className="text-sm text-slate-500 mb-3 line-clamp-1">
                          {mission.description || 'No description'}
                        </p>
                        <div className="flex items-center justify-between">
                          <ProgressBar value={mission.progress} size="sm" className="flex-1 mr-4" />
                          <span className="text-xs text-slate-500">
                            {mission.todoStats.woven}/{mission.todoStats.total} todos
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Recent Activity</h2>
                  <Link to="/timeline" className="text-sm text-indigo-600 hover:underline">
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {timelineLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Spinner />
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  <Timeline events={events.slice(0, 5)} compact />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
