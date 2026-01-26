import type { Meta, StoryObj } from '@storybook/react';
import { MissionCard, MissionCardSkeleton } from './MissionCard';
import type { Mission } from '../../types';

const mockMission: Mission = {
  id: '1',
  workspaceId: 'ws-1',
  title: 'User Authentication Module',
  description: 'Implement JWT-based authentication with login, logout, and session management',
  status: 'THREADING',
  priority: 'HIGH',
  progress: 65,
  todoStats: {
    total: 6,
    pending: 1,
    threading: 2,
    woven: 3,
    tangled: 0,
  },
  createdAt: '2026-01-20T10:00:00Z',
};

const meta: Meta<typeof MissionCard> = {
  title: 'Mission/MissionCard',
  component: MissionCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Mission(미션)을 표시하는 카드 컴포넌트입니다.

## ThreadCast Mission 개념
Mission은 하나의 큰 목표를 나타냅니다. 여러 개의 Todo로 구성되며,
각 Todo가 완료되면 Mission의 진행률이 증가합니다.

## 상태 (Status)
- **BACKLOG**: 백로그에 있는 미션
- **THREADING**: AI가 작업 중인 미션 (🧵 실 엮는 중)
- **WOVEN**: 완료된 미션 (✅ 직물 완성)
- **TANGLED**: 문제가 발생한 미션 (❌ 실이 엉킴)

## 우선순위 (Priority)
- **HIGH**: 🟠 높음 (오렌지)
- **MEDIUM**: 🟡 보통 (노란색)
- **LOW**: 🟢 낮음 (초록색)

## 표시 정보
- 미션 ID (MISSION-XXX)
- 제목 및 설명
- 진행률 바
- Todo 통계 (총/진행중/완료/실패)
- 우선순위 및 상태 표시
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onClick: { action: 'clicked' },
    onMenuClick: { action: 'menu clicked' },
    selected: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof MissionCard>;

export const Default: Story = {
  args: {
    mission: mockMission,
  },
};

export const Selected: Story = {
  args: {
    mission: mockMission,
    selected: true,
  },
};

export const HighPriority: Story = {
  args: {
    mission: {
      ...mockMission,
      priority: 'HIGH',
      title: 'Critical Bug Fix',
      description: 'Fix production crash affecting all users',
    },
  },
};

export const MediumPriority: Story = {
  args: {
    mission: {
      ...mockMission,
      priority: 'MEDIUM',
      title: 'Feature Enhancement',
      description: 'Add dark mode support to the application',
    },
  },
};

export const LowPriority: Story = {
  args: {
    mission: {
      ...mockMission,
      priority: 'LOW',
      title: 'Documentation Update',
      description: 'Update API documentation with new endpoints',
    },
  },
};

export const StatusBacklog: Story = {
  args: {
    mission: {
      ...mockMission,
      status: 'BACKLOG',
      progress: 0,
      todoStats: { total: 5, pending: 5, threading: 0, woven: 0, tangled: 0 },
    },
  },
};

export const StatusThreading: Story = {
  args: {
    mission: {
      ...mockMission,
      status: 'THREADING',
      progress: 50,
      todoStats: { total: 6, pending: 1, threading: 3, woven: 2, tangled: 0 },
    },
  },
};

export const StatusWoven: Story = {
  args: {
    mission: {
      ...mockMission,
      status: 'WOVEN',
      progress: 100,
      todoStats: { total: 6, pending: 0, threading: 0, woven: 6, tangled: 0 },
    },
  },
};

export const LongTitle: Story = {
  args: {
    mission: {
      ...mockMission,
      title: 'This is a very long mission title that should be truncated to prevent layout issues in the card component',
    },
  },
};

export const NoDescription: Story = {
  args: {
    mission: {
      ...mockMission,
      description: undefined,
    },
  },
};

export const WithMenuAction: Story = {
  args: {
    mission: mockMission,
    onMenuClick: () => alert('Menu clicked!'),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <MissionCard
        mission={{
          ...mockMission,
          status: 'BACKLOG',
          priority: 'HIGH',
          progress: 0,
          todoStats: { total: 4, pending: 4, threading: 0, woven: 0, tangled: 0 },
        }}
      />
      <MissionCard
        mission={{
          ...mockMission,
          status: 'THREADING',
          priority: 'MEDIUM',
          progress: 45,
          todoStats: { total: 6, pending: 1, threading: 3, woven: 2, tangled: 0 },
        }}
      />
      <MissionCard
        mission={{
          ...mockMission,
          status: 'WOVEN',
          priority: 'LOW',
          progress: 100,
          todoStats: { total: 5, pending: 0, threading: 0, woven: 5, tangled: 0 },
        }}
      />
    </div>
  ),
};

export const Skeleton: Story = {
  render: () => <MissionCardSkeleton />,
};

export const LoadingGrid: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <MissionCardSkeleton />
      <MissionCardSkeleton />
      <MissionCardSkeleton />
    </div>
  ),
};

export const WithAIQuestion: Story = {
  args: {
    mission: {
      ...mockMission,
      status: 'THREADING',
    },
    aiQuestionCount: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'AI가 질문을 기다리고 있는 상태의 미션 카드. 분홍색 테두리와 AI 질문 배지가 표시됩니다.',
      },
    },
  },
};

export const WithSingleAIQuestion: Story = {
  args: {
    mission: {
      ...mockMission,
      status: 'THREADING',
      title: 'API 인증 구현',
    },
    aiQuestionCount: 1,
  },
};

export const AIQuestionComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div className="text-xs text-slate-500 mb-2">AI 질문 없음</div>
      <MissionCard
        mission={{
          ...mockMission,
          status: 'THREADING',
        }}
      />
      <div className="text-xs text-slate-500 mt-4 mb-2">AI 질문 2개 대기 중</div>
      <MissionCard
        mission={{
          ...mockMission,
          status: 'THREADING',
        }}
        aiQuestionCount={2}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'AI 질문이 있는 카드와 없는 카드의 비교. AI 질문이 있으면 분홍색 강조 표시가 됩니다.',
      },
    },
  },
};
