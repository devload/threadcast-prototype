import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

const meta: Meta<typeof HomePage> = {
  title: 'Pages/HomePage',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
앱의 메인 홈 페이지입니다. 사용자의 모든 Workspace를 표시합니다.

## 주요 기능
- **Global Stats**: 전체 Workspace, Mission, Todo 통계
- **AI Alert Banner**: 답변 대기 중인 질문 알림
- **Workspace Grid**: Workspace 카드 목록
- **Recent Activity**: 최근 활동 타임라인

## 페이지 구조
\`\`\`
┌─────────────────────────────────────┐
│ Header (Logo, Actions, Avatar)      │
├─────────────────────────────────────┤
│ Welcome Section                     │
├─────────────────────────────────────┤
│ Global Stats (5 cards)              │
├─────────────────────────────────────┤
│ AI Alert Banner (if pending)        │
├─────────────────────────────────────┤
│ Workspace Grid                      │
│ ┌─────┬─────┬─────┐                │
│ │ WS1 │ WS2 │ WS3 │                │
│ └─────┴─────┴─────┘                │
├─────────────────────────────────────┤
│ Recent Activity                     │
└─────────────────────────────────────┘
\`\`\`

## 네비게이션
- Workspace 카드 클릭 → Workspace Dashboard (/dashboard)
- Add Workspace 버튼 → Workspace 생성 모달
- AI Alert 클릭 → 질문 답변 패널
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HomePage>;

export const Default: Story = {
  args: {},
};

export const WithAIAlerts: Story = {
  parameters: {
    docs: {
      description: {
        story: 'AI 질문이 대기 중일 때 알림 배너가 표시됩니다.',
      },
    },
  },
};

export const EmptyState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Workspace가 없을 때의 빈 상태입니다.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: '모바일 뷰포트에서의 레이아웃입니다.',
      },
    },
  },
};
