import type { Meta, StoryObj } from '@storybook/react';
import { TodoColumn } from './TodoColumn';
import type { Todo, TodoStep, StepType, StepStatus } from '../../types';

const stepTypes: StepType[] = ['ANALYSIS', 'DESIGN', 'IMPLEMENTATION', 'VERIFICATION', 'REVIEW', 'INTEGRATION'];

const createSteps = (completedCount: number, currentIndex?: number): TodoStep[] => {
  return stepTypes.map((stepType, index) => ({
    id: `step-${index + 1}`,
    todoId: 'todo-1',
    stepType,
    status: (
      index < completedCount
        ? 'COMPLETED'
        : index === currentIndex
        ? 'IN_PROGRESS'
        : 'PENDING'
    ) as StepStatus,
  }));
};

const createMockTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: Math.random().toString(36).substr(2, 9),
  missionId: 'mission-1',
  title: 'Sample Todo',
  description: 'This is a sample todo description',
  status: 'PENDING',
  priority: 'MEDIUM',
  complexity: 'MEDIUM',
  estimatedTime: 30,
  orderIndex: 1,
  steps: createSteps(0),
  dependencies: [],
  createdAt: '2026-01-20T10:00:00Z',
  ...overrides,
});

const pendingTodos: Todo[] = [
  createMockTodo({
    id: '1',
    title: 'Set up database connection',
    priority: 'HIGH',
    estimatedTime: 20,
  }),
  createMockTodo({
    id: '2',
    title: 'Create entity models',
    priority: 'MEDIUM',
    estimatedTime: 45,
  }),
];

const threadingTodos: Todo[] = [
  createMockTodo({
    id: '3',
    title: 'Implement JWT validation',
    status: 'THREADING',
    priority: 'HIGH',
    steps: createSteps(2, 2),
    estimatedTime: 60,
  }),
  createMockTodo({
    id: '4',
    title: 'Add user registration',
    status: 'THREADING',
    priority: 'MEDIUM',
    steps: createSteps(3, 3),
    estimatedTime: 40,
  }),
  createMockTodo({
    id: '5',
    title: 'Create login endpoint',
    status: 'THREADING',
    priority: 'LOW',
    steps: createSteps(4, 4),
    estimatedTime: 35,
  }),
];

const wovenTodos: Todo[] = [
  createMockTodo({
    id: '6',
    title: 'Configure Spring Security',
    status: 'WOVEN',
    priority: 'HIGH',
    steps: createSteps(6),
    estimatedTime: 50,
  }),
];

const meta: Meta<typeof TodoColumn> = {
  title: 'Todo/TodoColumn',
  component: TodoColumn,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Todo 보드의 개별 컬럼 컴포넌트입니다.

## 컬럼 상태

| 상태 | 설명 | 색상 |
|------|------|------|
| PENDING | 작업 대기 중인 Todo | 회색 |
| THREADING | AI가 작업 중인 Todo 🧵 | 노란색 |
| WOVEN | 완료된 Todo ✅ | 초록색 |
| TANGLED | 실패한 Todo ❌ | 빨간색 |

## 헤더 정보
- 상태 아이콘 및 라벨
- 컬럼 내 Todo 개수
- 추가 버튼 (PENDING 컬럼)

## TodoCard 표시 정보
- 제목 및 설명
- 우선순위 배지
- 6-Step 진행률 (compact view)
- 예상 소요 시간

## 인터랙션
- Todo 클릭 → 상세 패널 열기
- 추가 버튼 → 새 Todo 생성 모달

## 사용 예시
\`\`\`tsx
<TodoColumn
  status="THREADING"
  todos={threadingTodos}
  selectedTodoId={selectedId}
  onTodoClick={handleSelect}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-72 h-[600px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    status: {
      control: 'select',
      options: ['PENDING', 'THREADING', 'WOVEN', 'TANGLED'],
    },
    onTodoClick: { action: 'todo clicked' },
    onAddClick: { action: 'add clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof TodoColumn>;

export const Pending: Story = {
  args: {
    status: 'PENDING',
    todos: pendingTodos,
  },
};

export const Threading: Story = {
  args: {
    status: 'THREADING',
    todos: threadingTodos,
  },
};

export const Woven: Story = {
  args: {
    status: 'WOVEN',
    todos: wovenTodos,
  },
};

export const Empty: Story = {
  args: {
    status: 'PENDING',
    todos: [],
  },
};

export const Loading: Story = {
  args: {
    status: 'THREADING',
    todos: [],
    isLoading: true,
  },
};

export const WithSelectedTodo: Story = {
  args: {
    status: 'THREADING',
    todos: threadingTodos,
    selectedTodoId: '4',
  },
};

export const WithAddButton: Story = {
  args: {
    status: 'PENDING',
    todos: pendingTodos,
    onAddClick: () => alert('Add todo clicked!'),
  },
};

export const ManyTodos: Story = {
  args: {
    status: 'THREADING',
    todos: [
      ...threadingTodos,
      createMockTodo({
        id: '7',
        title: 'Additional Todo 1',
        status: 'THREADING',
        steps: createSteps(1, 1),
      }),
      createMockTodo({
        id: '8',
        title: 'Additional Todo 2',
        status: 'THREADING',
        steps: createSteps(4, 4),
      }),
    ],
  },
};
