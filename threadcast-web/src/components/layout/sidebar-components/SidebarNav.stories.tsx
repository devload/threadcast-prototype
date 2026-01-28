import type { Meta, StoryObj } from '@storybook/react';
import { SidebarNav, type NavItem } from './SidebarNav';
import { useState } from 'react';
import { Home, Target, Clock, Archive, Bell, Settings } from 'lucide-react';

const meta: Meta<typeof SidebarNav> = {
  title: 'Layout/Sidebar/SidebarNav',
  component: SidebarNav,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
사이드바 네비게이션 메뉴 컴포넌트입니다.

## 기능
- 아이콘 + 라벨 형태의 메뉴 항목
- 활성 항목 하이라이트
- 뱃지 카운트 지원
- 접근성 지원 (aria-current)

## 사용 예시
\`\`\`tsx
<SidebarNav
  items={[
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'missions', label: 'Missions', icon: <TargetIcon />, badge: 5 },
  ]}
  activeId="home"
  onSelect={(id) => console.log('Selected:', id)}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[260px] bg-white p-3 rounded-lg border border-slate-200">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SidebarNav>;

const defaultItems: NavItem[] = [
  { id: 'all', label: 'All Missions', icon: <span>📊</span> },
  { id: 'active', label: 'Active', icon: <span>⚡️</span> },
  { id: 'completed', label: 'Completed', icon: <span>✅</span> },
  { id: 'archived', label: 'Archived', icon: <span>📦</span> },
];

/**
 * 기본 네비게이션입니다.
 * 프로토타입의 미션 필터 메뉴를 반영합니다.
 */
export const Default: Story = {
  args: {
    items: defaultItems,
    activeId: 'all',
  },
};

/**
 * Active 항목이 선택된 상태입니다.
 */
export const ActiveSelected: Story = {
  args: {
    items: defaultItems,
    activeId: 'active',
  },
};

/**
 * Lucide 아이콘을 사용한 네비게이션입니다.
 */
export const WithLucideIcons: Story = {
  args: {
    items: [
      { id: 'home', label: 'Dashboard', icon: <Home size={18} /> },
      { id: 'missions', label: 'Missions', icon: <Target size={18} /> },
      { id: 'timeline', label: 'Timeline', icon: <Clock size={18} /> },
      { id: 'archived', label: 'Archived', icon: <Archive size={18} /> },
    ],
    activeId: 'missions',
  },
};

/**
 * 뱃지가 있는 네비게이션입니다.
 * 알림 카운트 등을 표시할 때 사용합니다.
 */
export const WithBadges: Story = {
  args: {
    items: [
      { id: 'all', label: 'All Missions', icon: <Target size={18} /> },
      { id: 'active', label: 'Active', icon: <span>⚡️</span>, badge: 5 },
      { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: 12 },
      { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    ],
    activeId: 'active',
  },
};

/**
 * 뱃지가 있는 활성 항목입니다.
 * 활성 상태에서는 뱃지 스타일이 변경됩니다.
 */
export const ActiveWithBadge: Story = {
  args: {
    items: [
      { id: 'all', label: 'All Missions', icon: <Target size={18} /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: 3 },
    ],
    activeId: 'notifications',
  },
};

/**
 * 인터랙티브 데모입니다.
 * 항목을 클릭하면 활성 상태가 변경됩니다.
 */
export const Interactive: Story = {
  render: () => {
    const [activeId, setActiveId] = useState('all');

    const items: NavItem[] = [
      { id: 'all', label: 'All Missions', icon: <span>📊</span> },
      { id: 'active', label: 'Active', icon: <span>⚡️</span>, badge: 5 },
      { id: 'completed', label: 'Completed', icon: <span>✅</span> },
      { id: 'archived', label: 'Archived', icon: <span>📦</span> },
    ];

    return (
      <SidebarNav
        items={items}
        activeId={activeId}
        onSelect={setActiveId}
      />
    );
  },
};
