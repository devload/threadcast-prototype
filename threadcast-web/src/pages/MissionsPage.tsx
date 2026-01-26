import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useMissionStore, useUIStore, useToast, useAuthStore, useAIQuestionStore, useTodoStore } from '../stores';
import { MissionBoard } from '../components/mission/MissionBoard';
import { MissionDetailModal } from '../components/mission/MissionDetailModal';
import { AIQuestionPanel } from '../components/ai/AIQuestionPanel';
import { Modal } from '../components/feedback/Modal';
import { Input, TextArea } from '../components/form/Input';
import { Select } from '../components/form/Select';
import { Button } from '../components/common/Button';
import { SettingsModal } from '../components/settings/SettingsModal';
import { useTranslation } from '../hooks/useTranslation';
import type { Mission, Priority } from '../types';

export function MissionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspaceId } = useUIStore();
  const { user } = useAuthStore();
  const { missions, isLoading, fetchMissions, createMission, updateMissionStatus } = useMissionStore();
  const { todos, fetchTodos } = useTodoStore();
  const { questions, openPanel, fetchQuestions } = useAIQuestionStore();
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

  // Determine active view based on route
  const getActiveView = () => {
    if (location.pathname.includes('/timeline')) return 'timeline';
    return 'missions';
  };

  const activeView = getActiveView();

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchMissions(currentWorkspaceId);
      fetchQuestions(currentWorkspaceId);
    }
  }, [currentWorkspaceId, fetchMissions, fetchQuestions]);

  // Fetch todos when mission is selected
  useEffect(() => {
    if (selectedMission) {
      fetchTodos(selectedMission.id);
    }
  }, [selectedMission?.id, fetchTodos]);

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

  const handleCreateMission = async () => {
    if (!currentWorkspaceId || !newMission.title.trim()) return;

    setIsCreating(true);
    try {
      await createMission({
        workspaceId: currentWorkspaceId,
        title: newMission.title,
        description: newMission.description || undefined,
        priority: newMission.priority,
      });
      toast.success(t('toast.missionCreated'), t('toast.missionCreatedDesc'));
      setIsCreateModalOpen(false);
      setNewMission({ title: '', description: '', priority: 'MEDIUM' });
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
      await updateMissionStatus(missionId, 'THREADING');
      toast.success(t('toast.weavingStarted'), t('toast.weavingStartedDesc'));
      setSelectedMission(null);
    } catch {
      toast.error(t('toast.failed'), t('toast.missionStartFailed'));
    }
  };

  const handleTodoClick = (todoId: string) => {
    if (selectedMission) {
      setSelectedMission(null);
      navigate(`/missions/${selectedMission.id}/todos?highlight=${todoId}`);
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
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {user?.name ? t('nav.myWorkspace', { name: user.name }) : t('nav.myWorkspaceDefault')}
          </h1>
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
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title={t('settings.title')}
          >
            <Settings size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
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
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
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
      />

      {/* Create Mission Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('mission.createMissionTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateMission}
              isLoading={isCreating}
              disabled={!newMission.title.trim()}
            >
              {t('mission.createMission')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('mission.quickTemplates')}</label>
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
                  className="p-2 text-left border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <div className="text-sm font-medium text-slate-700">{template.title}</div>
                  <div className="text-xs text-slate-500">{template.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
