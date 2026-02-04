import type { Meta, StoryObj } from '@storybook/react';
import { ActivityChart, ActivityDataPoint } from './ActivityChart';

const meta: Meta<typeof ActivityChart> = {
  title: 'Dashboard/ActivityChart',
  component: ActivityChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: 600, padding: 20, background: '#fff' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActivityChart>;

const generateSampleData = (days: number): ActivityDataPoint[] => {
  const data: ActivityDataPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      commits: Math.floor(Math.random() * 10) + 1,
      aiActions: Math.floor(Math.random() * 20) + 5,
      todosCompleted: Math.floor(Math.random() * 6),
    });
  }
  return data;
};

export const Default: Story = {
  args: {
    data: generateSampleData(7),
    height: 250,
    showLegend: true,
  },
};

export const TwoWeeks: Story = {
  args: {
    data: generateSampleData(14),
    height: 250,
    showLegend: true,
    title: 'Last 14 Days Activity',
  },
};

export const Compact: Story = {
  args: {
    data: generateSampleData(7),
    height: 150,
    showLegend: false,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    height: 200,
  },
};

export const LowActivity: Story = {
  args: {
    data: [
      { date: '2024-01-01', commits: 1, aiActions: 2, todosCompleted: 0 },
      { date: '2024-01-02', commits: 0, aiActions: 1, todosCompleted: 1 },
      { date: '2024-01-03', commits: 2, aiActions: 3, todosCompleted: 0 },
      { date: '2024-01-04', commits: 1, aiActions: 0, todosCompleted: 1 },
      { date: '2024-01-05', commits: 0, aiActions: 2, todosCompleted: 0 },
    ],
    height: 200,
    showLegend: true,
    title: 'Low Activity Period',
  },
};

export const HighActivity: Story = {
  args: {
    data: [
      { date: '2024-01-01', commits: 15, aiActions: 45, todosCompleted: 8 },
      { date: '2024-01-02', commits: 12, aiActions: 38, todosCompleted: 6 },
      { date: '2024-01-03', commits: 18, aiActions: 52, todosCompleted: 10 },
      { date: '2024-01-04', commits: 20, aiActions: 48, todosCompleted: 12 },
      { date: '2024-01-05', commits: 16, aiActions: 40, todosCompleted: 9 },
    ],
    height: 200,
    showLegend: true,
    title: 'High Activity Period',
  },
};
