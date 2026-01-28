import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectDashboardPage } from './ProjectDashboardPage';

const meta: Meta<typeof ProjectDashboardPage> = {
  title: 'Pages/ProjectDashboardPage',
  component: ProjectDashboardPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
개별 프로젝트의 대시보드 페이지입니다.

## 주요 기능
- **Project Info**: 프로젝트 이름, 경로, 언어, 빌드 도구
- **Stats Row**: Todo, Threading, Woven, Missions, Commits, AI Actions 통계
- **Todo List**: 프로젝트 내 Todo 목록 (상태별 필터링)
- **Linked Missions**: 연결된 Mission 목록
- **Recent Changes**: 최근 파일 변경 내역
- **Active Worktrees**: 활성 Git worktree 목록
- **Progress Ring**: 전체 진행률
- **AI Activity**: AI 활동 통계
- **Git Status**: Git 상태 정보
- **Activity Log**: 활동 로그

## 레이아웃 구조
\`\`\`
┌──────────────────────────────────────────────────┐
│ Top Bar (Back, Title, Actions)                   │
├──────────────────────────────────────────────────┤
│ Project Card (Icon, Name, Path, Badges)          │
├──────────────────────────────────────────────────┤
│ Stats Row (6 cards)                              │
├──────────────────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┐                  │
│ │ Todos   │ Missions│ Progress│                  │
│ │         │ Files   │ AI      │                  │
│ │         │ Trees   │ Git     │                  │
│ │         │         │ Activity│                  │
│ │         │         │ Actions │                  │
│ └─────────┴─────────┴─────────┘                  │
└──────────────────────────────────────────────────┘
\`\`\`

## 네비게이션
- Back 버튼 → Workspace Dashboard (/dashboard)
- Todo 클릭 → Todo 상세
- Mission 클릭 → Mission 상세
- Add Todo → Todo 생성 모달
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="bg-gray-50 min-h-screen">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProjectDashboardPage>;

export const Default: Story = {
  args: {},
};

export const WithThreadingTodos: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Threading 상태의 Todo가 있을 때의 표시입니다. 활성 Todo는 amber 배경과 pulse 애니메이션으로 강조됩니다.',
      },
    },
  },
};

export const AllCompleted: Story = {
  parameters: {
    docs: {
      description: {
        story: '모든 Todo가 완료된 상태입니다.',
      },
    },
  },
};

export const JavaProject: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Java/Gradle 프로젝트 예시입니다.',
      },
    },
  },
};

export const TypeScriptProject: Story = {
  parameters: {
    docs: {
      description: {
        story: 'TypeScript/npm 프로젝트 예시입니다.',
      },
    },
  },
};
