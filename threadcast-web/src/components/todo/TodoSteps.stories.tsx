import type { Meta, StoryObj } from '@storybook/react';
import { TodoSteps } from './TodoSteps';
import type { TodoStep, StepType, StepStatus } from '../../types';

const stepTypes: StepType[] = ['ANALYSIS', 'DESIGN', 'IMPLEMENTATION', 'VERIFICATION', 'REVIEW', 'INTEGRATION'];

const createSteps = (completedCount: number, currentIndex?: number): TodoStep[] => {
  return stepTypes.map((stepType, index) => ({
    id: `step-${index + 1}`,
    todoId: 'todo-1',
    stepType,
    notes: undefined,
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

const meta: Meta<typeof TodoSteps> = {
  title: 'Todo/TodoSteps',
  component: TodoSteps,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Todo의 6단계 진행 상태를 표시하는 컴포넌트입니다.

## ThreadCast 6-Step 시스템

ThreadCast의 모든 Todo는 6단계로 진행됩니다:

| Step | 이름 | 설명 |
|------|------|------|
| 1 | **ANALYSIS** | 요구사항 분석 및 이해 |
| 2 | **DESIGN** | 설계 및 구조 결정 |
| 3 | **IMPLEMENTATION** | 실제 코드 작성 |
| 4 | **VERIFICATION** | 테스트 및 검증 |
| 5 | **REVIEW** | 코드 리뷰 |
| 6 | **INTEGRATION** | 통합 및 배포 |

## Step 상태 (StepStatus)
- **PENDING**: 대기 중 (회색)
- **IN_PROGRESS**: 진행 중 (노란색, 애니메이션)
- **COMPLETED**: 완료 (초록색 체크)

## 뷰 모드
- **Full View**: 전체 단계를 세로로 표시
- **Compact View**: 가로 진행바 형태로 표시

## 사용 예시
\`\`\`tsx
// Full view (상세 패널용)
<TodoSteps steps={todo.steps} onStepClick={handleStepClick} />

// Compact view (카드 내부용)
<TodoSteps steps={todo.steps} compact />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onStepClick: { action: 'step clicked' },
    compact: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TodoSteps>;

export const Default: Story = {
  args: {
    steps: createSteps(2, 2),
  },
};

export const AllPending: Story = {
  args: {
    steps: createSteps(0),
  },
};

export const FirstStepInProgress: Story = {
  args: {
    steps: createSteps(0, 0),
  },
};

export const HalfComplete: Story = {
  args: {
    steps: createSteps(3, 3),
  },
};

export const AllComplete: Story = {
  args: {
    steps: createSteps(6),
  },
};

export const Compact: Story = {
  args: {
    steps: createSteps(2, 2),
    compact: true,
  },
};

export const CompactAllPending: Story = {
  args: {
    steps: createSteps(0),
    compact: true,
  },
};

export const CompactAllComplete: Story = {
  args: {
    steps: createSteps(6),
    compact: true,
  },
};

export const WithClickHandler: Story = {
  args: {
    steps: createSteps(2, 2),
    onStepClick: (step) => alert(`Clicked step ${step.stepType}`),
  },
};

export const CompactWithClickHandler: Story = {
  args: {
    steps: createSteps(2, 2),
    compact: true,
    onStepClick: (step) => alert(`Clicked step ${step.stepType}`),
  },
};

export const ProgressComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-slate-600 mb-2">Full View</h3>
        <TodoSteps steps={createSteps(3, 3)} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-600 mb-2">Compact View</h3>
        <TodoSteps steps={createSteps(3, 3)} compact />
      </div>
    </div>
  ),
};

export const StagesOfProgress: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-500 mb-2">Not Started</p>
        <TodoSteps steps={createSteps(0)} compact />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Step 1: Analysis</p>
        <TodoSteps steps={createSteps(0, 0)} compact />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Step 2: Design</p>
        <TodoSteps steps={createSteps(1, 1)} compact />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Step 3: Implementation</p>
        <TodoSteps steps={createSteps(2, 2)} compact />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Step 4: Verification</p>
        <TodoSteps steps={createSteps(3, 3)} compact />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Step 5: Review</p>
        <TodoSteps steps={createSteps(4, 4)} compact />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">Step 6: Integration</p>
        <TodoSteps steps={createSteps(5, 5)} compact />
      </div>
      <div>
        <p className="text-xs text-slate-500 mb-2">All Done</p>
        <TodoSteps steps={createSteps(6)} compact />
      </div>
    </div>
  ),
};
