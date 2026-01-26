import type { Meta, StoryObj } from '@storybook/react';
import {
  EmptyState,
  NoMissionsEmpty,
  NoTodosEmpty,
  NoSearchResultsEmpty,
  ErrorEmpty,
  NoTimelineEmpty,
} from './EmptyState';
import { FolderOpen, Users, Calendar, Zap } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Common/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
콘텐츠가 없을 때 표시하는 빈 상태 컴포넌트입니다.

## 구성 요소
- **EmptyState**: 기본 빈 상태 컴포넌트
- **NoMissionsEmpty**: 미션이 없을 때
- **NoTodosEmpty**: Todo가 없을 때
- **NoSearchResultsEmpty**: 검색 결과 없음
- **ErrorEmpty**: 에러 발생 시
- **NoTimelineEmpty**: 타임라인이 비었을 때

## 타입 (type)
| type | 아이콘 | 용도 |
|------|--------|------|
| default | 📄 | 기본 빈 상태 |
| search | 🔍 | 검색 결과 없음 |
| error | ⚠️ | 에러/실패 |
| no-access | 🔒 | 접근 권한 없음 |

## 크기 (size)
- **sm**: 작은 영역 (테이블 내부 등)
- **md**: 기본 크기
- **lg**: 큰 영역 (전체 페이지)

## 주요 Props
- **title**: 제목
- **description**: 설명 문구
- **icon**: 커스텀 아이콘
- **action**: 주요 액션 버튼
- **secondaryAction**: 보조 액션

## 사용 예시
\`\`\`tsx
<EmptyState
  type="search"
  title="검색 결과 없음"
  description="다른 검색어로 시도해보세요"
  action={{
    label: '필터 초기화',
    onClick: handleClear,
  }}
/>

<NoMissionsEmpty onCreateClick={handleCreate} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-96 bg-white rounded-lg border p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'No items',
    description: 'Get started by creating your first item.',
  },
};

export const WithAction: Story = {
  args: {
    title: 'No items',
    description: 'Get started by creating your first item.',
    action: {
      label: 'Create Item',
      onClick: () => alert('Create clicked!'),
    },
  },
};

export const WithSecondaryAction: Story = {
  args: {
    title: 'No items',
    description: 'Get started by creating your first item.',
    action: {
      label: 'Create Item',
      onClick: () => alert('Create clicked!'),
    },
    secondaryAction: {
      label: 'Learn more',
      onClick: () => alert('Learn more clicked!'),
    },
  },
};

export const SearchEmpty: Story = {
  args: {
    type: 'search',
    title: 'No results found',
    description: 'Try adjusting your search terms or filters.',
    action: {
      label: 'Clear filters',
      onClick: () => alert('Clear clicked!'),
      variant: 'secondary',
    },
  },
};

export const ErrorState: Story = {
  args: {
    type: 'error',
    title: 'Failed to load',
    description: 'Something went wrong while loading the data.',
    action: {
      label: 'Try again',
      onClick: () => alert('Retry clicked!'),
      variant: 'secondary',
    },
  },
};

export const NoAccess: Story = {
  args: {
    type: 'no-access',
    title: 'Access denied',
    description: "You don't have permission to view this content.",
    action: {
      label: 'Request access',
      onClick: () => alert('Request clicked!'),
    },
  },
};

export const CustomIcon: Story = {
  args: {
    title: 'No projects',
    description: 'Create a project to get started.',
    icon: <FolderOpen size={48} className="text-slate-300" />,
    action: {
      label: 'New Project',
      onClick: () => alert('Create clicked!'),
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="border rounded-lg">
        <EmptyState
          size="sm"
          title="Small"
          description="This is the small variant."
        />
      </div>
      <div className="border rounded-lg">
        <EmptyState
          size="md"
          title="Medium"
          description="This is the medium variant."
        />
      </div>
      <div className="border rounded-lg">
        <EmptyState
          size="lg"
          title="Large"
          description="This is the large variant."
        />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

// Specialized empty states
export const NoMissions: StoryObj<typeof NoMissionsEmpty> = {
  render: () => <NoMissionsEmpty onCreateClick={() => alert('Create mission!')} />,
};

export const NoTodos: StoryObj<typeof NoTodosEmpty> = {
  render: () => <NoTodosEmpty onCreateClick={() => alert('Create todo!')} />,
};

export const NoSearchResults: StoryObj<typeof NoSearchResultsEmpty> = {
  render: () => (
    <NoSearchResultsEmpty
      query="authentication"
      onClear={() => alert('Clear search!')}
    />
  ),
};

export const Error: StoryObj<typeof ErrorEmpty> = {
  render: () => <ErrorEmpty onRetry={() => alert('Retry!')} />,
};

export const NoTimeline: StoryObj<typeof NoTimelineEmpty> = {
  render: () => <NoTimelineEmpty />,
};

export const CustomVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <EmptyState
        title="No team members"
        description="Invite team members to collaborate on this workspace."
        icon={<Users size={48} className="text-indigo-300" />}
        action={{
          label: 'Invite Members',
          onClick: () => {},
        }}
      />
      <EmptyState
        title="No upcoming events"
        description="Schedule events to keep your team organized."
        icon={<Calendar size={48} className="text-green-300" />}
        action={{
          label: 'Schedule Event',
          onClick: () => {},
        }}
      />
      <EmptyState
        title="No integrations"
        description="Connect your favorite tools to streamline your workflow."
        icon={<Zap size={48} className="text-amber-300" />}
        action={{
          label: 'Browse Integrations',
          onClick: () => {},
        }}
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[500px] space-y-4">
        <Story />
      </div>
    ),
  ],
};

export const InTableContext: Story = {
  render: () => (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3}>
              <EmptyState
                size="sm"
                title="No data"
                description="There's nothing to display yet."
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};
