import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabPanel } from './Tabs';
import { Target, CheckSquare, Clock, Settings } from 'lucide-react';

const meta: Meta<typeof Tabs> = {
  title: 'Common/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
탭 네비게이션 컴포넌트입니다.

## 구성 요소
- **Tabs**: 탭 컨테이너
- **TabPanel**: 각 탭의 콘텐츠 영역

## 스타일 (variant)
| variant | 설명 | 용도 |
|---------|------|------|
| default | 버튼 스타일 탭 | 일반적인 탭 |
| pills | 알약 모양 탭 | 필터/뷰 전환 |
| underline | 밑줄 스타일 탭 | 페이지 내 섹션 |

## 크기 (size)
- **sm**: 작은 탭
- **md**: 기본 크기
- **lg**: 큰 탭

## 탭 항목 속성
- **id**: 탭 식별자
- **label**: 탭 레이블
- **icon**: 아이콘 (선택)
- **badge**: 뱃지 숫자 (선택)
- **disabled**: 비활성화 (선택)

## 주요 Props
- **tabs**: 탭 항목 배열
- **defaultTab**: 기본 선택 탭
- **onChange**: 탭 변경 콜백
- **fullWidth**: 전체 너비 사용

## 사용 예시
\`\`\`tsx
<Tabs
  tabs={[
    { id: 'missions', label: 'Missions', icon: <Target /> },
    { id: 'todos', label: 'Todos', badge: 5 },
    { id: 'timeline', label: 'Timeline' },
  ]}
  onChange={(tabId) => setActiveTab(tabId)}
>
  <TabPanel id="missions">미션 목록</TabPanel>
  <TabPanel id="todos">Todo 목록</TabPanel>
  <TabPanel id="timeline">타임라인</TabPanel>
</Tabs>
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
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs
      tabs={[
        { id: 'missions', label: 'Missions' },
        { id: 'todos', label: 'Todos' },
        { id: 'timeline', label: 'Timeline' },
      ]}
    >
      <TabPanel id="missions">
        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-medium">Missions Content</h3>
          <p className="text-sm text-slate-500 mt-1">This is the missions tab content.</p>
        </div>
      </TabPanel>
      <TabPanel id="todos">
        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-medium">Todos Content</h3>
          <p className="text-sm text-slate-500 mt-1">This is the todos tab content.</p>
        </div>
      </TabPanel>
      <TabPanel id="timeline">
        <div className="p-4 bg-slate-50 rounded-lg">
          <h3 className="font-medium">Timeline Content</h3>
          <p className="text-sm text-slate-500 mt-1">This is the timeline tab content.</p>
        </div>
      </TabPanel>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs
      tabs={[
        { id: 'missions', label: 'Missions', icon: <Target size={16} /> },
        { id: 'todos', label: 'Todos', icon: <CheckSquare size={16} /> },
        { id: 'timeline', label: 'Timeline', icon: <Clock size={16} /> },
      ]}
    >
      <TabPanel id="missions">Missions content</TabPanel>
      <TabPanel id="todos">Todos content</TabPanel>
      <TabPanel id="timeline">Timeline content</TabPanel>
    </Tabs>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Tabs
      tabs={[
        { id: 'all', label: 'All', badge: 24 },
        { id: 'pending', label: 'Pending', badge: 8 },
        { id: 'completed', label: 'Completed', badge: 16 },
      ]}
    >
      <TabPanel id="all">All items</TabPanel>
      <TabPanel id="pending">Pending items</TabPanel>
      <TabPanel id="completed">Completed items</TabPanel>
    </Tabs>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <Tabs
      tabs={[
        { id: 'active', label: 'Active' },
        { id: 'archived', label: 'Archived', disabled: true },
        { id: 'settings', label: 'Settings' },
      ]}
    >
      <TabPanel id="active">Active content</TabPanel>
      <TabPanel id="archived">Archived content</TabPanel>
      <TabPanel id="settings">Settings content</TabPanel>
    </Tabs>
  ),
};

export const Pills: Story = {
  render: () => (
    <Tabs
      variant="pills"
      tabs={[
        { id: 'missions', label: 'Missions' },
        { id: 'todos', label: 'Todos' },
        { id: 'timeline', label: 'Timeline' },
      ]}
    >
      <TabPanel id="missions">Missions content</TabPanel>
      <TabPanel id="todos">Todos content</TabPanel>
      <TabPanel id="timeline">Timeline content</TabPanel>
    </Tabs>
  ),
};

export const Underline: Story = {
  render: () => (
    <Tabs
      variant="underline"
      tabs={[
        { id: 'missions', label: 'Missions' },
        { id: 'todos', label: 'Todos' },
        { id: 'timeline', label: 'Timeline' },
      ]}
    >
      <TabPanel id="missions">Missions content</TabPanel>
      <TabPanel id="todos">Todos content</TabPanel>
      <TabPanel id="timeline">Timeline content</TabPanel>
    </Tabs>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-8">
      <Tabs
        size="sm"
        tabs={[
          { id: 'a', label: 'Small' },
          { id: 'b', label: 'Tabs' },
        ]}
      >
        <TabPanel id="a">Small content</TabPanel>
        <TabPanel id="b">Tabs content</TabPanel>
      </Tabs>
      <Tabs
        size="md"
        tabs={[
          { id: 'a', label: 'Medium' },
          { id: 'b', label: 'Tabs' },
        ]}
      >
        <TabPanel id="a">Medium content</TabPanel>
        <TabPanel id="b">Tabs content</TabPanel>
      </Tabs>
      <Tabs
        size="lg"
        tabs={[
          { id: 'a', label: 'Large' },
          { id: 'b', label: 'Tabs' },
        ]}
      >
        <TabPanel id="a">Large content</TabPanel>
        <TabPanel id="b">Tabs content</TabPanel>
      </Tabs>
    </div>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Tabs
      fullWidth
      variant="pills"
      tabs={[
        { id: 'missions', label: 'Missions' },
        { id: 'todos', label: 'Todos' },
        { id: 'timeline', label: 'Timeline' },
      ]}
    >
      <TabPanel id="missions">Missions content</TabPanel>
      <TabPanel id="todos">Todos content</TabPanel>
      <TabPanel id="timeline">Timeline content</TabPanel>
    </Tabs>
  ),
};

export const WithOnChange: Story = {
  render: () => (
    <Tabs
      tabs={[
        { id: 'missions', label: 'Missions' },
        { id: 'todos', label: 'Todos' },
        { id: 'timeline', label: 'Timeline' },
      ]}
      onChange={(tabId) => console.log('Tab changed to:', tabId)}
    >
      <TabPanel id="missions">Missions content</TabPanel>
      <TabPanel id="todos">Todos content</TabPanel>
      <TabPanel id="timeline">Timeline content</TabPanel>
    </Tabs>
  ),
};

export const ComplexContent: Story = {
  render: () => (
    <Tabs
      tabs={[
        { id: 'overview', label: 'Overview', icon: <Target size={16} /> },
        { id: 'todos', label: 'Todos', icon: <CheckSquare size={16} />, badge: 5 },
        { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
      ]}
    >
      <TabPanel id="overview">
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium">Mission Overview</h3>
            <p className="text-sm text-slate-500 mt-1">
              View summary statistics and progress for this mission.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">75%</p>
              <p className="text-sm text-green-600">Complete</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">12</p>
              <p className="text-sm text-blue-600">Total Todos</p>
            </div>
          </div>
        </div>
      </TabPanel>
      <TabPanel id="todos">
        <div className="space-y-2">
          {['Implement login', 'Add validation', 'Write tests', 'Deploy to staging', 'Review PR'].map((todo, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">{todo}</span>
            </div>
          ))}
        </div>
      </TabPanel>
      <TabPanel id="settings">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Mission Name</label>
            <input
              type="text"
              defaultValue="User Authentication"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Priority</label>
            <select className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg">
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>
      </TabPanel>
    </Tabs>
  ),
};
