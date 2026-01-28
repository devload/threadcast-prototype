import { useState, useCallback } from 'react';
import type { Todo, TodoStatus } from '../../types';
import { TodoColumn } from './TodoColumn';

interface TodoBoardProps {
  todos: Todo[];
  onTodoClick?: (todo: Todo) => void;
  onAddTodo?: () => void;
  onTodoStatusChange?: (todoId: string, newStatus: TodoStatus) => void;
  selectedTodoId?: string;
  highlightedTodoId?: string | null;
  isLoading?: boolean;
  aiQuestionsByTodo?: Record<string, number>;
  onAIQuestionClick?: (todoId: string) => void;
}

const statusOrder: TodoStatus[] = ['BACKLOG', 'PENDING', 'THREADING', 'WOVEN', 'TANGLED'];

export function TodoBoard({
  todos = [],
  onTodoClick,
  onAddTodo,
  onTodoStatusChange,
  selectedTodoId,
  highlightedTodoId,
  isLoading = false,
  aiQuestionsByTodo = {},
  onAIQuestionClick,
}: TodoBoardProps) {
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TodoStatus | null>(null);

  // Group todos by status (with safe fallback)
  const safeTodos = todos || [];
  const todosByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = safeTodos.filter((t) => t.status === status);
    return acc;
  }, {} as Record<TodoStatus, Todo[]>);

  const handleDragStart = useCallback((todo: Todo) => {
    setDraggedTodo(todo);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTodo(null);
    setDragOverStatus(null);
  }, []);

  const handleDragOver = useCallback((status: TodoStatus) => {
    setDragOverStatus(status);
  }, []);

  const handleDrop = useCallback((targetStatus: TodoStatus) => {
    if (draggedTodo && draggedTodo.status !== targetStatus && onTodoStatusChange) {
      onTodoStatusChange(draggedTodo.id, targetStatus);
    }
    setDraggedTodo(null);
    setDragOverStatus(null);
  }, [draggedTodo, onTodoStatusChange]);

  return (
    <div className="kanban-board">
      {statusOrder.map((status) => (
        <TodoColumn
          key={status}
          status={status}
          todos={todosByStatus[status]}
          onTodoClick={onTodoClick}
          onAddClick={(status === 'BACKLOG' || status === 'PENDING') ? onAddTodo : undefined}
          selectedTodoId={selectedTodoId}
          highlightedTodoId={highlightedTodoId}
          isLoading={isLoading}
          aiQuestionsByTodo={aiQuestionsByTodo}
          onAIQuestionClick={onAIQuestionClick}
          // Drag and drop props
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={() => handleDragOver(status)}
          onDrop={() => handleDrop(status)}
          isDragOver={dragOverStatus === status}
          draggedTodoId={draggedTodo?.id}
        />
      ))}
    </div>
  );
}
