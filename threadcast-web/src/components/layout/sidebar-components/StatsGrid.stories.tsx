import type { Meta, StoryObj } from '@storybook/react';
import { StatsGrid, WorkspaceStats } from './StatsGrid';

const meta: Meta<typeof StatsGrid> = {
  title: 'Layout/Sidebar/StatsGrid',
  component: StatsGrid,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
통계를 그리드 형태로 표시하는 컴포넌트입니다.

## 기능
- 2, 3, 4 컬럼 레이아웃 지원
- 색상 테마 지원 (primary, success, warning, danger)
- \`WorkspaceStats\` 프리셋 제공

## 사용 예시
\`\`\`tsx
// 기본 StatsGrid
<StatsGrid
  stats={[
    { label: 'Total', value: 12 },
    { label: 'Active', value: 5, color: 'warning' },
  ]}
  columns={2}
/>

// WorkspaceStats 프리셋
<WorkspaceStats
  total={12}
  active={5}
  successRate={65}
  remainingTime="~24h"
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[260px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StatsGrid>;

/**
 * 기본 2컬럼 통계 그리드입니다.
 */
export const TwoColumns: Story = {
  args: {
    stats: [
      { label: 'Total', value: 12 },
      { label: 'Active', value: 5 },
      { label: 'Success', value: '65%' },
      { label: 'Remaining', value: '~24h' },
    ],
    columns: 2,
  },
};

/**
 * 3컬럼 레이아웃입니다.
 */
export const ThreeColumns: Story = {
  args: {
    stats: [
      { label: 'Threading', value: 3 },
      { label: 'Woven', value: 8 },
      { label: 'Tangled', value: 1 },
    ],
    columns: 3,
  },
};

/**
 * 4컬럼 레이아웃입니다.
 */
export const FourColumns: Story = {
  args: {
    stats: [
      { label: 'Total', value: 50 },
      { label: 'Done', value: 42 },
      { label: 'Active', value: 6 },
      { label: 'Failed', value: 2 },
    ],
    columns: 4,
  },
};

/**
 * 색상이 적용된 통계입니다.
 */
export const WithColors: Story = {
  args: {
    stats: [
      { label: 'Total', value: 12, color: 'primary' },
      { label: 'Active', value: 5, color: 'warning' },
      { label: 'Success', value: 8, color: 'success' },
      { label: 'Failed', value: 1, color: 'danger' },
    ],
    columns: 2,
  },
};

/**
 * 빈 상태 (값이 0)입니다.
 */
export const EmptyState: Story = {
  args: {
    stats: [
      { label: 'Total', value: 0 },
      { label: 'Active', value: 0 },
      { label: 'Success', value: '0%' },
      { label: 'Remaining', value: '~0h' },
    ],
    columns: 2,
  },
};

// WorkspaceStats 스토리
export const WorkspaceStatsDefault: StoryObj<typeof WorkspaceStats> = {
  render: () => (
    <WorkspaceStats
      total={12}
      active={5}
      successRate={65}
      remainingTime="~24h"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: '워크스페이스 Overview에 사용되는 프리셋 컴포넌트입니다.',
      },
    },
  },
};

export const WorkspaceStatsHighActivity: StoryObj<typeof WorkspaceStats> = {
  render: () => (
    <WorkspaceStats
      total={50}
      active={20}
      successRate={88}
      remainingTime="~48h"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: '활발한 워크스페이스의 통계입니다.',
      },
    },
  },
};

export const WorkspaceStatsEmpty: StoryObj<typeof WorkspaceStats> = {
  render: () => (
    <WorkspaceStats
      total={0}
      active={0}
      successRate={0}
      remainingTime="~0h"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: '빈 워크스페이스의 통계입니다.',
      },
    },
  },
};
