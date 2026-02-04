import type { Meta, StoryObj } from '@storybook/react';
import { DashboardWidget, DashboardWidgetListItem } from './DashboardWidget';

const meta: Meta<typeof DashboardWidget> = {
  title: 'Dashboard/DashboardWidget',
  component: DashboardWidget,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DashboardWidget>;

export const Default: Story = {
  args: {
    title: 'Recent Activity',
    icon: '📊',
    children: (
      <div className="text-sm text-slate-600">
        Widget content goes here
      </div>
    ),
  },
};

export const WithViewAll: Story = {
  args: {
    title: 'Active Missions',
    icon: '🎯',
    subtitle: '5 missions in progress',
    viewAllLink: {
      label: 'View All',
      onClick: () => alert('View all clicked'),
    },
    children: (
      <div className="text-sm text-slate-600">
        Mission list would go here
      </div>
    ),
  },
};

export const WithAccentColor: Story = {
  args: {
    title: 'AI Questions',
    icon: '🤔',
    accentColor: 'pink',
    children: (
      <div className="text-sm text-slate-600">
        Questions needing attention
      </div>
    ),
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading Data',
    icon: '⏳',
    loading: true,
    children: null,
  },
};

export const Empty: Story = {
  args: {
    title: 'No Data',
    icon: '📭',
    empty: {
      icon: '📭',
      title: 'No items found',
      description: 'Start by creating a new item',
      action: {
        label: 'Create Item',
        onClick: () => alert('Create clicked'),
      },
    },
    children: null,
  },
};

export const WithListItems: Story = {
  args: {
    title: 'Recent Events',
    icon: '⏱️',
    contentPadding: 'sm',
    maxHeight: '250px',
    children: (
      <>
        <DashboardWidgetListItem
          left={<span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">🎯</span>}
          title="Mission Created"
          subtitle="5 minutes ago"
          right={<span className="text-xs text-slate-400">View</span>}
        />
        <DashboardWidgetListItem
          left={<span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">✅</span>}
          title="Todo Completed"
          subtitle="15 minutes ago"
        />
        <DashboardWidgetListItem
          left={<span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">🤖</span>}
          title="AI Question Asked"
          subtitle="30 minutes ago"
          highlight
        />
        <DashboardWidgetListItem
          left={<span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm">📝</span>}
          title="Comment Added"
          subtitle="1 hour ago"
        />
      </>
    ),
  },
};

export const ClickableListItems: Story = {
  args: {
    title: 'Clickable Items',
    icon: '👆',
    contentPadding: 'sm',
    children: (
      <>
        <DashboardWidgetListItem
          left={<span>🎯</span>}
          title="Click me"
          subtitle="I have an onClick handler"
          onClick={() => alert('Item clicked!')}
        />
        <DashboardWidgetListItem
          left={<span>📋</span>}
          title="Me too"
          subtitle="Click to interact"
          onClick={() => alert('Another item clicked!')}
        />
      </>
    ),
  },
};
