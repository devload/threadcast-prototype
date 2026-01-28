import type { Meta, StoryObj } from '@storybook/react';
import { AIQuestionBanner, AIQuestionInline, AIQuestionDot } from './AIQuestionBanner';

const meta: Meta<typeof AIQuestionBanner> = {
  title: 'AI/AIQuestionBanner',
  component: AIQuestionBanner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
AI 질문이 대기 중임을 알리는 배너 컴포넌트입니다.

## ThreadCast AI 질문 알림 시스템

AI가 작업 중 사용자의 결정이 필요할 때 표시됩니다.
배너를 클릭하면 질문 목록 패널이 열립니다.

## 배너 종류
| 컴포넌트 | 용도 | 크기 |
|----------|------|------|
| AIQuestionBanner | 메인 알림 배너 | 전체 너비 |
| AIQuestionInline | 인라인 알림 | 컴팩트 |
| AIQuestionDot | 뱃지 표시 | 아주 작음 |

## 긴급 질문 표시
urgentCount가 0보다 크면 배너 색상이 핑크 계열로 변경되어
긴급한 질문이 있음을 시각적으로 강조합니다.

## 사용 예시
\`\`\`tsx
// 상단 배너
<AIQuestionBanner
  count={3}
  urgentCount={1}
  onClick={() => openQuestionsPanel()}
  onDismiss={() => dismissBanner()}
/>

// 인라인 (카드 내부 등)
<AIQuestionInline
  count={2}
  onClick={() => openQuestions()}
/>

// 뱃지 (아이콘 옆 등)
<AIQuestionDot count={5} size="md" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AIQuestionBanner>;

/**
 * 기본 AI 질문 배너입니다.
 */
export const Default: Story = {
  args: {
    count: 3,
    onClick: () => alert('Open questions panel'),
  },
};

/**
 * 긴급 질문이 포함된 배너입니다.
 * 핑크-보라 그라데이션으로 표시됩니다.
 */
export const WithUrgent: Story = {
  args: {
    count: 5,
    urgentCount: 2,
    onClick: () => alert('Open questions panel'),
  },
};

/**
 * 닫기 버튼이 있는 배너입니다.
 */
export const Dismissable: Story = {
  args: {
    count: 3,
    urgentCount: 1,
    onClick: () => alert('Open questions panel'),
    onDismiss: () => alert('Dismissed'),
  },
};

/**
 * 질문이 1개일 때의 배너입니다.
 */
export const SingleQuestion: Story = {
  args: {
    count: 1,
    onClick: () => alert('Open question'),
  },
};

/**
 * 질문이 없으면 배너가 표시되지 않습니다.
 */
export const NoQuestions: Story = {
  args: {
    count: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'count가 0이면 null을 반환하여 아무것도 렌더링하지 않습니다.',
      },
    },
  },
};

// AIQuestionInline Stories
export const InlineDefault: StoryObj<typeof AIQuestionInline> = {
  render: () => (
    <AIQuestionInline count={2} onClick={() => alert('Open questions')} />
  ),
  parameters: {
    docs: {
      description: {
        story: '컴팩트한 인라인 형태의 질문 알림입니다. 카드 내부나 제목 옆에 사용합니다.',
      },
    },
  },
};

export const InlineSingle: StoryObj<typeof AIQuestionInline> = {
  render: () => (
    <AIQuestionInline count={1} onClick={() => alert('Open question')} />
  ),
  parameters: {
    docs: {
      description: {
        story: '질문이 1개일 때의 인라인 표시입니다.',
      },
    },
  },
};

// AIQuestionDot Stories
export const DotSmall: StoryObj<typeof AIQuestionDot> = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-600">Todo</span>
        <AIQuestionDot count={3} size="sm" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-600">Mission</span>
        <AIQuestionDot count={9} size="sm" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '작은 크기의 뱃지입니다. 탭이나 메뉴 아이템 옆에 사용합니다.',
      },
    },
  },
};

export const DotMedium: StoryObj<typeof AIQuestionDot> = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        <span className="text-base text-slate-600">Questions</span>
        <AIQuestionDot count={5} size="md" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-base text-slate-600">Pending</span>
        <AIQuestionDot count={12} size="md" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '중간 크기의 뱃지입니다. 9를 초과하면 "9+"로 표시됩니다.',
      },
    },
  },
};

export const DotZero: StoryObj<typeof AIQuestionDot> = {
  render: () => (
    <div className="flex items-center gap-1">
      <span className="text-sm text-slate-600">No questions:</span>
      <AIQuestionDot count={0} />
      <span className="text-xs text-slate-400">(not rendered)</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'count가 0이면 뱃지가 표시되지 않습니다.',
      },
    },
  },
};

/**
 * 모든 AI 질문 알림 컴포넌트를 한눈에 볼 수 있습니다.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">BANNER (일반)</p>
        <AIQuestionBanner count={3} onClick={() => {}} />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">BANNER (긴급)</p>
        <AIQuestionBanner count={5} urgentCount={2} onClick={() => {}} onDismiss={() => {}} />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">INLINE</p>
        <AIQuestionInline count={2} onClick={() => {}} />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 mb-2">DOTS</p>
        <div className="flex items-center gap-4">
          <AIQuestionDot count={1} size="sm" />
          <AIQuestionDot count={5} size="sm" />
          <AIQuestionDot count={9} size="md" />
          <AIQuestionDot count={15} size="md" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '모든 AI 질문 알림 컴포넌트 변형을 한눈에 비교할 수 있습니다.',
      },
    },
  },
};
