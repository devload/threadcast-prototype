import type { Meta, StoryObj } from '@storybook/react';
import { MissionBoard } from './MissionBoard';
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

const allMissions: Mission[] = [
  // Backlog
  createMockMission({
    id: '1',
    title: 'Setup Project Structure',
    status: 'BACKLOG',
    priority: 'HIGH',
    progress: 0,
    todoStats: { total: 3, pending: 3, threading: 0, woven: 0, tangled: 0 },
  }),
  createMockMission({
    id: '2',
    title: 'Design Database Schema',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    progress: 0,
    todoStats: { total: 5, pending: 5, threading: 0, woven: 0, tangled: 0 },
  }),
  // Threading
  createMockMission({
    id: '3',
    title: 'Implement User Authentication',
    description: 'JWT-based auth with Spring Security',
    status: 'THREADING',
    priority: 'HIGH',
    progress: 65,
    todoStats: { total: 6, pending: 1, threading: 2, woven: 3, tangled: 0 },
  }),
  createMockMission({
    id: '4',
    title: 'Build REST API Endpoints',
    description: 'CRUD operations for all entities',
    status: 'THREADING',
    priority: 'MEDIUM',
    progress: 40,
    todoStats: { total: 8, pending: 2, threading: 4, woven: 2, tangled: 0 },
  }),
  createMockMission({
    id: '5',
    title: 'Create React Components',
    description: 'Component library with Storybook',
    status: 'THREADING',
    priority: 'LOW',
    progress: 75,
    todoStats: { total: 10, pending: 0, threading: 3, woven: 7, tangled: 0 },
  }),
  // Woven
  createMockMission({
    id: '6',
    title: 'Initial Setup Complete',
    status: 'WOVEN',
    priority: 'HIGH',
    progress: 100,
    todoStats: { total: 4, pending: 0, threading: 0, woven: 4, tangled: 0 },
  }),
  createMockMission({
    id: '7',
    title: 'CI/CD Pipeline',
    status: 'WOVEN',
    priority: 'MEDIUM',
    progress: 100,
    todoStats: { total: 3, pending: 0, threading: 0, woven: 3, tangled: 0 },
  }),
];

const meta: Meta<typeof MissionBoard> = {
  title: 'Mission/MissionBoard',
  component: MissionBoard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Mission을 칸반 보드 형태로 표시하는 컴포넌트입니다.

## 칸반 컬럼 구조
- **Backlog**: 시작 전 미션
- **Threading**: AI가 작업 중인 미션
- **Woven**: 완료된 미션

## 주요 기능
- 드래그 앤 드롭으로 상태 변경 (예정)
- 미션 선택 하이라이트
- 미션 추가 버튼
- 로딩 스켈레톤

## 프로토타입 기반
\`00-missions-board.html\` 프로토타입의 칸반 레이아웃을 구현합니다.

## 사용 예시
\`\`\`tsx
<MissionBoard
  missions={missions}
  selectedMissionId={selectedId}
  onMissionClick={(mission) => setSelected(mission)}
  onAddMission={() => openCreateModal()}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-6 bg-slate-50 min-h-screen">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onMissionClick: { action: 'mission clicked' },
    onAddMission: { action: 'add mission clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof MissionBoard>;

export const Default: Story = {
  args: {
    missions: allMissions,
  },
};

export const WithSelectedMission: Story = {
  args: {
    missions: allMissions,
    selectedMissionId: '4',
  },
};

export const Empty: Story = {
  args: {
    missions: [],
  },
};

export const Loading: Story = {
  args: {
    missions: [],
    isLoading: true,
  },
};

export const OnlyBacklog: Story = {
  args: {
    missions: allMissions.filter((m) => m.status === 'BACKLOG'),
  },
};

export const OnlyThreading: Story = {
  args: {
    missions: allMissions.filter((m) => m.status === 'THREADING'),
  },
};

export const FullBoard: Story = {
  args: {
    missions: [
      ...allMissions,
      createMockMission({
        id: '8',
        title: 'WebSocket Integration',
        status: 'BACKLOG',
        priority: 'HIGH',
      }),
      createMockMission({
        id: '9',
        title: 'Unit Testing',
        status: 'THREADING',
        priority: 'MEDIUM',
        progress: 30,
      }),
      createMockMission({
        id: '10',
        title: 'Documentation',
        status: 'WOVEN',
        priority: 'LOW',
        progress: 100,
      }),
    ],
  },
};
