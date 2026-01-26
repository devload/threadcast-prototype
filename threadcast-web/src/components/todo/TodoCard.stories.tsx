import type { Meta, StoryObj } from '@storybook/react';
import { TodoCard, TodoCardSkeleton } from './TodoCard';
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
    completedAt: index < completedCount ? '2026-01-21T10:00:00Z' : undefined,
  }));
};

const mockTodo: Todo = {
  id: 'todo-1',
  missionId: 'mission-1',
  title: 'Implement JWT Token Validation',
  description: 'Add token validation logic to the authentication filter',
  status: 'THREADING',
  priority: 'HIGH',
  complexity: 'MEDIUM',
  estimatedTime: 45,
  orderIndex: 1,
  steps: createSteps(2, 2),
  dependencies: [],
  createdAt: '2026-01-20T10:00:00Z',
};

const meta: Meta<typeof TodoCard> = {
  title: 'Todo/TodoCard',
  component: TodoCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Todo(할 일)를 표시하는 카드 컴포넌트입니다.

## ThreadCast Todo 개념
Todo는 Mission을 구성하는 개별 작업 단위입니다.
각 Todo는 6단계의 Step을 거쳐 완료됩니다.

## 6단계 Step 시스템
1. **ANALYSIS** - 분석: 요구사항 파악
2. **DESIGN** - 설계: 구조 및 방법 설계
3. **IMPLEMENTATION** - 구현: 실제 코드 작성
4. **VERIFICATION** - 검증: 테스트 및 검증
5. **REVIEW** - 리뷰: 코드 리뷰
6. **INTEGRATION** - 통합: 최종 통합

## 상태 (Status)
- **PENDING**: 대기 중
- **THREADING**: AI가 작업 중 (🧵)
- **WOVEN**: 완료됨 (✅)
- **TANGLED**: 문제 발생 (❌)

## 복잡도 (Complexity)
- **LOW/SIMPLE**: 단순한 작업
- **MEDIUM**: 보통 복잡도
- **HIGH/COMPLEX**: 복잡한 작업

## 표시 정보
- Step 진행 상황 (원형 인디케이터)
- 예상 소요 시간
- 우선순위 및 복잡도
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onClick: { action: 'clicked' },
    onMenuClick: { action: 'menu clicked' },
    selected: { control: 'boolean' },
    showSteps: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TodoCard>;

export const Default: Story = {
  args: {
    todo: mockTodo,
  },
};

export const Selected: Story = {
  args: {
    todo: mockTodo,
    selected: true,
  },
};

export const Pending: Story = {
  args: {
    todo: {
      ...mockTodo,
      status: 'PENDING',
      steps: createSteps(0),
    },
  },
};

export const InProgress: Story = {
  args: {
    todo: {
      ...mockTodo,
      status: 'THREADING',
      steps: createSteps(3, 3),
    },
  },
};

export const Completed: Story = {
  args: {
    todo: {
      ...mockTodo,
      status: 'WOVEN',
      steps: createSteps(6),
    },
  },
};

export const HighPriority: Story = {
  args: {
    todo: {
      ...mockTodo,
      priority: 'HIGH',
      title: 'Critical Security Fix',
    },
  },
};

export const MediumPriority: Story = {
  args: {
    todo: {
      ...mockTodo,
      priority: 'MEDIUM',
      title: 'Add Unit Tests',
    },
  },
};

export const LowPriority: Story = {
  args: {
    todo: {
      ...mockTodo,
      priority: 'LOW',
      title: 'Update Documentation',
    },
  },
};

export const NoDescription: Story = {
  args: {
    todo: {
      ...mockTodo,
      description: undefined,
    },
  },
};

export const NoEstimate: Story = {
  args: {
    todo: {
      ...mockTodo,
      estimatedTime: undefined,
    },
  },
};

export const HideSteps: Story = {
  args: {
    todo: mockTodo,
    showSteps: false,
  },
};

export const LongTitle: Story = {
  args: {
    todo: {
      ...mockTodo,
      title:
        'This is a very long todo title that should be truncated after two lines to prevent layout issues',
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <TodoCard
        todo={{
          ...mockTodo,
          id: '1',
          status: 'PENDING',
          steps: createSteps(0),
        }}
      />
      <TodoCard
        todo={{
          ...mockTodo,
          id: '2',
          status: 'THREADING',
          steps: createSteps(2, 2),
        }}
      />
      <TodoCard
        todo={{
          ...mockTodo,
          id: '3',
          status: 'WOVEN',
          steps: createSteps(6),
        }}
      />
    </div>
  ),
};

export const Skeleton: Story = {
  render: () => <TodoCardSkeleton />,
};

export const LoadingList: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72">
      <TodoCardSkeleton />
      <TodoCardSkeleton />
      <TodoCardSkeleton />
    </div>
  ),
};
