import type { Meta, StoryObj } from '@storybook/react';
import { TodoStatusChart } from './TodoStatusChart';

const meta: Meta<typeof TodoStatusChart> = {
  title: 'Dashboard/TodoStatusChart',
  component: TodoStatusChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 300, padding: 20, background: '#fff', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TodoStatusChart>;

export const Default: Story = {
  args: {
    data: {
      pending: 5,
      threading: 3,
      woven: 12,
      tangled: 2,
    },
    height: 220,
    showLegend: true,
    variant: 'donut',
  },
};

export const PieChart: Story = {
  args: {
    data: {
      pending: 5,
      threading: 3,
      woven: 12,
      tangled: 2,
    },
    height: 220,
    showLegend: true,
    variant: 'pie',
  },
};

export const MostlyCompleted: Story = {
  args: {
    data: {
      pending: 2,
      threading: 1,
      woven: 25,
      tangled: 0,
    },
    height: 220,
    showLegend: true,
    variant: 'donut',
    title: 'Almost Done!',
  },
};

export const EarlyStage: Story = {
  args: {
    data: {
      pending: 15,
      threading: 2,
      woven: 3,
      tangled: 0,
    },
    height: 220,
    showLegend: true,
    variant: 'donut',
    title: 'Just Started',
  },
};

export const WithIssues: Story = {
  args: {
    data: {
      pending: 3,
      threading: 1,
      woven: 8,
      tangled: 5,
    },
    height: 220,
    showLegend: true,
    variant: 'donut',
    title: 'Needs Attention',
  },
};

export const Empty: Story = {
  args: {
    data: {
      pending: 0,
      threading: 0,
      woven: 0,
      tangled: 0,
    },
    height: 200,
    showLegend: true,
    variant: 'donut',
  },
};

export const Compact: Story = {
  args: {
    data: {
      pending: 5,
      threading: 3,
      woven: 12,
      tangled: 2,
    },
    height: 160,
    showLegend: false,
    variant: 'donut',
  },
};
