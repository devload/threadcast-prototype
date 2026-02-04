import { useMemo } from 'react';
import { ActivityChart, ActivityDataPoint } from './ActivityChart';
import { TodoStatusChart, TodoStatusData } from './TodoStatusChart';
import { WeeklyActivityChart, WeeklyActivityData } from './WeeklyActivityChart';

interface ActivityStatsPanelProps {
  dailyActivity?: ActivityDataPoint[];
  todoStatus?: TodoStatusData;
  weeklyActivity?: WeeklyActivityData[];
  compact?: boolean;
}

// Generate mock data for demo purposes
const generateMockDailyActivity = (): ActivityDataPoint[] => {
  const data: ActivityDataPoint[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      commits: Math.floor(Math.random() * 8) + 1,
      aiActions: Math.floor(Math.random() * 15) + 3,
      todosCompleted: Math.floor(Math.random() * 5),
    });
  }
  return data;
};

const generateMockWeeklyActivity = (): WeeklyActivityData[] => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.map((day) => ({
    day,
    ai: Math.floor(Math.random() * 20) + 5,
    user: Math.floor(Math.random() * 15) + 2,
  }));
};

export const ActivityStatsPanel = ({
  dailyActivity,
  todoStatus,
  weeklyActivity,
  compact = false,
}: ActivityStatsPanelProps) => {
  // Use provided data or generate mock data
  const activityData = useMemo(
    () => dailyActivity || generateMockDailyActivity(),
    [dailyActivity]
  );

  const weeklyData = useMemo(
    () => weeklyActivity || generateMockWeeklyActivity(),
    [weeklyActivity]
  );

  const statusData = useMemo(
    () => todoStatus || { pending: 5, threading: 2, woven: 8, tangled: 1 },
    [todoStatus]
  );

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            <span>📈</span> Activity Overview
          </div>
        </div>
        <div className="p-4">
          <ActivityChart data={activityData} height={160} showLegend={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Daily Activity Trend */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            <span>📈</span> Daily Activity Trend
          </div>
        </div>
        <div className="p-4">
          <ActivityChart data={activityData} height={180} />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Todo Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <span>🎯</span> Todo Status
            </div>
          </div>
          <div className="p-4 relative">
            <TodoStatusChart data={statusData} height={180} showLegend={true} variant="donut" />
          </div>
        </div>

        {/* Weekly AI vs User Activity */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <span>🤖</span> AI vs User Activity
            </div>
          </div>
          <div className="p-4">
            <WeeklyActivityChart data={weeklyData} height={180} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityStatsPanel;
