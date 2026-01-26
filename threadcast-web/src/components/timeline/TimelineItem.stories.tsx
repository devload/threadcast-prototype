import type { Meta, StoryObj } from '@storybook/react';
import { TimelineItem, TimelineItemSkeleton } from './TimelineItem';
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

const meta: Meta<typeof TimelineItem> = {
  title: 'Timeline/TimelineItem',
  component: TimelineItem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
타임라인의 개별 이벤트 아이템 컴포넌트입니다.

## 이벤트 타입 (EventType)

### Mission 이벤트
| 타입 | 아이콘 | 설명 |
|------|--------|------|
| MISSION_CREATED | 🎯 | 미션 생성됨 |
| MISSION_STARTED | ▶️ | 미션 시작됨 |
| MISSION_COMPLETED | ✅ | 미션 완료됨 |
| MISSION_ARCHIVED | 📦 | 미션 보관됨 |

### Todo 이벤트
| 타입 | 아이콘 | 설명 |
|------|--------|------|
| TODO_CREATED | 📋 | Todo 생성됨 |
| TODO_STARTED | ▶️ | Todo 시작됨 |
| TODO_COMPLETED | ✅ | Todo 완료됨 |
| TODO_FAILED | ❌ | Todo 실패함 |

### Step/AI 이벤트
| 타입 | 아이콘 | 설명 |
|------|--------|------|
| STEP_COMPLETED | 🔧 | Step 완료됨 |
| AI_QUESTION | 🤔 | AI가 질문함 |
| AI_ANSWER | 💬 | 사용자가 답변함 |
| COMMENT_ADDED | 💬 | 스티치 코멘트 |

## 시간 표시
- 방금 전
- N분 전
- N시간 전
- 어제, 이틀 전 등

## 사용 예시
\`\`\`tsx
<TimelineItem
  event={{
    id: '1',
    eventType: 'MISSION_CREATED',
    title: 'User Authentication',
    description: 'JWT 인증 구현',
    createdAt: new Date().toISOString(),
  }}
  isLast={false}
/>
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
    isLast: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TimelineItem>;

export const MissionCreated: Story = {
  args: {
    event: createEvent('MISSION_CREATED', 'User Authentication Module', 5, {
      description: 'New mission created for authentication feature',
    }),
  },
};

export const MissionStarted: Story = {
  args: {
    event: createEvent('MISSION_STARTED', 'User Authentication Module', 4, {
      description: 'Started working on authentication implementation',
    }),
  },
};

export const MissionCompleted: Story = {
  args: {
    event: createEvent('MISSION_COMPLETED', 'CI/CD Pipeline Setup', 2 * 60, {
      description: 'All todos completed successfully',
    }),
  },
};

export const MissionArchived: Story = {
  args: {
    event: createEvent('MISSION_ARCHIVED', 'Legacy API Support', 24 * 60, {
      description: 'Archived after completing migration',
    }),
  },
};

export const TodoCreated: Story = {
  args: {
    event: createEvent('TODO_CREATED', 'Implement JWT Token Validation', 30, {
      description: 'Add token validation to authentication filter',
    }),
  },
};

export const TodoStarted: Story = {
  args: {
    event: createEvent('TODO_STARTED', 'Implement JWT Token Validation', 25, {
      description: 'Beginning implementation phase',
    }),
  },
};

export const TodoCompleted: Story = {
  args: {
    event: createEvent('TODO_COMPLETED', 'JWT Token Validation', 1, {
      description: 'All 6 steps completed successfully',
    }),
  },
};

export const TodoFailed: Story = {
  args: {
    event: createEvent('TODO_FAILED', 'Database Migration', 15, {
      description: 'Migration script failed due to schema conflict',
      metadata: {
        error: 'Duplicate column name',
        file: 'V2__add_users_table.sql',
      },
    }),
  },
};

export const StepCompleted: Story = {
  args: {
    event: createEvent('STEP_COMPLETED', 'Testing - JWT Token Validation', 3, {
      description: 'Completed testing phase with 100% coverage',
      metadata: {
        step: 'VERIFICATION',
        testsPassed: 12,
      },
    }),
  },
};

export const AIQuestion: Story = {
  args: {
    event: createEvent('AI_QUESTION', 'Which database should I use?', 15, {
      description: 'Should I use PostgreSQL or MySQL for this project?',
    }),
  },
};

export const AIAnswer: Story = {
  args: {
    event: createEvent('AI_ANSWER', 'Database Selection Response', 14, {
      description: 'User selected PostgreSQL for better JSON support',
    }),
  },
};

export const CommentAdded: Story = {
  args: {
    event: createEvent('COMMENT_ADDED', 'Stitch Comment', 45, {
      description: 'Good progress on the authentication module. Consider adding rate limiting.',
    }),
  },
};

export const LastItem: Story = {
  args: {
    event: createEvent('MISSION_CREATED', 'Project Initialized', 24 * 60, {
      description: 'Started the ThreadCast project',
    }),
    isLast: true,
  },
};

export const WithMetadata: Story = {
  args: {
    event: createEvent('STEP_COMPLETED', 'Testing Complete', 5, {
      description: 'All unit tests passed',
      metadata: {
        totalTests: 24,
        passed: 24,
        failed: 0,
        coverage: '94%',
      },
    }),
  },
};

export const Skeleton: Story = {
  render: () => <TimelineItemSkeleton />,
};

export const AllEventTypes: Story = {
  render: () => (
    <div className="w-96">
      <TimelineItem event={createEvent('MISSION_CREATED', 'Mission Created', 60)} />
      <TimelineItem event={createEvent('MISSION_STARTED', 'Mission Started', 55)} />
      <TimelineItem event={createEvent('TODO_CREATED', 'Todo Created', 50)} />
      <TimelineItem event={createEvent('TODO_STARTED', 'Todo Started', 45)} />
      <TimelineItem event={createEvent('AI_QUESTION', 'AI Question', 40)} />
      <TimelineItem event={createEvent('AI_ANSWER', 'User Response', 35)} />
      <TimelineItem event={createEvent('STEP_COMPLETED', 'Step Completed', 30)} />
      <TimelineItem event={createEvent('COMMENT_ADDED', 'Comment', 20)} />
      <TimelineItem event={createEvent('TODO_COMPLETED', 'Todo Completed', 10)} />
      <TimelineItem event={createEvent('MISSION_COMPLETED', 'Mission Completed', 5)} isLast />
    </div>
  ),
};
