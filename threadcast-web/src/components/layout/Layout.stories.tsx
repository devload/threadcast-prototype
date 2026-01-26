import type { Meta, StoryObj } from '@storybook/react';
import { Layout, ContentWrapper, SplitLayout } from './Layout';
import { PageHeader } from './Header';
import { Button } from '../common/Button';
import { Plus } from 'lucide-react';

const meta: Meta<typeof Layout> = {
  title: 'Layout/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
앱의 전체 레이아웃을 구성하는 컴포넌트들입니다.

## 구성 요소
- **Layout**: 사이드바 + 헤더 + 콘텐츠 구조
- **ContentWrapper**: 콘텐츠 최대 너비 제한
- **SplitLayout**: 메인/사이드바 분할 레이아웃

## Layout 구조
\`\`\`
┌─────┬────────────────────────┐
│     │ Header                 │
│ S   ├────────────────────────┤
│ i   │                        │
│ d   │ Content                │
│ e   │                        │
│ b   │                        │
│ a   │                        │
│ r   │                        │
└─────┴────────────────────────┘
\`\`\`

## ContentWrapper maxWidth
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px
- **full**: 100%

## SplitLayout
- 좌측 또는 우측 사이드바
- 사이드바 너비 옵션 (sm, md, lg)
- Todo 상세보기 등에 활용

## 사용 예시
\`\`\`tsx
<Layout
  currentPath="/missions"
  title="Missions"
  user={currentUser}
>
  <PageHeader title="Mission Board" />
  <MissionBoard missions={missions} />
</Layout>

<ContentWrapper maxWidth="lg">
  <Timeline events={events} />
</ContentWrapper>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Layout>;

export const Default: Story = {
  args: {
    currentPath: '/missions',
    title: 'Missions',
    subtitle: '5 active missions',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    notifications: 3,
    children: (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
        Content goes here
      </div>
    ),
  },
};

export const WithPageHeader: Story = {
  args: {
    currentPath: '/todos',
    title: 'Todos',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    children: (
      <>
        <PageHeader
          title="Todo Board"
          description="Track your daily tasks"
          actions={
            <>
              <Button variant="secondary">Filter</Button>
              <Button leftIcon={<Plus size={16} />}>New Todo</Button>
            </>
          }
        />
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
          Kanban board content
        </div>
      </>
    ),
  },
};

export const TimelinePage: Story = {
  args: {
    currentPath: '/timeline',
    title: 'Timeline',
    showSearch: false,
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    children: (
      <ContentWrapper maxWidth="lg">
        <PageHeader title="Activity Timeline" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="h-20 text-slate-400 text-center flex items-center justify-center">
                Timeline item {i}
              </div>
            </div>
          ))}
        </div>
      </ContentWrapper>
    ),
  },
};

// ContentWrapper Stories
export const ContentWrapperSizes: StoryObj<typeof ContentWrapper> = {
  render: () => (
    <div className="space-y-8 p-6 bg-slate-100">
      {(['sm', 'md', 'lg', 'xl', '2xl', 'full'] as const).map((size) => (
        <ContentWrapper key={size} maxWidth={size}>
          <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
            maxWidth: {size}
          </div>
        </ContentWrapper>
      ))}
    </div>
  ),
};

// SplitLayout Stories
export const SplitLayoutRight: StoryObj<typeof SplitLayout> = {
  render: () => (
    <div className="h-96 border border-slate-200 rounded-lg overflow-hidden">
      <SplitLayout
        sidebarPosition="right"
        sidebarWidth="md"
        sidebar={
          <div className="p-4">
            <h3 className="font-medium mb-4">Details</h3>
            <div className="space-y-2 text-sm text-slate-500">
              <p>Selected item details</p>
              <p>Properties</p>
              <p>Actions</p>
            </div>
          </div>
        }
      >
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Main Content</h2>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded flex items-center justify-center">
                Item {i}
              </div>
            ))}
          </div>
        </div>
      </SplitLayout>
    </div>
  ),
};

export const SplitLayoutLeft: StoryObj<typeof SplitLayout> = {
  render: () => (
    <div className="h-96 border border-slate-200 rounded-lg overflow-hidden">
      <SplitLayout
        sidebarPosition="left"
        sidebarWidth="sm"
        sidebar={
          <div className="p-4">
            <h3 className="font-medium mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              {['Overview', 'Tasks', 'Files', 'Settings'].map((item) => (
                <li key={item} className="px-3 py-2 rounded hover:bg-slate-100 cursor-pointer">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Content Area</h2>
          <p className="text-slate-500">Main content with left sidebar navigation</p>
        </div>
      </SplitLayout>
    </div>
  ),
};
