import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTodoStore, useMissionStore, useToast } from '../stores';
import { TodoBoard } from '../components/todo/TodoBoard';
import { PageHeader } from '../components/layout/Header';
import { Modal, Drawer } from '../components/feedback/Modal';
import { Input, TextArea } from '../components/form/Input';
import { Select } from '../components/form/Select';
import { Button } from '../components/common/Button';
import { TodoSteps } from '../components/todo/TodoSteps';
import type { Todo, Priority, Complexity, StepType, StepStatus } from '../types';

export function TodosPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const { selectedMission, fetchMission } = useMissionStore();
  const { todos, selectedTodo, isLoading, fetchTodos, createTodo, updateStepStatus, selectTodo } = useTodoStore();
  const toast = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    complexity: 'MEDIUM' as Complexity,
    estimatedTime: 60,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (missionId) {
      fetchMission(missionId);
      fetchTodos(missionId);
    }
  }, [missionId, fetchMission, fetchTodos]);

  const handleCreateTodo = async () => {
    if (!missionId || !newTodo.title.trim()) return;

    setIsCreating(true);
    try {
      await createTodo({
        missionId,
        title: newTodo.title,
        description: newTodo.description || undefined,
        priority: newTodo.priority,
        complexity: newTodo.complexity,
        estimatedTime: newTodo.estimatedTime,
      });
      toast.success('Todo Created', 'New todo has been added');
      setIsCreateModalOpen(false);
      setNewTodo({
        title: '',
        description: '',
        priority: 'MEDIUM',
        complexity: 'MEDIUM',
        estimatedTime: 60,
      });
    } catch {
      toast.error('Failed', 'Could not create todo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTodoClick = (todo: Todo) => {
    selectTodo(todo);
  };

  const handleStepStatusChange = async (stepType: StepType, status: StepStatus) => {
    if (!selectedTodo) return;

    try {
      await updateStepStatus(selectedTodo.id, stepType, status);
      toast.success('Step Updated', `${stepType} marked as ${status.toLowerCase()}`);
    } catch {
      toast.error('Failed', 'Could not update step status');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={selectedMission?.title || 'Todos'}
        description={selectedMission?.description || 'Manage todos for this mission'}
        breadcrumbs={[
          { label: 'Missions', href: '/missions' },
          { label: selectedMission?.title || 'Loading...' },
        ]}
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Add Todo
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <TodoBoard
          todos={todos}
          onTodoClick={handleTodoClick}
          onAddTodo={() => setIsCreateModalOpen(true)}
          selectedTodoId={selectedTodo?.id}
          isLoading={isLoading}
        />
      </div>

      {/* Create Todo Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Todo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTodo}
              isLoading={isCreating}
              disabled={!newTodo.title.trim()}
            >
              Add Todo
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={newTodo.title}
            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
            placeholder="e.g., Implement login form"
            fullWidth
          />
          <TextArea
            label="Description"
            value={newTodo.description}
            onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
            placeholder="Describe the task..."
            fullWidth
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={newTodo.priority}
              onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as Priority })}
              options={[
                { value: 'CRITICAL', label: 'Critical' },
                { value: 'HIGH', label: 'High' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'LOW', label: 'Low' },
              ]}
              fullWidth
            />
            <Select
              label="Complexity"
              value={newTodo.complexity}
              onChange={(e) => setNewTodo({ ...newTodo, complexity: e.target.value as Complexity })}
              options={[
                { value: 'SIMPLE', label: 'Simple' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'COMPLEX', label: 'Complex' },
              ]}
              fullWidth
            />
          </div>
          <Input
            label="Estimated Time (minutes)"
            type="number"
            value={newTodo.estimatedTime}
            onChange={(e) => setNewTodo({ ...newTodo, estimatedTime: parseInt(e.target.value) || 0 })}
            fullWidth
          />
        </div>
      </Modal>

      {/* Todo Detail Drawer */}
      <Drawer
        isOpen={!!selectedTodo}
        onClose={() => selectTodo(null)}
        title={selectedTodo?.title || 'Todo Details'}
        size="lg"
      >
        {selectedTodo && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Description</h3>
              <p className="text-slate-700">
                {selectedTodo.description || 'No description provided'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Priority</h3>
                <p className="text-slate-700">{selectedTodo.priority}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Complexity</h3>
                <p className="text-slate-700">{selectedTodo.complexity}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-3">Progress Steps</h3>
              <TodoSteps
                steps={selectedTodo.steps}
                onStepClick={(step) => {
                  const nextStatus = step.status === 'PENDING' ? 'IN_PROGRESS' :
                                    step.status === 'IN_PROGRESS' ? 'COMPLETED' : 'PENDING';
                  handleStepStatusChange(step.stepType, nextStatus as StepStatus);
                }}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
