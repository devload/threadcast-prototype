import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge, PriorityBadge } from './Badge';

/**
 * StatusBadge는 Mission과 Todo의 현재 상태를 시각적으로 표시합니다.
 *
 * ## ThreadCast 상태 시스템
 * - **BACKLOG**: 아직 시작하지 않은 항목
 * - **PENDING**: 대기 중인 항목
 * - **THREADING**: AI가 작업 중인 항목 (🧵)
 * - **WOVEN**: 완료된 항목 (✅)
 * - **TANGLED**: 오류/문제가 발생한 항목 (❌)
 * - **ARCHIVED**: 보관된 항목
 */
const meta: Meta<typeof StatusBadge> = {
  title: 'Common/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
ThreadCast의 상태 배지 컴포넌트입니다. Mission과 Todo의 현재 진행 상태를 직관적으로 표시합니다.

### Import
\`\`\`tsx
import { StatusBadge, PriorityBadge } from '@/components/common/Badge';
\`\`\`

### 상태 설명
| 상태 | 설명 | 색상 |
|------|------|------|
| BACKLOG | 백로그에 있는 항목 | 회색 |
| PENDING | 작업 대기 중 | 회색 |
| THREADING | AI가 작업 중 | 노란색/주황색 |
| WOVEN | 완료됨 | 초록색 |
| TANGLED | 오류 발생 | 빨간색 |
| ARCHIVED | 보관됨 | 보라색 |
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['BACKLOG', 'PENDING', 'THREADING', 'IN_PROGRESS', 'WOVEN', 'COMPLETED', 'TANGLED', 'ARCHIVED', 'SKIPPED'],
      description: '표시할 상태값입니다.',
      table: {
        type: { summary: 'MissionStatus | TodoStatus' },
      },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md'],
      description: '배지의 크기입니다.',
      table: {
        type: { summary: 'sm | md' },
        defaultValue: { summary: 'md' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

/**
 * Backlog 상태 - 아직 시작하지 않은 항목
 */
export const Backlog: Story = {
  args: { status: 'BACKLOG' },
  parameters: {
    docs: {
      description: {
        story: 'BACKLOG 상태는 아직 작업이 시작되지 않은 항목을 나타냅니다.',
      },
    },
  },
};

/**
 * Pending 상태 - 작업 대기 중
 */
export const Pending: Story = {
  args: { status: 'PENDING' },
  parameters: {
    docs: {
      description: {
        story: 'PENDING 상태는 곧 작업이 시작될 예정인 항목을 나타냅니다.',
      },
    },
  },
};

/**
 * Threading 상태 - AI가 작업 중
 */
export const Threading: Story = {
  args: { status: 'THREADING' },
  parameters: {
    docs: {
      description: {
        story: 'THREADING(🧵)은 ThreadCast의 핵심 상태로, AI가 현재 작업 중임을 나타냅니다. 노란색/주황색으로 표시됩니다.',
      },
    },
  },
};

/**
 * Woven 상태 - 완료됨
 */
export const Woven: Story = {
  args: { status: 'WOVEN' },
  parameters: {
    docs: {
      description: {
        story: 'WOVEN(✅)은 ThreadCast의 완료 상태로, 작업이 성공적으로 완료되었음을 나타냅니다. 초록색으로 표시됩니다.',
      },
    },
  },
};

/**
 * Tangled 상태 - 오류/문제 발생
 */
export const Tangled: Story = {
  args: { status: 'TANGLED' },
  parameters: {
    docs: {
      description: {
        story: 'TANGLED(❌)는 작업 중 오류가 발생하거나 사용자 개입이 필요한 상태입니다. 빨간색으로 표시됩니다.',
      },
    },
  },
};

/**
 * Archived 상태 - 보관됨
 */
export const Archived: Story = {
  args: { status: 'ARCHIVED' },
  parameters: {
    docs: {
      description: {
        story: 'ARCHIVED는 완료 후 보관된 항목을 나타냅니다. 보라색으로 표시됩니다.',
      },
    },
  },
};

/**
 * 작은 크기의 배지
 */
export const SmallSize: Story = {
  args: { status: 'THREADING', size: 'sm' },
  parameters: {
    docs: {
      description: {
        story: '카드 헤더 등 좁은 공간에서는 작은 크기의 배지를 사용합니다.',
      },
    },
  },
};

/**
 * 모든 상태 비교
 */
export const AllStatuses: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">Mission/Todo 상태</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="BACKLOG" />
          <StatusBadge status="PENDING" />
          <StatusBadge status="THREADING" />
          <StatusBadge status="WOVEN" />
          <StatusBadge status="TANGLED" />
          <StatusBadge status="ARCHIVED" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">작은 크기</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="BACKLOG" size="sm" />
          <StatusBadge status="THREADING" size="sm" />
          <StatusBadge status="WOVEN" size="sm" />
          <StatusBadge status="TANGLED" size="sm" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '모든 상태 배지를 한 눈에 비교할 수 있습니다.',
      },
    },
  },
};

// Priority Badge Stories

/**
 * PriorityBadge는 Mission과 Todo의 우선순위를 표시합니다.
 */
export const PriorityCritical: StoryObj<typeof PriorityBadge> = {
  render: () => <PriorityBadge priority="CRITICAL" />,
  parameters: {
    docs: {
      description: {
        story: 'CRITICAL(🔴)은 가장 높은 우선순위로, 즉시 처리가 필요한 항목에 사용합니다.',
      },
    },
  },
};

export const PriorityHigh: StoryObj<typeof PriorityBadge> = {
  render: () => <PriorityBadge priority="HIGH" />,
  parameters: {
    docs: {
      description: {
        story: 'HIGH(🟠)는 높은 우선순위로, 중요한 항목에 사용합니다.',
      },
    },
  },
};

export const PriorityMedium: StoryObj<typeof PriorityBadge> = {
  render: () => <PriorityBadge priority="MEDIUM" />,
  parameters: {
    docs: {
      description: {
        story: 'MEDIUM(🟡)은 보통 우선순위입니다.',
      },
    },
  },
};

export const PriorityLow: StoryObj<typeof PriorityBadge> = {
  render: () => <PriorityBadge priority="LOW" />,
  parameters: {
    docs: {
      description: {
        story: 'LOW(🔵)는 낮은 우선순위로, 여유있게 처리해도 되는 항목에 사용합니다.',
      },
    },
  },
};

export const WithLabel: StoryObj<typeof PriorityBadge> = {
  render: () => <PriorityBadge priority="HIGH" showLabel />,
  parameters: {
    docs: {
      description: {
        story: 'showLabel prop을 true로 설정하면 아이콘과 함께 텍스트 레이블이 표시됩니다.',
      },
    },
  },
};

export const AllPriorities: StoryObj<typeof PriorityBadge> = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">아이콘만</h3>
        <div className="flex gap-4">
          <PriorityBadge priority="CRITICAL" />
          <PriorityBadge priority="HIGH" />
          <PriorityBadge priority="MEDIUM" />
          <PriorityBadge priority="LOW" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">레이블 포함</h3>
        <div className="flex flex-col gap-2">
          <PriorityBadge priority="CRITICAL" showLabel />
          <PriorityBadge priority="HIGH" showLabel />
          <PriorityBadge priority="MEDIUM" showLabel />
          <PriorityBadge priority="LOW" showLabel />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '모든 우선순위 배지를 한 눈에 비교할 수 있습니다.',
      },
    },
  },
};
