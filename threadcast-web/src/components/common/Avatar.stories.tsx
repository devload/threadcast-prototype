import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarGroup, AvatarWithStatus } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Common/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
사용자 프로필 아바타 컴포넌트입니다.

## 구성 요소
- **Avatar**: 기본 아바타 (이미지 또는 이니셜)
- **AvatarGroup**: 여러 아바타를 겹쳐서 표시
- **AvatarWithStatus**: 온라인 상태 표시가 있는 아바타

## 주요 기능
- 이미지 또는 이름 이니셜 표시
- 5가지 크기 (xs, sm, md, lg, xl)
- 이름 기반 자동 색상 생성
- 온라인 상태 표시 (online, offline, busy, away)
- 그룹 표시 시 최대 개수 제한 및 오버플로우 카운트

## 사용 예시
\`\`\`tsx
// 이미지 아바타
<Avatar src="/profile.jpg" alt="홍길동" />

// 이름 이니셜
<Avatar name="홍길동" />

// 상태 표시
<AvatarWithStatus name="홍길동" status="online" />

// 그룹
<AvatarGroup avatars={users} max={4} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    alt: 'John Doe',
  },
};

export const WithName: Story = {
  args: {
    name: 'John Doe',
  },
};

export const Placeholder: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar name="XS" size="xs" />
      <Avatar name="SM" size="sm" />
      <Avatar name="MD" size="md" />
      <Avatar name="LG" size="lg" />
      <Avatar name="XL" size="xl" />
    </div>
  ),
};

export const NameColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {['Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo'].map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </div>
  ),
};

export const SingleName: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar name="A" />
      <Avatar name="Alice" />
      <Avatar name="Al" />
    </div>
  ),
};

// Avatar Group Stories
export const GroupDefault: StoryObj<typeof AvatarGroup> = {
  render: () => (
    <AvatarGroup
      avatars={[
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' },
      ]}
    />
  ),
};

export const GroupWithImages: StoryObj<typeof AvatarGroup> = {
  render: () => (
    <AvatarGroup
      avatars={[
        { src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
        { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
        { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
      ]}
    />
  ),
};

export const GroupWithOverflow: StoryObj<typeof AvatarGroup> = {
  render: () => (
    <AvatarGroup
      avatars={[
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' },
        { name: 'David' },
        { name: 'Emma' },
        { name: 'Frank' },
      ]}
      max={4}
    />
  ),
};

export const GroupSizes: StoryObj<typeof AvatarGroup> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <AvatarGroup
        avatars={[{ name: 'A' }, { name: 'B' }, { name: 'C' }]}
        size="xs"
      />
      <AvatarGroup
        avatars={[{ name: 'A' }, { name: 'B' }, { name: 'C' }]}
        size="sm"
      />
      <AvatarGroup
        avatars={[{ name: 'A' }, { name: 'B' }, { name: 'C' }]}
        size="md"
      />
      <AvatarGroup
        avatars={[{ name: 'A' }, { name: 'B' }, { name: 'C' }]}
        size="lg"
      />
    </div>
  ),
};

// Avatar with Status Stories
export const WithStatus: StoryObj<typeof AvatarWithStatus> = {
  render: () => (
    <div className="flex gap-6">
      <AvatarWithStatus name="Online" status="online" />
      <AvatarWithStatus name="Offline" status="offline" />
      <AvatarWithStatus name="Busy" status="busy" />
      <AvatarWithStatus name="Away" status="away" />
    </div>
  ),
};

export const StatusWithSizes: StoryObj<typeof AvatarWithStatus> = {
  render: () => (
    <div className="flex items-end gap-4">
      <AvatarWithStatus name="XS" size="xs" status="online" />
      <AvatarWithStatus name="SM" size="sm" status="online" />
      <AvatarWithStatus name="MD" size="md" status="online" />
      <AvatarWithStatus name="LG" size="lg" status="online" />
      <AvatarWithStatus name="XL" size="xl" status="online" />
    </div>
  ),
};

export const StatusWithImage: StoryObj<typeof AvatarWithStatus> = {
  render: () => (
    <div className="flex gap-6">
      <AvatarWithStatus
        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
        status="online"
      />
      <AvatarWithStatus
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
        status="busy"
      />
      <AvatarWithStatus
        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
        status="away"
      />
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
        <AvatarWithStatus name="John Doe" status="online" />
        <div>
          <p className="text-sm font-medium text-slate-900">John Doe</p>
          <p className="text-xs text-slate-500">Online</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
        <AvatarWithStatus
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
          status="busy"
        />
        <div>
          <p className="text-sm font-medium text-slate-900">Jane Smith</p>
          <p className="text-xs text-slate-500">In a meeting</p>
        </div>
      </div>
    </div>
  ),
};
