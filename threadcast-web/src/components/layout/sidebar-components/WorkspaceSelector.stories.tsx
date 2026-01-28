import type { Meta, StoryObj } from '@storybook/react';
import { WorkspaceSelector } from './WorkspaceSelector';
import { useState } from 'react';

const meta: Meta<typeof WorkspaceSelector> = {
  title: 'Layout/Sidebar/WorkspaceSelector',
  component: WorkspaceSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
워크스페이스 선택 드롭다운 컴포넌트입니다.

## 기능
- 현재 워크스페이스 표시
- 드롭다운으로 워크스페이스 전환
- 외부 클릭 시 자동 닫힘
- 접근성 지원 (ARIA attributes)

## 사용 예시
\`\`\`tsx
<WorkspaceSelector
  current={{ id: '1', name: 'My Workspace' }}
  workspaces={[
    { id: '1', name: 'My Workspace' },
    { id: '2', name: 'Team Project' },
  ]}
  onChange={(id) => console.log('Selected:', id)}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[260px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WorkspaceSelector>;

/**
 * 단일 워크스페이스만 있는 경우입니다.
 * 드롭다운이 열리지 않습니다.
 */
export const SingleWorkspace: Story = {
  args: {
    current: { id: '1', name: 'My Workspace' },
    workspaces: [],
  },
};

/**
 * 여러 워크스페이스가 있는 경우입니다.
 * 클릭하면 드롭다운이 열립니다.
 */
export const MultipleWorkspaces: Story = {
  args: {
    current: { id: '1', name: 'Product Development' },
    workspaces: [
      { id: '1', name: 'Product Development' },
      { id: '2', name: 'Marketing Campaign' },
      { id: '3', name: 'Infrastructure' },
      { id: '4', name: 'Customer Support' },
    ],
  },
};

/**
 * 긴 워크스페이스 이름을 가진 경우입니다.
 * 이름이 잘리고 말줄임표가 표시됩니다.
 */
export const LongWorkspaceName: Story = {
  args: {
    current: { id: '1', name: 'Very Long Workspace Name That Should Be Truncated' },
    workspaces: [
      { id: '1', name: 'Very Long Workspace Name That Should Be Truncated' },
      { id: '2', name: 'Another Long Name Here' },
    ],
  },
};

/**
 * 인터랙티브 데모입니다.
 * 워크스페이스를 선택하면 상태가 업데이트됩니다.
 */
export const Interactive: Story = {
  render: () => {
    const workspaces = [
      { id: '1', name: 'My Workspace' },
      { id: '2', name: 'Team Project' },
      { id: '3', name: 'Personal Tasks' },
    ];

    const [current, setCurrent] = useState(workspaces[0]);

    return (
      <WorkspaceSelector
        current={current}
        workspaces={workspaces}
        onChange={(id) => {
          const ws = workspaces.find((w) => w.id === id);
          if (ws) setCurrent(ws);
        }}
      />
    );
  },
};
