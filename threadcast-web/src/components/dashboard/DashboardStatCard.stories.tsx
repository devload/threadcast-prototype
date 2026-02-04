import type { Meta, StoryObj } from '@storybook/react';
import { DashboardStatCard } from './DashboardStatCard';
import { Target, Zap, CheckSquare, Clock, MessageCircle } from 'lucide-react';

const meta: Meta<typeof DashboardStatCard> = {
  title: 'Dashboard/DashboardStatCard',
  component: DashboardStatCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '280px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DashboardStatCard>;

export const Default: Story = {
  args: {
    icon: <Target size={20} />,
    iconBg: 'indigo',
    value: 12,
    label: 'Total Missions',
  },
};

export const WithSubValue: Story = {
  args: {
    icon: <Zap size={20} />,
    iconBg: 'amber',
    value: 5,
    label: 'Active Tasks',
    subValue: '3 high priority',
  },
};

export const WithChange: Story = {
  args: {
    icon: <CheckSquare size={20} />,
    iconBg: 'green',
    value: '85%',
    label: 'Completion Rate',
    change: {
      value: 12,
      type: 'increase',
      label: 'this week',
    },
  },
};

export const Highlighted: Story = {
  args: {
    icon: <MessageCircle size={20} />,
    iconBg: 'pink',
    value: 3,
    label: 'Pending Questions',
    subValue: 'Needs your input',
    highlight: true,
  },
};

export const Clickable: Story = {
  args: {
    icon: <Clock size={20} />,
    iconBg: 'purple',
    value: '~2h',
    label: 'Estimated Time',
    onClick: () => alert('Clicked!'),
  },
};

export const Small: Story = {
  args: {
    icon: <Target size={16} />,
    iconBg: 'indigo',
    value: 42,
    label: 'Total',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    icon: <Target size={24} />,
    iconBg: 'indigo',
    value: 1234,
    label: 'Total Views',
    subValue: 'Last 30 days',
    size: 'lg',
  },
};

export const DecreaseChange: Story = {
  args: {
    icon: <Zap size={20} />,
    iconBg: 'red',
    value: 8,
    label: 'Failed Tasks',
    change: {
      value: 5,
      type: 'decrease',
      label: 'from last week',
    },
  },
};
