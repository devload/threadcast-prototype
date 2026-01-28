import type { Meta, StoryObj } from '@storybook/react';
import { MissionColumn } from './MissionColumn';
import type { Mission } from '../../types';

const createMockMission = (overrides: Partial<Mission> = {}): Mission => ({
  id: Math.random().toString(36).substr(2, 9),
  workspaceId: 'ws-1',
  title: 'Sample Mission',
  description: 'This is a sample mission description',
  status: 'BACKLOG',
  priority: 'MEDIUM',
  progress: 0,
  todoStats: { total: 4, pending: 4, threading: 0, woven: 0, tangled: 0 },
  createdAt: '2026-01-20T10:00:00Z',
  ...overrides,
});

const backlogMissions: Mission[] = [
  createMockMission({
    id: '1',
    title: 'Setup Project Structure',
    priority: 'HIGH',
    progress: 0,
    todoStats: { total: 3, pending: 3, threading: 0, woven: 0, tangled: 0 },
  }),
  createMockMission({
    id: '2',
    title: 'Design Database Schema',
    priority: 'MEDIUM',
    progress: 0,
    todoStats: { total: 5, pending: 5, threading: 0, woven: 0, tangled: 0 },
  }),
];

const threadingMissions: Mission[] = [
  createMockMission({
    id: '3',
    title: 'Implement User Authentication',
    status: 'THREADING',
    priority: 'HIGH',
    progress: 45,
    todoStats: { total: 6, pending: 1, threading: 3, woven: 2, tangled: 0 },
  }),
  createMockMission({
    id: '4',
    title: 'Build REST API Endpoints',
    status: 'THREADING',
    priority: 'MEDIUM',
    progress: 30,
    todoStats: { total: 8, pending: 3, threading: 3, woven: 2, tangled: 0 },
  }),
  createMockMission({
    id: '5',
    title: 'Create React Components',
    status: 'THREADING',
    priority: 'LOW',
    progress: 60,
    todoStats: { total: 10, pending: 1, threading: 3, woven: 6, tangled: 0 },
  }),
];

const wovenMissions: Mission[] = [
  createMockMission({
    id: '6',
    title: 'Initial Setup Complete',
    status: 'WOVEN',
    priority: 'HIGH',
    progress: 100,
    todoStats: { total: 4, pending: 0, threading: 0, woven: 4, tangled: 0 },
  }),
];

const meta: Meta<typeof MissionColumn> = {
  title: 'Mission/MissionColumn',
  component: MissionColumn,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Mission 보드의 개별 컬럼 컴포넌트입니다.

## 컬럼 상태별 용도

| 상태 | 컬럼 | 설명 |
|------|------|------|
| BACKLOG | 백로그 | 시작 전 Mission |
| THREADING | 진행 중 | AI가 작업 중인 Mission 🧵 |
| WOVEN | 완료 | 모든 Todo가 완료된 Mission ✅ |
| ARCHIVED | 아카이브 | 보관된 Mission |

## 헤더 구성
- 상태 아이콘 및 레이블
- Mission 개수 뱃지
- 추가 버튼 (선택적)

## MissionCard 포함 정보
- 제목 및 설명
- 우선순위 (CRITICAL/HIGH/MEDIUM/LOW)
- 진행률 프로그레스 바
- Todo 통계 (total/pending/threading/woven/tangled)

## 인터랙션
- Mission 클릭 시 상세 모달/패널
- 추가 버튼으로 새 Mission 생성

## 사용 예시
\`\`\`tsx
<MissionColumn
  status="THREADING"
  missions={threadingMissions}
  selectedMissionId={selectedId}
  onMissionClick={handleSelect}
  onAddClick={handleAdd}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80 h-[600px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    status: {
      control: 'select',
      options: ['BACKLOG', 'THREADING', 'WOVEN', 'ARCHIVED'],
    },
    onMissionClick: { action: 'mission clicked' },
    onAddClick: { action: 'add clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof MissionColumn>;

export const Backlog: Story = {
  args: {
    status: 'BACKLOG',
    missions: backlogMissions,
  },
};

export const Threading: Story = {
  args: {
    status: 'THREADING',
    missions: threadingMissions,
  },
};

export const Woven: Story = {
  args: {
    status: 'WOVEN',
    missions: wovenMissions,
  },
};

export const Empty: Story = {
  args: {
    status: 'BACKLOG',
    missions: [],
  },
};

export const Loading: Story = {
  args: {
    status: 'THREADING',
    missions: [],
    isLoading: true,
  },
};

export const WithSelectedMission: Story = {
  args: {
    status: 'THREADING',
    missions: threadingMissions,
    selectedMissionId: '4',
  },
};

export const WithAddButton: Story = {
  args: {
    status: 'BACKLOG',
    missions: backlogMissions,
    onAddClick: () => alert('Add mission clicked!'),
  },
};

export const ManyMissions: Story = {
  args: {
    status: 'THREADING',
    missions: [
      ...threadingMissions,
      createMockMission({
        id: '7',
        title: 'Additional Mission 1',
        status: 'THREADING',
        progress: 20,
      }),
      createMockMission({
        id: '8',
        title: 'Additional Mission 2',
        status: 'THREADING',
        progress: 75,
      }),
      createMockMission({
        id: '9',
        title: 'Additional Mission 3',
        status: 'THREADING',
        progress: 55,
      }),
    ],
  },
};
