import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Settings, Home, Sparkles, PenLine, ChevronRight, Clock, Zap } from 'lucide-react';
import { useMissionStore, useUIStore, useToast, useAuthStore, useAIQuestionStore, useTodoStore } from '../stores';
import { useOnboardingStore } from '../components/onboarding';
import { api, aiAnalysisService } from '../services';
import { MissionBoard } from '../components/mission/MissionBoard';
import { MissionDetailModal } from '../components/mission/MissionDetailModal';
import { TodoDetailDrawer } from '../components/todo/TodoDetailDrawer';
import { AIQuestionPanel } from '../components/ai/AIQuestionPanel';
import { Modal } from '../components/feedback/Modal';
import { Input, TextArea } from '../components/form/Input';
import { Select } from '../components/form/Select';
import { Button } from '../components/common/Button';
import { SettingsModal } from '../components/settings/SettingsModal';
import { useTranslation } from '../hooks/useTranslation';
import type { Mission, Priority, Todo } from '../types';
import type { GeneratedMission } from '../services/aiAnalysisService';
import { clsx } from 'clsx';

type CreateMode = 'manual' | 'ai';

export function MissionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId: urlWorkspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useUIStore();

  // Use URL workspaceId or fallback to store
  const workspaceId = urlWorkspaceId || currentWorkspaceId;

  // Sync URL workspaceId to store
  useEffect(() => {
    if (urlWorkspaceId && urlWorkspaceId !== currentWorkspaceId) {
      setCurrentWorkspaceId(urlWorkspaceId);
    }
  }, [urlWorkspaceId, currentWorkspaceId, setCurrentWorkspaceId]);
  const { user } = useAuthStore();
  const { missions, isLoading, fetchMissions, createMission, updateMissionStatus } = useMissionStore();
  const { todos, fetchTodos } = useTodoStore();
  const { questions, openPanel, fetchQuestions } = useAIQuestionStore();
  const { isTourActive, setTourContext } = useOnboardingStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
  });
  const [isCreating, setIsCreating] = useState(false);

  // AI Mission Creation states
  const [createMode, setCreateMode] = useState<CreateMode>('manual');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMission, setGeneratedMission] = useState<GeneratedMission | null>(null);

  // Todo detail drawer (for tour)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  // Determine active view based on route
  const getActiveView = () => {
    if (location.pathname.includes('/timeline')) return 'timeline';
    return 'missions';
  };

  const activeView = getActiveView();

  useEffect(() => {
    if (workspaceId) {
      fetchMissions(workspaceId);
      fetchQuestions(workspaceId);
    }
  }, [workspaceId, fetchMissions, fetchQuestions]);

  // Register tour context when tour is active
  useEffect(() => {
    if (isTourActive) {
      setTourContext({
        openCreateMissionModal: () => setIsCreateModalOpen(true),
        closeCreateMissionModal: () => handleCloseCreateModal(),
        openMissionDetail: (missionId: string) => {
          const mission = missions.find(m => m.id === missionId);
          if (mission) setSelectedMission(mission);
        },
        closeMissionDetail: () => setSelectedMission(null),
        openTodoDetail: (todoId: string) => {
          const todo = todos.find(t => t.id === todoId);
          if (todo) setSelectedTodo(todo);
        },
        closeTodoDetail: () => setSelectedTodo(null),
      });
    }
  }, [isTourActive, missions, todos, setTourContext]);

  // Fetch todos when mission is selected
  useEffect(() => {
    if (selectedMission) {
      fetchTodos(selectedMission.id);
    }
  }, [selectedMission?.id, fetchTodos]);

  const handleViewChange = (view: string) => {
    if (!workspaceId) return;
    switch (view) {
      case 'missions':
        navigate(`/workspaces/${workspaceId}/missions`);
        break;
      case 'timeline':
        navigate(`/workspaces/${workspaceId}/timeline`);
        break;
    }
  };

  // Reset modal state when closing
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewMission({ title: '', description: '', priority: 'MEDIUM' });
    setCreateMode('manual');
    setAiPrompt('');
    setGeneratedMission(null);
  };

  // Generate mission from AI prompt
  const handleGenerateMission = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      const generated = await aiAnalysisService.generateMissionFromPrompt(aiPrompt);
      setGeneratedMission(generated);
    } catch {
      toast.error(t('toast.failed'), 'AI 미션 생성에 실패했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  // Create mission (manual or from AI-generated)
  const handleCreateMission = async () => {
    if (!workspaceId) return;

    // Determine mission data based on mode
    const missionData = createMode === 'ai' && generatedMission
      ? {
          title: generatedMission.title,
          description: generatedMission.description,
          priority: generatedMission.priority,
        }
      : {
          title: newMission.title,
          description: newMission.description || undefined,
          priority: newMission.priority,
        };

    if (!missionData.title?.trim()) return;

    setIsCreating(true);
    try {
      const created = await createMission({
        workspaceId,
        ...missionData,
      });

      // If AI-generated, also create the suggested todos
      if (createMode === 'ai' && generatedMission && created) {
        try {
          for (const todo of generatedMission.suggestedTodos) {
            await api.post('/todos', {
              missionId: created.id,
              title: todo.title,
              description: todo.description,
              priority: 'MEDIUM',
            });
          }
          toast.success(t('toast.missionCreated'), `미션과 ${generatedMission.suggestedTodos.length}개의 TODO가 생성되었습니다`);
        } catch (todoError) {
          console.error('Failed to create todos:', todoError);
          toast.success(t('toast.missionCreated'), '미션이 생성되었습니다 (TODO 생성 일부 실패)');
        }
      } else {
        toast.success(t('toast.missionCreated'), t('toast.missionCreatedDesc'));
      }

      handleCloseCreateModal();
    } catch {
      toast.error(t('toast.failed'), t('toast.missionCreateFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
  };

  const handleStartMission = async (missionId: string) => {
    try {
      // Update mission status
      await updateMissionStatus(missionId, 'THREADING');

      // If there are todos, start worker for the first pending one
      const missionTodos = todos.filter(t => t.missionId === missionId);
      const pendingTodo = missionTodos.find(t => t.status === 'PENDING' || t.status === 'BACKLOG');

      console.log('[MissionsPage] handleStartMission:', {
        missionId,
        totalTodos: todos.length,
        missionTodosCount: missionTodos.length,
        pendingTodo: pendingTodo ? { id: pendingTodo.id, title: pendingTodo.title, status: pendingTodo.status } : null
      });

      if (pendingTodo) {
        try {
          // Get workspace path for the worker
          const workspacePath = selectedMission?.workspacePath || '/tmp/threadcast';
          console.log('[MissionsPage] Starting worker for todo:', pendingTodo.id, 'workDir:', workspacePath);

          await api.post(`/hub/todos/${pendingTodo.id}/start-worker`, {
            workDir: workspacePath
          });
          toast.success(t('toast.weavingStarted'), `AI Worker가 "${pendingTodo.title}" 작업을 시작합니다`);
        } catch (workerError) {
          console.error('[MissionsPage] Failed to start worker:', workerError);
          toast.error(t('toast.failed'), 'AI Worker 시작에 실패했습니다');
        }
      } else if (missionTodos.length === 0) {
        // No todos exist for this mission
        toast.info('알림', 'Mission에 TODO가 없습니다. AI 분석으로 TODO를 먼저 생성해주세요.');
      } else {
        // All todos are already in progress or completed
        const threadingCount = missionTodos.filter(t => t.status === 'THREADING' || t.status === 'IN_PROGRESS').length;
        const completedCount = missionTodos.filter(t => t.status === 'WOVEN' || t.status === 'COMPLETED').length;
        toast.info('알림', `진행 중: ${threadingCount}개, 완료: ${completedCount}개`);
      }

      setSelectedMission(null);
    } catch {
      toast.error(t('toast.failed'), t('toast.missionStartFailed'));
    }
  };

  const handleTodoClick = (todoId: string) => {
    if (selectedMission && workspaceId) {
      setSelectedMission(null);
      navigate(`/workspaces/${workspaceId}/missions/${selectedMission.id}/todos?highlight=${todoId}`);
    }
  };

  // Get unique mission IDs that have questions
  const missionIdsWithQuestions = [...new Set(questions.map(q => q.missionId).filter(Boolean))];
  const aiQuestionsCount = questions.length;

  // Create mapping of mission ID to question count for board display
  const aiQuestionsByMission = questions.reduce((acc, q) => {
    if (q.missionId) {
      acc[q.missionId] = (acc[q.missionId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Create mapping of todo ID to question count for modal display
  const aiQuestionsByTodo = questions.reduce((acc, q) => {
    if (q.todoId) {
      acc[q.todoId] = (acc[q.todoId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);


  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/workspaces')}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="Home"
          >
            <Home size={20} />
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-600" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {user?.name ? t('nav.myWorkspace', { name: user.name }) : t('nav.myWorkspaceDefault')}
          </h1>
          <div className="view-switcher">
            <button
              className={`view-btn ${activeView === 'missions' ? 'active' : ''}`}
              onClick={() => handleViewChange('missions')}
            >
              🎯 {t('nav.missions')}
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
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={t('settings.title')}
          >
            <Settings size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} data-tour="create-mission-btn">
            {t('mission.newMission')}
          </Button>
        </div>
      </div>

      {/* AI Question Banner */}
      {aiQuestionsCount > 0 && (
        <div className="mx-6 mt-4">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all border-l-4 border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 dark:from-pink-950/50 dark:to-purple-950/50 dark:hover:from-pink-900/50 dark:hover:to-purple-900/50"
            onClick={openPanel}
          >
            <div className="relative">
              <span className="text-2xl animate-pulse">🤔</span>
              <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                {aiQuestionsCount}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-pink-600 dark:text-pink-400 mb-1">
                {t('ai.aiWaitingQuestions', { count: aiQuestionsCount.toString() })}
              </div>
              <div className="flex gap-1 mb-1 flex-wrap">
                {missionIdsWithQuestions.slice(0, 3).map((missionId) => {
                  const mission = missions.find(m => m.id === missionId);
                  return (
                    <span
                      key={missionId}
                      className="bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 text-[11px] font-medium px-1.5 py-0.5 rounded"
                    >
                      {mission?.title?.slice(0, 15) || `MISSION-${missionId?.slice(-4).toUpperCase()}`}
                    </span>
                  );
                })}
                {missionIdsWithQuestions.length > 3 && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">+{missionIdsWithQuestions.length - 3}</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('ai.blockedTasks', { count: aiQuestionsCount.toString() })}
              </div>
            </div>
            <button
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[13px] font-semibold rounded-md transition-colors whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                openPanel();
              }}
            >
              {t('ai.answerNow', { count: aiQuestionsCount.toString() })}
            </button>
          </div>
        </div>
      )}

      {/* Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6" data-tour="mission-list">
        <MissionBoard
          missions={missions}
          onMissionClick={handleMissionClick}
          onAddMission={() => setIsCreateModalOpen(true)}
          onMissionStatusChange={updateMissionStatus}
          isLoading={isLoading}
          aiQuestionsByMission={aiQuestionsByMission}
        />
      </div>

      {/* AI Question Panel */}
      <AIQuestionPanel />

      {/* Mission Detail Modal */}
      <MissionDetailModal
        isOpen={!!selectedMission}
        onClose={() => setSelectedMission(null)}
        mission={selectedMission}
        todos={todos}
        onStartWeaving={() => selectedMission && handleStartMission(selectedMission.id)}
        onTodoClick={handleTodoClick}
        aiQuestionsByTodo={aiQuestionsByTodo}
        onTodosCreated={() => {
          // Refresh missions and todos after AI-generated todos are created
          if (currentWorkspaceId) {
            fetchMissions(currentWorkspaceId);
            if (selectedMission) {
              fetchTodos(selectedMission.id);
            }
          }
        }}
        onTodosRefresh={() => {
          // Refresh todos after dependency changes in graph view
          if (selectedMission) {
            fetchTodos(selectedMission.id);
          }
        }}
      />

      {/* Todo Detail Drawer (for tour) */}
      <TodoDetailDrawer
        isOpen={!!selectedTodo}
        onClose={() => setSelectedTodo(null)}
        todo={selectedTodo}
        onRefresh={() => selectedMission && fetchTodos(selectedMission.id)}
      />

      {/* Create Mission Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title={t('mission.createMissionTitle')}
        size="lg"
        data-tour="create-mission-modal"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseCreateModal}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateMission}
              isLoading={isCreating}
              disabled={createMode === 'manual' ? !newMission.title.trim() : !generatedMission}
            >
              {createMode === 'ai' && generatedMission
                ? `미션 + ${generatedMission.suggestedTodos.length}개 TODO 생성`
                : t('mission.createMission')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Mode Toggle Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setCreateMode('manual')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                createMode === 'manual'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <PenLine size={16} />
              직접 입력
            </button>
            <button
              onClick={() => setCreateMode('ai')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                createMode === 'ai'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Sparkles size={16} />
              AI로 생성
            </button>
          </div>

          {/* Manual Mode */}
          {createMode === 'manual' && (
            <>
              <Input
                label={t('mission.title')}
                value={newMission.title}
                onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                placeholder={t('mission.titlePlaceholder')}
                fullWidth
              />
              <TextArea
                label={t('mission.description')}
                value={newMission.description}
                onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                placeholder={t('mission.descriptionPlaceholder')}
                fullWidth
              />
              <Select
                label={t('mission.priority')}
                value={newMission.priority}
                onChange={(e) => setNewMission({ ...newMission, priority: e.target.value as Priority })}
                options={[
                  { value: 'CRITICAL', label: t('mission.priorityCritical') },
                  { value: 'HIGH', label: t('mission.priorityHigh') },
                  { value: 'MEDIUM', label: t('mission.priorityMedium') },
                  { value: 'LOW', label: t('mission.priorityLow') },
                ]}
                fullWidth
              />

              {/* Mission Templates */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('mission.quickTemplates')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: t('mission.templateFeature'), desc: t('mission.templateFeatureDesc') },
                    { title: t('mission.templateBugfix'), desc: t('mission.templateBugfixDesc') },
                    { title: t('mission.templateRefactor'), desc: t('mission.templateRefactorDesc') },
                    { title: t('mission.templateApi'), desc: t('mission.templateApiDesc') },
                  ].map((template) => (
                    <button
                      key={template.title}
                      type="button"
                      onClick={() => setNewMission({ ...newMission, title: template.title, description: template.desc })}
                      className="p-2 text-left border border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/50 transition-colors"
                    >
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{template.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{template.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* AI Mode */}
          {createMode === 'ai' && (
            <>
              {/* AI Prompt Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  무엇을 만들고 싶으신가요?
                </label>
                <div className="relative">
                  <TextArea
                    value={aiPrompt}
                    onChange={(e) => {
                      setAiPrompt(e.target.value);
                      setGeneratedMission(null); // Reset preview when prompt changes
                    }}
                    placeholder="예: 사용자 인증 시스템 구현, 다크모드 추가, 검색 기능 개발..."
                    fullWidth
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleGenerateMission}
                    disabled={!aiPrompt.trim() || isGenerating}
                    isLoading={isGenerating}
                    variant="secondary"
                    size="sm"
                  >
                    {isGenerating ? 'AI가 분석 중...' : '미션 생성하기'}
                  </Button>
                  {!generatedMission && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Enter를 누르거나 버튼을 클릭하세요
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Prompt Suggestions */}
              {!generatedMission && !isGenerating && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    빠른 시작
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '다크모드 테마 추가',
                      '실시간 알림 시스템',
                      '통합 검색 기능',
                      '사용자 인증',
                      '대시보드 페이지',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setAiPrompt(suggestion)}
                        className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Mission Preview */}
              {generatedMission && (
                <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-purple-500" />
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          AI 생성 미션
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {generatedMission.title}
                      </h4>
                    </div>
                    <span className={clsx(
                      'px-2 py-0.5 text-xs font-medium rounded',
                      generatedMission.priority === 'CRITICAL' && 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                      generatedMission.priority === 'HIGH' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
                      generatedMission.priority === 'MEDIUM' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                      generatedMission.priority === 'LOW' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                    )}>
                      {generatedMission.priority}
                    </span>
                  </div>

                  {/* Generated Todos Preview */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        생성될 TODO ({generatedMission.suggestedTodos.length}개)
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        총 {generatedMission.suggestedTodos.reduce((sum, t) => sum + t.estimatedTime, 0)}분 예상
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {generatedMission.suggestedTodos.map((todo, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                        >
                          <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-500">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                              {todo.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={clsx(
                                'text-[10px] px-1.5 py-0.5 rounded',
                                todo.complexity === 'LOW' && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
                                todo.complexity === 'MEDIUM' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
                                todo.complexity === 'HIGH' && 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                              )}>
                                {todo.complexity}
                              </span>
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                                <Clock size={10} />
                                {todo.estimatedTime}분
                              </span>
                              {todo.dependsOn && todo.dependsOn.length > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-purple-500">
                                  <ChevronRight size={10} />
                                  #{todo.dependsOn.map(d => d + 1).join(', ')} 이후
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Regenerate button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleGenerateMission}
                      disabled={isGenerating}
                      className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      <Zap size={12} />
                      다시 생성
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
