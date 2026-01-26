import type { Meta, StoryObj } from '@storybook/react';
import { Header, PageHeader } from './Header';
import { Button } from '../common/Button';
import { Plus, Filter, Download } from 'lucide-react';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
앱의 상단 헤더 컴포넌트입니다.

## 구성 요소
- **Header**: 메인 네비게이션 헤더
- **PageHeader**: 페이지별 제목 및 액션 영역

## Header 기능
- 제목 및 부제목
- 검색창 (선택적)
- 알림 버튼 (뱃지 표시)
- 사용자 메뉴
- 추가 버튼 (+ 아이콘)
- 커스텀 액션 영역

## PageHeader 기능
- 페이지 제목 및 설명
- 브레드크럼 네비게이션
- 액션 버튼 영역 (필터, 생성 등)

## 알림 뱃지
- 0개: 뱃지 숨김
- 1-9개: 숫자 표시
- 10개 이상: "9+" 표시

## 사용 예시
\`\`\`tsx
<Header
  title="Missions"
  subtitle="5 active missions"
  notifications={3}
  user={{ name: 'John Doe', email: 'john@example.com' }}
  onNotificationClick={handleNotifications}
  onAddClick={handleAdd}
/>

<PageHeader
  title="Mission Board"
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Missions' },
  ]}
  actions={<Button>New Mission</Button>}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {
    title: 'Missions',
    subtitle: '5 active missions',
    notifications: 3,
    user: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    onNotificationClick: () => alert('Notifications clicked'),
    onUserMenuClick: () => alert('User menu clicked'),
    onAddClick: () => alert('Add clicked'),
  },
};

export const WithSearch: Story = {
  args: {
    title: 'Dashboard',
    showSearch: true,
    searchPlaceholder: 'Search missions, todos...',
    onSearch: (query) => console.log('Search:', query),
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  },
};

export const NoSearch: Story = {
  args: {
    title: 'Settings',
    showSearch: false,
    user: {
      name: 'Admin User',
      email: 'admin@example.com',
    },
  },
};

export const WithCustomActions: Story = {
  args: {
    title: 'Todos',
    actions: (
      <>
        <button className="p-2 hover:bg-slate-100 rounded-lg">
          <Filter size={18} className="text-slate-500" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-lg">
          <Download size={18} className="text-slate-500" />
        </button>
      </>
    ),
    user: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    onAddClick: () => {},
  },
};

export const NoNotifications: Story = {
  args: {
    title: 'Timeline',
    notifications: 0,
    onNotificationClick: () => {},
    user: {
      name: 'User',
      email: 'user@example.com',
    },
  },
};

export const ManyNotifications: Story = {
  args: {
    title: 'AI Questions',
    notifications: 15,
    onNotificationClick: () => {},
    user: {
      name: 'User',
      email: 'user@example.com',
    },
  },
};

// PageHeader Stories
export const PageHeaderDefault: StoryObj<typeof PageHeader> = {
  render: () => (
    <div className="p-6 bg-slate-50">
      <PageHeader
        title="Mission Board"
        description="Track and manage your missions"
      />
    </div>
  ),
};

export const PageHeaderWithActions: StoryObj<typeof PageHeader> = {
  render: () => (
    <div className="p-6 bg-slate-50">
      <PageHeader
        title="Todos"
        description="Manage your todo items"
        actions={
          <>
            <Button variant="secondary" leftIcon={<Filter size={16} />}>
              Filter
            </Button>
            <Button leftIcon={<Plus size={16} />}>New Todo</Button>
          </>
        }
      />
    </div>
  ),
};

export const PageHeaderWithBreadcrumbs: StoryObj<typeof PageHeader> = {
  render: () => (
    <div className="p-6 bg-slate-50">
      <PageHeader
        title="User Authentication"
        description="Implement JWT-based authentication"
        breadcrumbs={[
          { label: 'Missions', href: '/missions' },
          { label: 'Authentication Module', href: '/missions/1' },
          { label: 'User Authentication' },
        ]}
        onBreadcrumbClick={(href) => console.log('Navigate to:', href)}
        actions={
          <Button variant="secondary">Edit</Button>
        }
      />
    </div>
  ),
};

export const FullLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Missions"
        notifications={3}
        user={{
          name: 'John Doe',
          email: 'john@example.com',
        }}
        onNotificationClick={() => {}}
        onUserMenuClick={() => {}}
        onAddClick={() => {}}
      />
      <div className="p-6">
        <PageHeader
          title="Mission Board"
          description="Track and manage your missions"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Missions' },
          ]}
          actions={
            <>
              <Button variant="secondary">Filter</Button>
              <Button>New Mission</Button>
            </>
          }
        />
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
          Content goes here
        </div>
      </div>
    </div>
  ),
};
