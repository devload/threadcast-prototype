import type { Todo, TodoStatus } from '../../types';
import { TodoColumn } from './TodoColumn';

interface TodoBoardProps {
  todos: Todo[];
  onTodoClick?: (todo: Todo) => void;
  onAddTodo?: () => void;
  selectedTodoId?: string;
  isLoading?: boolean;
}

const statusOrder: TodoStatus[] = ['PENDING', 'THREADING', 'WOVEN'];

export function TodoBoard({
  todos,
  onTodoClick,
  onAddTodo,
  selectedTodoId,
  isLoading = false,
}: TodoBoardProps) {
  // Group todos by status
  const todosByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = todos.filter((t) => t.status === status);
    return acc;
  }, {} as Record<TodoStatus, Todo[]>);

  return (
    <div className="kanban-board">
      {statusOrder.map((status) => (
        <TodoColumn
          key={status}
          status={status}
          todos={todosByStatus[status]}
          onTodoClick={onTodoClick}
          onAddClick={status === 'PENDING' ? onAddTodo : undefined}
          selectedTodoId={selectedTodoId}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
