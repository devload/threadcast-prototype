import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useTranslation } from '../hooks/useTranslation';
import { Project, Todo, TodoStatus, Complexity } from '../types';

interface ProjectStats {
  totalTodos: number;
  threadingTodos: number;
  wovenTodos: number;
  linkedMissions: number;
  commits: number;
  aiActions: number;
}

interface FileChange {
  name: string;
  type: 'java' | 'kotlin' | 'config' | 'other';
  additions: number;
  deletions: number;
}

interface Worktree {
  todoId: string;
  path: string;
}

interface ActivityItem {
  id: string;
  type: 'ai' | 'git' | 'woven' | 'system' | 'user';
  title: string;
  time: string;
}

export const ProjectDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentWorkspace, currentProject, fetchProject } = useWorkspaceStore();
  const [filter] = useState<'all' | 'threading' | 'woven' | 'pending'>('all');

  useEffect(() => {
    if (currentWorkspace?.id && projectId) {
      fetchProject(currentWorkspace.id, projectId);
    }
  }, [currentWorkspace?.id, projectId, fetchProject]);

  // Mock data for demonstration
  const project: Project = currentProject || {
    id: projectId || '1',
    workspaceId: currentWorkspace?.id || '1',
    name: 'agent-core',
    description: 'Core agent module for metric collection',
    path: './agent/core',
    absolutePath: '/Users/devload/whatap-server/agent/core',
    language: 'Java',
    buildTool: 'Gradle',
    todoCount: 12,
    activeTodoCount: 3,
    createdAt: new Date().toISOString(),
  };

  const stats: ProjectStats = {
    totalTodos: 12,
    threadingTodos: 3,
    wovenTodos: 7,
    linkedMissions: 3,
    commits: 8,
    aiActions: 24,
  };

  const todos: (Todo & { stepProgress: string })[] = [
    { id: '1', missionId: 'm42', title: '메트릭 수집 로직 리팩토링', status: 'THREADING' as TodoStatus, priority: 'HIGH', complexity: 'HIGH' as Complexity, orderIndex: 0, steps: [], dependencies: [], createdAt: '', stepProgress: '3/6', missionTitle: 'M-42' },
    { id: '2', missionId: 'm51', title: 'JVM 메모리 모니터링 추가', status: 'THREADING' as TodoStatus, priority: 'MEDIUM', complexity: 'MEDIUM' as Complexity, orderIndex: 1, steps: [], dependencies: [], createdAt: '', stepProgress: '2/6', missionTitle: 'M-51' },
    { id: '3', missionId: 'm42', title: '데이터 파이프라인 구축', status: 'THREADING' as TodoStatus, priority: 'HIGH', complexity: 'HIGH' as Complexity, orderIndex: 2, steps: [], dependencies: [], createdAt: '', stepProgress: '1/6', missionTitle: 'M-42' },
    { id: '4', missionId: 'm42', title: '단위 테스트 작성', status: 'PENDING' as TodoStatus, priority: 'LOW', complexity: 'LOW' as Complexity, orderIndex: 3, steps: [], dependencies: [], createdAt: '', stepProgress: '0/6', missionTitle: 'M-42' },
    { id: '5', missionId: 'm42', title: '기존 코드 분석', status: 'WOVEN' as TodoStatus, priority: 'LOW', complexity: 'LOW' as Complexity, orderIndex: 4, steps: [], dependencies: [], createdAt: '', stepProgress: '6/6', missionTitle: 'M-42' },
    { id: '6', missionId: 'm42', title: '인터페이스 설계', status: 'WOVEN' as TodoStatus, priority: 'MEDIUM', complexity: 'MEDIUM' as Complexity, orderIndex: 5, steps: [], dependencies: [], createdAt: '', stepProgress: '6/6', missionTitle: 'M-42' },
  ];

  const missions: { id: string; title: string; status: string; todoCount: number; progress: number }[] = [
    { id: 'm42', title: '메트릭 수집 시스템 개선', status: 'THREADING', todoCount: 5, progress: 60 },
    { id: 'm51', title: 'JVM 모니터링 강화', status: 'THREADING', todoCount: 3, progress: 33 },
    { id: 'm38', title: '로깅 시스템 리팩토링', status: 'WOVEN', todoCount: 4, progress: 100 },
  ];

  const fileChanges: FileChange[] = [
    { name: 'MetricCollector.java', type: 'java', additions: 45, deletions: 12 },
    { name: 'JvmMonitor.java', type: 'java', additions: 128, deletions: 0 },
    { name: 'DataProcessor.java', type: 'java', additions: 23, deletions: 8 },
    { name: 'build.gradle', type: 'config', additions: 5, deletions: 2 },
    { name: 'AgentConfig.java', type: 'java', additions: 15, deletions: 3 },
  ];

  const worktrees: Worktree[] = [
    { todoId: 'TODO-42-3', path: '.worktrees/todo-42-3' },
    { todoId: 'TODO-51-2', path: '.worktrees/todo-51-2' },
  ];

  const activities: ActivityItem[] = [
    { id: '1', type: 'ai', title: 'TODO-42-3 Implementation', time: '5분 전' },
    { id: '2', type: 'git', title: 'Commit: Add metric collector', time: '15분 전' },
    { id: '3', type: 'woven', title: 'TODO-42-2 완료', time: '1시간 전' },
    { id: '4', type: 'system', title: 'Worktree 생성', time: '2시간 전' },
  ];

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'all') return true;
    if (filter === 'threading') return todo.status === 'THREADING';
    if (filter === 'woven') return todo.status === 'WOVEN';
    if (filter === 'pending') return todo.status === 'PENDING';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'THREADING': return 'bg-amber-500';
      case 'WOVEN': return 'bg-green-500';
      case 'TANGLED': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getComplexityStyle = (complexity: string) => {
    switch (complexity) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getComplexityLabel = (complexity: string) => {
    switch (complexity) {
      case 'HIGH': return 'High';
      case 'MEDIUM': return 'Med';
      case 'LOW': return 'Low';
      default: return complexity;
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'java': return '☕';
      case 'kotlin': return '🟣';
      case 'config': return '📄';
      default: return '📁';
    }
  };

  return (
    <div className="p-5 max-w-full overflow-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1.5 bg-gray-100 rounded-md text-sm text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ← Workspace
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{t('project.dashboard')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">⚙️</button>
          <button className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors">🔄</button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-purple-600 transition-colors">
            + Add Todo
          </button>
        </div>
      </div>

      {/* Project Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-xl">
            ☕
          </div>
          <div>
            <div className="font-semibold text-gray-900">{project.name}</div>
            <div className="text-xs font-mono text-gray-400">{project.path}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-semibold">
            {project.language} 17
          </span>
          <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs font-semibold">
            {project.buildTool}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        <StatCard icon="📋" value={stats.totalTodos} label={t('project.totalTodos')} />
        <StatCard icon="🧵" value={stats.threadingTodos} label={t('project.threading')} subValue="Active" />
        <StatCard icon="✅" value={stats.wovenTodos} label={t('project.woven')} />
        <StatCard icon="🎯" value={stats.linkedMissions} label="Missions" />
        <StatCard icon="⎇" value={stats.commits} label={t('project.commits')} />
        <StatCard icon="🤖" value={stats.aiActions} label={t('project.aiActions')} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-[1fr_1fr_320px] gap-4">
        {/* Todo List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <span>📋</span> {t('project.todoList')}
            </div>
            <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">
              View All →
            </span>
          </div>
          <div className="p-3 space-y-2">
            {filteredTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} getStatusColor={getStatusColor} getComplexityStyle={getComplexityStyle} getComplexityLabel={getComplexityLabel} />
            ))}
          </div>
        </div>

        {/* Middle Column */}
        <div className="space-y-3">
          {/* Linked Missions */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>🎯</span> {t('project.linkedMissions')}
              </div>
            </div>
            <div className="p-3 space-y-2">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(mission.status)} ${mission.status === 'THREADING' ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{mission.title}</div>
                    <div className="text-xs text-gray-400">MISSION-{mission.id.replace('m', '')} • {mission.todoCount} todos</div>
                  </div>
                  <div className="text-sm font-semibold text-indigo-600">{mission.progress}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>📝</span> {t('project.recentFiles')}
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {fileChanges.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 text-xs">
                  <span className="text-sm">{getFileIcon(file.type)}</span>
                  <span className="flex-1 font-mono text-gray-700 truncate">{file.name}</span>
                  <span className="text-green-600 font-medium">+{file.additions}</span>
                  <span className="text-red-500 font-medium">-{file.deletions}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Worktrees */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>🌿</span> {t('project.activeWorktrees')}
              </div>
            </div>
            <div className="p-3 space-y-2">
              {worktrees.map((wt, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">{wt.todoId}</div>
                  <div className="text-xs font-mono text-indigo-600">{wt.path}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {/* Progress */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>📊</span> {t('project.progress')}
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-3">
                <div className="relative w-14 h-14">
                  <svg className="transform -rotate-90" width="56" height="56" viewBox="0 0 56 56">
                    <circle className="fill-none stroke-gray-200" cx="28" cy="28" r="23" strokeWidth="6" />
                    <circle
                      className="fill-none stroke-indigo-600"
                      cx="28" cy="28" r="23"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="144"
                      strokeDashoffset={144 - (144 * 58) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-600">
                    58%
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Overall Progress</div>
                  <div className="text-xs text-gray-500">7 of 12 todos completed</div>
                  <div className="text-xs text-amber-600">3 currently active</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">+216</div>
                  <div className="text-[9px] text-gray-400">Lines Added</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-red-500">-25</div>
                  <div className="text-[9px] text-gray-400">Lines Removed</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Activity */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>🤖</span> AI Activity
              </div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-indigo-600">24</div>
                  <div className="text-[9px] text-gray-500">Actions</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-indigo-600">8</div>
                  <div className="text-[9px] text-gray-500">Commits</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-indigo-600">2</div>
                  <div className="text-[9px] text-gray-500">Questions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Git Status */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>⎇</span> {t('project.gitStatus')}
              </div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-indigo-600">8</div>
                  <div className="text-[9px] text-gray-400">Commits</div>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-indigo-600">3</div>
                  <div className="text-[9px] text-gray-400">Branches</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                <span>🌿</span>
                <div>
                  <div className="text-xs font-mono font-semibold text-indigo-600">feature/metric-refactor</div>
                  <div className="text-[9px] text-gray-400">{t('project.currentBranch')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>⏱️</span> {t('project.activityLog')}
              </div>
            </div>
            <div className="p-3 space-y-2">
              {activities.map((activity) => (
                <ActivityItemComponent key={activity.id} activity={activity} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <span>⚡</span> {t('project.quickActions')}
              </div>
            </div>
            <div className="p-3 space-y-2">
              <QuickAction icon="➕" title={t('project.newTodo')} desc={t('project.newTodoDesc')} />
              <QuickAction icon="📊" title="Timeline" desc="View activity" />
              <QuickAction icon="⚙️" title="Settings" desc="Configure" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, value, label, subValue }: { icon: string; value: number; label: string; subValue?: string }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
    <div className="text-xl mb-1">{icon}</div>
    <div className="text-2xl font-bold text-indigo-600">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
    {subValue && <div className="text-[10px] text-amber-600 font-medium mt-0.5">{subValue}</div>}
  </div>
);

const TodoItem = ({
  todo,
  getStatusColor,
  getComplexityStyle,
  getComplexityLabel,
}: {
  todo: Todo & { stepProgress: string };
  getStatusColor: (s: string) => string;
  getComplexityStyle: (c: string) => string;
  getComplexityLabel: (c: string) => string;
}) => {
  const isThreading = todo.status === 'THREADING';
  const isWoven = todo.status === 'WOVEN';
  const [done, total] = todo.stepProgress.split('/').map(Number);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:translate-x-0.5 ${
        isThreading ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${getStatusColor(todo.status)} ${isThreading ? 'animate-pulse' : ''}`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-900 truncate">{todo.title}</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex gap-0.5">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-1 rounded-sm ${
                  i < done
                    ? 'bg-green-500'
                    : i === done && isThreading
                    ? 'bg-amber-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${getComplexityStyle(todo.complexity)}`}>
            {getComplexityLabel(todo.complexity)}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-100 text-indigo-600">
            {todo.missionTitle}
          </span>
        </div>
      </div>
      <div className={`text-xs font-medium ${isWoven ? 'text-green-600' : isThreading ? 'text-amber-600' : 'text-gray-400'}`}>
        {isWoven ? '✓ Done' : isThreading ? todo.stepProgress : 'Pending'}
      </div>
    </div>
  );
};

const ActivityItemComponent = ({ activity }: { activity: ActivityItem }) => {
  const iconStyles: Record<string, string> = {
    ai: 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white',
    git: 'bg-gray-800 text-white',
    woven: 'bg-green-500 text-white',
    system: 'bg-gray-100 text-gray-600',
    user: 'bg-pink-500 text-white',
  };

  const icons: Record<string, string> = {
    ai: '🤖',
    git: '⎇',
    woven: '✓',
    system: '⚙️',
    user: '👤',
  };

  return (
    <div className="flex gap-3 items-start">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${iconStyles[activity.type]}`}>
        {icons[activity.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-900 truncate">{activity.title}</div>
        <div className="text-[10px] text-gray-400">{activity.time}</div>
      </div>
    </div>
  );
};

const QuickAction = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-white hover:border-indigo-300 border border-transparent transition-all">
    <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center text-sm">
      {icon}
    </div>
    <div>
      <div className="text-xs font-medium text-gray-900">{title}</div>
      <div className="text-[10px] text-gray-400">{desc}</div>
    </div>
  </div>
);

export default ProjectDashboardPage;
