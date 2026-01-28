import type { Meta, StoryObj } from '@storybook/react';
import { Timeline, TimelineCompact } from './Timeline';
import type { TimelineEvent, EventType } from '../../types';

const createEvent = (
  eventType: EventType,
  title: string,
  minutesAgo: number,
  overrides: Partial<TimelineEvent> = {}
): TimelineEvent => ({
  id: Math.random().toString(36).substr(2, 9),
  workspaceId: 'ws-1',
  eventType,
  title,
  createdAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
  ...overrides,
});

const sampleEvents: TimelineEvent[] = [
  createEvent('STEP_COMPLETED', 'Testing - JWT Token Validation', 2, {
    description: 'All 12 tests passed',
  }),
  createEvent('AI_ANSWER', 'Database Selection Response', 8, {
    description: 'User selected PostgreSQL',
  }),
  createEvent('AI_QUESTION', 'Which database should I use?', 12, {
    description: 'PostgreSQL or MySQL for this project?',
  }),
  createEvent('TODO_STARTED', 'Testing - JWT Token Validation', 25),
  createEvent('COMMENT_ADDED', 'Good progress!', 35, {
    description: 'Consider adding rate limiting for the auth endpoints',
  }),
  createEvent('STEP_COMPLETED', 'Implementation - JWT Token Validation', 45),
  createEvent('TODO_STARTED', 'Implementation - JWT Token Validation', 60),
  createEvent('TODO_CREATED', 'Implement JWT Token Validation', 90, {
    description: 'Add token validation to the authentication filter',
  }),
  createEvent('MISSION_CREATED', 'User Authentication Module', 120, {
    description: 'Implement complete JWT-based authentication',
  }),
];

const meta: Meta<typeof Timeline> = {
  title: 'Timeline/Timeline',
  component: Timeline,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
워크스페이스의 활동 이력을 타임라인으로 표시하는 컴포넌트입니다.

## 구성 요소
- **Timeline**: 전체 타임라인 뷰 (카드 형태)
- **TimelineCompact**: 압축된 타임라인 (사이드바용)

## 이벤트 타입
| 이벤트 | 아이콘 | 설명 |
|--------|--------|------|
| MISSION_CREATED | 🎯 | 미션 생성됨 |
| MISSION_COMPLETED | ✅ | 미션 완료됨 |
| TODO_CREATED | 📋 | Todo 생성됨 |
| TODO_STARTED | ▶️ | Todo 시작됨 |
| TODO_COMPLETED | ✅ | Todo 완료됨 |
| TODO_FAILED | ❌ | Todo 실패함 |
| STEP_COMPLETED | 🔧 | Step 완료됨 |
| AI_QUESTION | 🤔 | AI가 질문함 |
| AI_ANSWER | 💬 | 사용자가 답변함 |
| COMMENT_ADDED | 💬 | 코멘트 추가됨 |

## 행위자 타입 (Actor)
- **AI**: AI 에이전트 (보라색 그라데이션)
- **USER**: 사용자 (핑크)
- **SYSTEM**: 시스템 (회색)

## 실시간 업데이트
WebSocket을 통해 실시간으로 새 이벤트가 추가됩니다.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[450px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onRefresh: { action: 'refresh clicked' },
    isLoading: { control: 'boolean' },
    maxItems: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof Timeline>;

export const Default: Story = {
  args: {
    events: sampleEvents,
  },
};

export const WithRefresh: Story = {
  args: {
    events: sampleEvents,
    onRefresh: () => console.log('Refreshing...'),
  },
};

export const Loading: Story = {
  args: {
    events: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    events: [],
  },
};

export const LimitedItems: Story = {
  args: {
    events: sampleEvents,
    maxItems: 5,
  },
};

export const SingleEvent: Story = {
  args: {
    events: [sampleEvents[0]],
  },
};

export const ManyEvents: Story = {
  args: {
    events: [
      ...sampleEvents,
      createEvent('TODO_COMPLETED', 'Configure Spring Security', 150),
      createEvent('STEP_COMPLETED', 'Review - Configure Spring Security', 160),
      createEvent('TODO_STARTED', 'Review - Configure Spring Security', 170),
      createEvent('TODO_FAILED', 'Build Failed', 180, {
        description: 'Compilation error in SecurityConfig.java',
      }),
      createEvent('MISSION_COMPLETED', 'Initial Setup', 200),
    ],
    maxItems: 8,
  },
};

// Compact Timeline Stories
export const Compact: StoryObj<typeof TimelineCompact> = {
  render: () => (
    <div className="w-64 p-4 bg-white rounded-lg border border-slate-200">
      <h4 className="text-sm font-medium text-slate-900 mb-3">Recent Activity</h4>
      <TimelineCompact events={sampleEvents} />
    </div>
  ),
};

export const CompactFewItems: StoryObj<typeof TimelineCompact> = {
  render: () => (
    <div className="w-64 p-4 bg-white rounded-lg border border-slate-200">
      <h4 className="text-sm font-medium text-slate-900 mb-3">Recent Activity</h4>
      <TimelineCompact events={sampleEvents.slice(0, 3)} maxItems={5} />
    </div>
  ),
};

export const CompactManyItems: StoryObj<typeof TimelineCompact> = {
  render: () => (
    <div className="w-64 p-4 bg-white rounded-lg border border-slate-200">
      <h4 className="text-sm font-medium text-slate-900 mb-3">Recent Activity</h4>
      <TimelineCompact events={sampleEvents} maxItems={3} />
    </div>
  ),
};

export const SideBySide: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="w-[450px]">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Full Timeline</h3>
        <Timeline events={sampleEvents} maxItems={6} />
      </div>
      <div className="w-64">
        <h3 className="text-sm font-medium text-slate-600 mb-2">Compact View</h3>
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <TimelineCompact events={sampleEvents} maxItems={5} />
        </div>
      </div>
    </div>
  ),
};
