import type { Meta, StoryObj } from '@storybook/react';
import { DashboardGrid, DashboardGridItem } from './DashboardGrid';

const meta: Meta<typeof DashboardGrid> = {
  title: 'Dashboard/DashboardGrid',
  component: DashboardGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DashboardGrid>;

const SampleCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 h-24 flex items-center justify-center">
    {children}
  </div>
);

export const Default: Story = {
  args: {
    cols: { default: 1, sm: 2, md: 3, lg: 4 },
    gap: 'md',
  },
  render: (args) => (
    <DashboardGrid {...args}>
      <SampleCard>Card 1</SampleCard>
      <SampleCard>Card 2</SampleCard>
      <SampleCard>Card 3</SampleCard>
      <SampleCard>Card 4</SampleCard>
    </DashboardGrid>
  ),
};

export const TwoColumns: Story = {
  args: {
    cols: { default: 1, md: 2 },
    gap: 'lg',
  },
  render: (args) => (
    <DashboardGrid {...args}>
      <SampleCard>Left Column</SampleCard>
      <SampleCard>Right Column</SampleCard>
    </DashboardGrid>
  ),
};

export const WithGridItems: Story = {
  args: {
    cols: { default: 1, md: 3 },
    gap: 'md',
  },
  render: (args) => (
    <DashboardGrid {...args}>
      <DashboardGridItem colSpan={2}>
        <SampleCard>Spans 2 columns</SampleCard>
      </DashboardGridItem>
      <DashboardGridItem>
        <SampleCard>Single column</SampleCard>
      </DashboardGridItem>
      <DashboardGridItem colSpan="full">
        <SampleCard>Full width</SampleCard>
      </DashboardGridItem>
    </DashboardGrid>
  ),
};

export const FiveColumns: Story = {
  args: {
    cols: { default: 2, md: 3, lg: 5 },
    gap: 'md',
  },
  render: (args) => (
    <DashboardGrid {...args}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SampleCard key={i}>Stat {i}</SampleCard>
      ))}
    </DashboardGrid>
  ),
};
