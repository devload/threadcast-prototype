import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { Home, Target, Clock, Archive } from 'lucide-react';

const meta: Meta<typeof Sidebar> = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
워크스페이스 기반의 미션 관리 사이드바입니다.

## 구성 요소
Sidebar는 다음 하위 컴포넌트들로 구성됩니다:
- **WorkspaceSelector**: 워크스페이스 선택 드롭다운
- **AutonomySlider**: AI 자율성 레벨 조절
- **SidebarNav**: 네비게이션 메뉴
- **WorkspaceStats**: Overview 통계

## 프로토타입 기반
\`00-missions-board.html\` 프로토타입의 구조를 정확히 반영합니다.

각 하위 컴포넌트는 독립적으로 사용할 수 있습니다:
- \`Layout/Sidebar/WorkspaceSelector\`
- \`Layout/Sidebar/AutonomySlider\`
- \`Layout/Sidebar/SidebarNav\`
- \`Layout/Sidebar/StatsGrid\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    activeNav: {
      control: 'select',
      options: ['all', 'active', 'completed', 'archived'],
      description: '현재 활성화된 네비게이션 항목',
    },
    autonomyLevel: {
      control: { type: 'range', min: 1, max: 5, step: 1 },
      description: 'AI 자율성 레벨 (1: Minimal ~ 5: Maximum)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

/**
 * 기본 상태의 사이드바입니다.
 */
export const Default: Story = {
  args: {
    activeNav: 'all',
    stats: {
      total: 12,
      active: 5,
      successRate: 65,
      remainingTime: '~24h',
    },
  },
};

/**
 * 여러 워크스페이스가 있는 경우입니다.
 */
export const WithMultipleWorkspaces: Story = {
  args: {
    activeNav: 'all',
    workspace: { id: '1', name: 'Product Development' },
    workspaces: [
      { id: '1', name: 'Product Development' },
      { id: '2', name: 'Marketing Campaign' },
      { id: '3', name: 'Infrastructure' },
    ],
    stats: {
      total: 15,
      active: 7,
      successRate: 70,
      remainingTime: '~36h',
    },
  },
};

/**
 * Lucide 아이콘을 사용한 커스텀 네비게이션입니다.
 */
export const WithCustomNavItems: Story = {
  args: {
    activeNav: 'missions',
    navItems: [
      { id: 'home', label: 'Dashboard', icon: <Home size={18} /> },
      { id: 'missions', label: 'Missions', icon: <Target size={18} /> },
      { id: 'timeline', label: 'Timeline', icon: <Clock size={18} /> },
      { id: 'archived', label: 'Archived', icon: <Archive size={18} /> },
    ],
    stats: {
      total: 20,
      active: 8,
      successRate: 80,
      remainingTime: '~12h',
    },
  },
};

/**
 * AI 자율성이 최소인 상태입니다.
 */
export const MinimalAutonomy: Story = {
  args: {
    activeNav: 'all',
    autonomyLevel: 1,
    stats: {
      total: 8,
      active: 3,
      successRate: 75,
      remainingTime: '~12h',
    },
  },
};

/**
 * AI 자율성이 최대인 상태입니다.
 */
export const MaximumAutonomy: Story = {
  args: {
    activeNav: 'all',
    autonomyLevel: 5,
    stats: {
      total: 20,
      active: 8,
      successRate: 88,
      remainingTime: '~48h',
    },
  },
};

/**
 * 빈 워크스페이스입니다.
 */
export const EmptyWorkspace: Story = {
  args: {
    activeNav: 'all',
    stats: {
      total: 0,
      active: 0,
      successRate: 0,
      remainingTime: '~0h',
    },
  },
};

/**
 * 커스텀 생성 버튼 라벨입니다.
 */
export const CustomCreateButton: Story = {
  args: {
    activeNav: 'all',
    createButtonLabel: 'New Project',
    stats: {
      total: 5,
      active: 2,
      successRate: 60,
      remainingTime: '~8h',
    },
  },
};

/**
 * 인터랙티브 데모입니다.
 */
export const Interactive: Story = {
  render: () => {
    const [activeNav, setActiveNav] = useState('all');
    const [autonomyLevel, setAutonomyLevel] = useState(3);
    const [currentWorkspace, setCurrentWorkspace] = useState({ id: '1', name: 'My Workspace' });

    const workspaces = [
      { id: '1', name: 'My Workspace' },
      { id: '2', name: 'Team Project' },
      { id: '3', name: 'Personal Tasks' },
    ];

    return (
      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        autonomyLevel={autonomyLevel}
        onAutonomyChange={setAutonomyLevel}
        workspace={currentWorkspace}
        workspaces={workspaces}
        onWorkspaceChange={(id) => {
          const ws = workspaces.find((w) => w.id === id);
          if (ws) setCurrentWorkspace(ws);
        }}
        stats={{
          total: 12,
          active: 5,
          successRate: 65,
          remainingTime: '~24h',
        }}
        onCreateMission={() => alert('Creating new mission!')}
      />
    );
  },
};

/**
 * 앱 컨텍스트에서의 사이드바입니다.
 */
export const InAppContext: Story = {
  render: () => {
    const [activeNav, setActiveNav] = useState('all');

    const navLabels: Record<string, string> = {
      all: 'All Missions',
      active: 'Active Missions',
      completed: 'Completed Missions',
      archived: 'Archived Missions',
    };

    return (
      <div className="flex h-screen">
        <Sidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          stats={{
            total: 12,
            active: 5,
            successRate: 65,
            remainingTime: '~24h',
          }}
          onCreateMission={() => alert('Creating new mission!')}
        />
        <main className="flex-1 bg-slate-50 p-6">
          <h1 className="text-2xl font-bold text-slate-900">{navLabels[activeNav]}</h1>
          <p className="text-slate-500 mt-2">
            현재 {navLabels[activeNav]} 페이지를 보고 있습니다.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-sm text-slate-400 mb-2">MISSION-{i}</div>
                <div className="font-medium text-slate-900">Sample Mission {i}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  },
};
