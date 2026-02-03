import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { useTodoStore, useMissionStore, useUIStore, useAuthStore, useToast, useAIQuestionStore } from '../stores';
import { Logo } from '../components/common/Logo';
import { AIQuestionPanel } from '../components/ai/AIQuestionPanel';
import { TodoBoard } from '../components/todo/TodoBoard';
import { TodoDetailDrawer } from '../components/todo/TodoDetailDrawer';
import { Modal } from '../components/feedback/Modal';
import { Input, TextArea } from '../components/form/Input';
import { Select } from '../components/form/Select';
import { Button } from '../components/common/Button';
import { SettingsModal } from '../components/settings/SettingsModal';
import { SidebarFooter } from '../components/layout/SidebarFooter';
import { useTranslation } from '../hooks/useTranslation';
import type { Todo, TodoStatus, Priority, Complexity } from '../types';

type StatusFilterType = 'all' | TodoStatus;

export function TodosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { missionId } = useParams<{ missionId: string }>();
  const { currentWorkspaceId } = useUIStore();
  const { user, logout } = useAuthStore();
  const { missions, selectedMission, fetchMissions, fetchMission } = useMissionStore();
  const { todos, selectedTodo, isLoading, fetchTodos, createTodo, updateTodoStatus, selectTodo } = useTodoStore();
  const { questions, openPanelForTodo } = useAIQuestionStore();
  const toast = useToast();
  const { t } = useTranslation();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusFilterType>('all');

  const statusFilters: { id: StatusFilterType; label: string; icon: string }[] = [
    { id: 'all', label: t('todo.allTodos'), icon: '📋' },
    { id: 'BACKLOG', label: t('todo.backlog'), icon: '📦' },
    { id: 'PENDING', label: t('todo.pending'), icon: '⏳' },
    { id: 'THREADING', label: t('todo.threading'), icon: '🧵' },
    { id: 'WOVEN', label: t('todo.woven'), icon: '✅' },
    { id: 'TANGLED', label: t('todo.tangled'), icon: '❌' },
  ];
  const [highlightedTodoId, setHighlightedTodoId] = useState<string | null>(null);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    complexity: 'MEDIUM' as Complexity,
    estimatedTime: 60,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Handle highlight from URL
  useEffect(() => {
    const highlight = searchParams.get('highlight');
    if (highlight) {
      setHighlightedTodoId(highlight);
      const timer = setTimeout(() => {
        setHighlightedTodoId(null);
        searchParams.delete('highlight');
        setSearchParams(searchParams, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchMissions(currentWorkspaceId);
    }
  }, [currentWorkspaceId, fetchMissions]);

  useEffect(() => {
    if (missionId) {
      fetchMission(missionId).catch((error) => {
        console.warn('Failed to fetch mission:', error.message);
        toast.error('Mission을 찾을 수 없습니다. 목록으로 이동합니다.');
        navigate('/missions');
      });
      fetchTodos(missionId).catch((error) => {
        console.warn('Failed to fetch todos:', error.message);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  const currentMission = missions.find(m => m.id === missionId) || selectedMission;

  // Filter todos based on active filter
  const filteredTodos = activeFilter === 'all'
    ? todos
    : todos.filter(t => t.status === activeFilter);

  // Calculate filter counts
  const filterCounts: Record<StatusFilterType, number> = {
    all: todos.length,
    BACKLOG: todos.filter(t => t.status === 'BACKLOG').length,
    PENDING: todos.filter(t => t.status === 'PENDING').length,
    THREADING: todos.filter(t => t.status === 'THREADING').length,
    WOVEN: todos.filter(t => t.status === 'WOVEN').length,
    TANGLED: todos.filter(t => t.status === 'TANGLED').length,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    ARCHIVED: 0,
    SKIPPED: 0,
  };

  // Create mapping of todo ID to question count
  const aiQuestionsByTodo = questions.reduce((acc, q) => {
    if (q.todoId) {
      acc[q.todoId] = (acc[q.todoId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const handleCreateTodo = async () => {
    if (!missionId || !newTodo.title.trim()) return;

    setIsCreating(true);
    try {
      await createTodo({
        missionId: missionId,
        title: newTodo.title,
        description: newTodo.description || undefined,
        priority: newTodo.priority,
        complexity: newTodo.complexity,
        estimatedTime: newTodo.estimatedTime,
      });
      toast.success(t('toast.todoCreated'), t('toast.todoCreatedDesc'));
      setIsCreateModalOpen(false);
      setNewTodo({
        title: '',
        description: '',
        priority: 'MEDIUM',
        complexity: 'MEDIUM',
        estimatedTime: 60,
      });
    } catch {
      toast.error(t('toast.failed'), t('toast.todoCreateFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleTodoClick = (todo: Todo) => {
    selectTodo(todo);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar - Todo Filters */}
      <aside className="w-[260px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-y-auto flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="mb-3">
            <Logo size="sm" />
          </div>
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md text-sm dark:text-slate-200">
            {user?.name ? t('nav.myWorkspace', { name: user.name }) : t('nav.myWorkspaceDefault')}
          </div>
        </div>

        {/* Current Mission Info */}
        {currentMission && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2 px-2">
              {t('mission.currentMission')}
            </div>
            <div className="px-2">
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                MISSION-{currentMission.id.slice(-4).toUpperCase()}
              </div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                {currentMission.title}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full"
                    style={{ width: `${currentMission.progress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{currentMission.progress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Filters */}
        <div className="flex-1 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3 px-2">
            {t('todo.filterByStatus')}
          </div>
          <div className="space-y-0.5">
            {statusFilters.map((filter) => (
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

        {/* Stats Overview */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3 px-2">
            {t('todo.overview')}
          </div>
          <div className="grid grid-cols-2 gap-2 px-2">
            <div className="stat-card">
              <div className="stat-value">{todos.length}</div>
              <div className="stat-label">{t('common.total')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{filterCounts.THREADING}</div>
              <div className="stat-label">{t('todo.threading')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{filterCounts.WOVEN}</div>
              <div className="stat-label">{t('todo.woven')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{filterCounts.TANGLED}</div>
              <div className="stat-label">{t('todo.tangled')}</div>
            </div>
          </div>
        </div>

        {/* Help & User Footer */}
        <SidebarFooter
          user={user ? { name: user.name, email: user.email } : undefined}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/missions')}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">{t('nav.missions')}</span>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t('todo.todoBoard')}
            </h1>
            {activeFilter !== 'all' && (
              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
                {statusFilters.find(f => f.id === activeFilter)?.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title={t('settings.title')}
            >
              <Settings size={20} className="text-slate-500 dark:text-slate-400" />
            </button>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              {t('todo.addTodo')}
            </Button>
          </div>
        </div>

        {/* Board Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <TodoBoard
            todos={filteredTodos}
            onTodoClick={handleTodoClick}
            onAddTodo={() => setIsCreateModalOpen(true)}
            onTodoStatusChange={updateTodoStatus}
            selectedTodoId={selectedTodo?.id}
            highlightedTodoId={highlightedTodoId}
            isLoading={isLoading}
            aiQuestionsByTodo={aiQuestionsByTodo}
            onAIQuestionClick={openPanelForTodo}
          />
        </div>
      </main>

      {/* Create Todo Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('todo.createTodoTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateTodo}
              isLoading={isCreating}
              disabled={!newTodo.title.trim()}
            >
              {t('todo.createTodo')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('mission.title')}
            value={newTodo.title}
            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
            placeholder={t('todo.titlePlaceholder')}
            fullWidth
          />
          <TextArea
            label={t('mission.description')}
            value={newTodo.description}
            onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
            placeholder={t('todo.descriptionPlaceholder')}
            fullWidth
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('mission.priority')}
              value={newTodo.priority}
              onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as Priority })}
              options={[
                { value: 'CRITICAL', label: t('mission.priorityCritical') },
                { value: 'HIGH', label: t('mission.priorityHigh') },
                { value: 'MEDIUM', label: t('mission.priorityMedium') },
                { value: 'LOW', label: t('mission.priorityLow') },
              ]}
              fullWidth
            />
            <Select
              label={t('todo.complexity')}
              value={newTodo.complexity}
              onChange={(e) => setNewTodo({ ...newTodo, complexity: e.target.value as Complexity })}
              options={[
                { value: 'SIMPLE', label: t('todo.complexitySimple') },
                { value: 'MEDIUM', label: t('todo.complexityMedium') },
                { value: 'COMPLEX', label: t('todo.complexityComplex') },
              ]}
              fullWidth
            />
          </div>
          <Input
            label={t('todo.estimatedTime')}
            type="number"
            value={newTodo.estimatedTime}
            onChange={(e) => setNewTodo({ ...newTodo, estimatedTime: parseInt(e.target.value) || 0 })}
            fullWidth
          />
        </div>
      </Modal>

      {/* Todo Detail Drawer */}
      <TodoDetailDrawer
        isOpen={!!selectedTodo}
        onClose={() => selectTodo(null)}
        todo={selectedTodo}
        onRefresh={() => missionId && fetchTodos(missionId)}
      />

      {/* AI Question Panel */}
      <AIQuestionPanel />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
