import type { Meta, StoryObj } from '@storybook/react';
import { WeeklyActivityChart } from './WeeklyActivityChart';

const meta: Meta<typeof WeeklyActivityChart> = {
  title: 'Dashboard/WeeklyActivityChart',
  component: WeeklyActivityChart,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: 500, padding: 20, background: '#fff' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WeeklyActivityChart>;

export const Default: Story = {
  args: {
    data: [
      { day: 'Monday', ai: 15, user: 8 },
      { day: 'Tuesday', ai: 22, user: 12 },
      { day: 'Wednesday', ai: 18, user: 15 },
      { day: 'Thursday', ai: 25, user: 10 },
      { day: 'Friday', ai: 20, user: 14 },
      { day: 'Saturday', ai: 8, user: 5 },
      { day: 'Sunday', ai: 5, user: 3 },
    ],
    height: 220,
    showLegend: true,
  },
};

export const HighAIActivity: Story = {
  args: {
    data: [
      { day: 'Monday', ai: 45, user: 8 },
      { day: 'Tuesday', ai: 52, user: 12 },
      { day: 'Wednesday', ai: 48, user: 10 },
      { day: 'Thursday', ai: 55, user: 8 },
      { day: 'Friday', ai: 40, user: 14 },
      { day: 'Saturday', ai: 25, user: 5 },
      { day: 'Sunday', ai: 15, user: 3 },
    ],
    height: 220,
    showLegend: true,
    title: 'AI-Heavy Workflow',
  },
};

export const BalancedActivity: Story = {
  args: {
    data: [
      { day: 'Monday', ai: 20, user: 18 },
      { day: 'Tuesday', ai: 22, user: 20 },
      { day: 'Wednesday', ai: 18, user: 22 },
      { day: 'Thursday', ai: 25, user: 23 },
      { day: 'Friday', ai: 20, user: 19 },
      { day: 'Saturday', ai: 8, user: 10 },
      { day: 'Sunday', ai: 5, user: 6 },
    ],
    height: 220,
    showLegend: true,
    title: 'Balanced Collaboration',
  },
};

export const WeekendHeavy: Story = {
  args: {
    data: [
      { day: 'Monday', ai: 5, user: 3 },
      { day: 'Tuesday', ai: 8, user: 4 },
      { day: 'Wednesday', ai: 6, user: 5 },
      { day: 'Thursday', ai: 10, user: 6 },
      { day: 'Friday', ai: 12, user: 8 },
      { day: 'Saturday', ai: 30, user: 25 },
      { day: 'Sunday', ai: 28, user: 22 },
    ],
    height: 220,
    showLegend: true,
    title: 'Weekend Warrior',
  },
};

export const Compact: Story = {
  args: {
    data: [
      { day: 'Monday', ai: 15, user: 8 },
      { day: 'Tuesday', ai: 22, user: 12 },
      { day: 'Wednesday', ai: 18, user: 15 },
      { day: 'Thursday', ai: 25, user: 10 },
      { day: 'Friday', ai: 20, user: 14 },
      { day: 'Saturday', ai: 8, user: 5 },
      { day: 'Sunday', ai: 5, user: 3 },
    ],
    height: 150,
    showLegend: false,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    height: 200,
    showLegend: true,
  },
};
