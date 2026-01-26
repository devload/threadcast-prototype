import type { Meta, StoryObj } from '@storybook/react';
import { TodoBoard } from './TodoBoard';
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

const allTodos: Todo[] = [
  // Pending
  createMockTodo({
    id: '1',
    title: 'Set up database connection',
    status: 'PENDING',
    priority: 'HIGH',
    estimatedTime: 20,
  }),
  createMockTodo({
    id: '2',
    title: 'Create entity models',
    status: 'PENDING',
    priority: 'MEDIUM',
    estimatedTime: 45,
  }),
  // Threading
  createMockTodo({
    id: '3',
    title: 'Implement JWT validation',
    description: 'Add token validation with Spring Security',
    status: 'THREADING',
    priority: 'HIGH',
    steps: createSteps(2, 2),
    estimatedTime: 60,
  }),
  createMockTodo({
    id: '4',
    title: 'Add user registration',
    description: 'Registration endpoint with validation',
    status: 'THREADING',
    priority: 'MEDIUM',
    steps: createSteps(3, 3),
    estimatedTime: 40,
  }),
  createMockTodo({
    id: '5',
    title: 'Create login endpoint',
    description: 'Authentication with JWT response',
    status: 'THREADING',
    priority: 'LOW',
    steps: createSteps(4, 4),
    estimatedTime: 35,
  }),
  // Woven
  createMockTodo({
    id: '6',
    title: 'Configure Spring Security',
    status: 'WOVEN',
    priority: 'HIGH',
    steps: createSteps(6),
    estimatedTime: 50,
  }),
  createMockTodo({
    id: '7',
    title: 'Add CORS configuration',
    status: 'WOVEN',
    priority: 'MEDIUM',
    steps: createSteps(6),
    estimatedTime: 15,
  }),
];

const meta: Meta<typeof TodoBoard> = {
  title: 'Todo/TodoBoard',
  component: TodoBoard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Todo를 칸반 보드 형태로 관리하는 컴포넌트입니다.

## 컬럼 구성

| 컬럼 | 상태 | 설명 |
|------|------|------|
| Pending | PENDING | AI가 작업을 시작하지 않은 Todo |
| Threading | THREADING | AI가 작업 중인 Todo (🧵) |
| Woven | WOVEN | 완료된 Todo (✅) |

## 주요 기능
- 드래그 앤 드롭으로 상태 변경 (예정)
- Todo 선택 시 상세 패널 표시
- 컬럼별 Todo 개수 표시
- 로딩 상태 스켈레톤

## Todo 상태 흐름
\`\`\`
PENDING → THREADING → WOVEN
                ↓
            TANGLED (실패 시)
\`\`\`

## 6-Step 진행
Threading 상태의 Todo는 6단계로 진행됩니다:
1. Analysis → 2. Design → 3. Implementation
→ 4. Verification → 5. Review → 6. Integration

## 사용 예시
\`\`\`tsx
<TodoBoard
  todos={todos}
  selectedTodoId={selectedId}
  onTodoClick={handleSelect}
  onAddTodo={handleAdd}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-6 bg-slate-50 min-h-screen">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onTodoClick: { action: 'todo clicked' },
    onAddTodo: { action: 'add todo clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof TodoBoard>;

export const Default: Story = {
  args: {
    todos: allTodos,
  },
};

export const WithSelectedTodo: Story = {
  args: {
    todos: allTodos,
    selectedTodoId: '4',
  },
};

export const Empty: Story = {
  args: {
    todos: [],
  },
};

export const Loading: Story = {
  args: {
    todos: [],
    isLoading: true,
  },
};

export const OnlyPending: Story = {
  args: {
    todos: allTodos.filter((t) => t.status === 'PENDING'),
  },
};

export const OnlyThreading: Story = {
  args: {
    todos: allTodos.filter((t) => t.status === 'THREADING'),
  },
};

export const FullBoard: Story = {
  args: {
    todos: [
      ...allTodos,
      createMockTodo({
        id: '8',
        title: 'Add password hashing',
        status: 'PENDING',
        priority: 'HIGH',
      }),
      createMockTodo({
        id: '9',
        title: 'Implement refresh token',
        status: 'THREADING',
        priority: 'MEDIUM',
        steps: createSteps(1, 1),
      }),
      createMockTodo({
        id: '10',
        title: 'Add rate limiting',
        status: 'WOVEN',
        priority: 'LOW',
        steps: createSteps(6),
      }),
    ],
  },
};

export const WithAIQuestions: Story = {
  args: {
    todos: allTodos,
    aiQuestionsByTodo: {
      '3': 2, // Implement JWT validation - 2 questions
      '4': 1, // Add user registration - 1 question
    },
    onAIQuestionClick: (todoId: string) => alert(`AI 질문 패널 열기: ${todoId}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'AI가 질문을 기다리고 있는 Todo들을 표시합니다. Threading 상태의 Todo 중 AI 질문이 있는 카드에 분홍색 테두리와 클릭 가능한 배지가 표시됩니다.',
      },
    },
  },
};

export const MixedAIQuestions: Story = {
  args: {
    todos: [
      ...allTodos,
      createMockTodo({
        id: '11',
        title: 'OAuth2 연동 구현',
        description: 'Google, GitHub OAuth2 인증 추가',
        status: 'THREADING',
        priority: 'HIGH',
        steps: createSteps(1, 1),
        estimatedTime: 90,
      }),
    ],
    aiQuestionsByTodo: {
      '3': 3, // 3 questions
      '11': 1, // 1 question
    },
    onAIQuestionClick: (todoId: string) => alert(`AI 질문 패널 열기: ${todoId}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'AI 질문이 있는 Todo와 없는 Todo가 섞여 있는 상태. AI 질문 배지를 클릭하면 해당 Todo의 질문만 필터링된 AI 패널이 열립니다.',
      },
    },
  },
};
