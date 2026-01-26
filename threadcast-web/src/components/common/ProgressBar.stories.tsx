import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar, StepProgress } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Common/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
진행률을 시각적으로 표시하는 컴포넌트입니다.

## 구성 요소
- **ProgressBar**: 퍼센트 기반 진행 바
- **StepProgress**: 단계 기반 진행 표시 (ThreadCast의 6단계 시스템용)

## 주요 기능
- 크기 조절 (sm, md, lg)
- 색상 테마 (default, success, warning, danger)
- 퍼센트 라벨 표시
- 애니메이션 효과

## ThreadCast 6단계 시스템
\`StepProgress\`는 ThreadCast의 작업 단계를 표시합니다:
1. Analysis (분석)
2. Design (설계)
3. Implementation (구현)
4. Verification (검증)
5. Review (리뷰)
6. Integration (통합)
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    color: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger'],
    },
    showLabel: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: {
    value: 60,
  },
};

export const Empty: Story = {
  args: {
    value: 0,
  },
};

export const Full: Story = {
  args: {
    value: 100,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
  },
};

export const Small: Story = {
  args: {
    value: 50,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    value: 50,
    size: 'lg',
  },
};

export const SuccessColor: Story = {
  args: {
    value: 80,
    color: 'success',
  },
};

export const WarningColor: Story = {
  args: {
    value: 40,
    color: 'warning',
  },
};

export const DangerColor: Story = {
  args: {
    value: 20,
    color: 'danger',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <div>
        <p className="text-sm text-slate-600 mb-1">0%</p>
        <ProgressBar value={0} />
      </div>
      <div>
        <p className="text-sm text-slate-600 mb-1">25%</p>
        <ProgressBar value={25} />
      </div>
      <div>
        <p className="text-sm text-slate-600 mb-1">50%</p>
        <ProgressBar value={50} />
      </div>
      <div>
        <p className="text-sm text-slate-600 mb-1">75%</p>
        <ProgressBar value={75} />
      </div>
      <div>
        <p className="text-sm text-slate-600 mb-1">100%</p>
        <ProgressBar value={100} />
      </div>
    </div>
  ),
};

// Step Progress Stories
export const StepProgressDefault: StoryObj<typeof StepProgress> = {
  render: () => <StepProgress current={2} total={6} />,
};

export const StepProgressStart: StoryObj<typeof StepProgress> = {
  render: () => <StepProgress current={0} total={6} />,
};

export const StepProgressComplete: StoryObj<typeof StepProgress> = {
  render: () => <StepProgress current={6} total={6} />,
};

export const StepProgressVariants: StoryObj<typeof StepProgress> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-slate-600 mb-2">Step 1 of 6 (Analysis)</p>
        <StepProgress current={0} total={6} />
      </div>
      <div>
        <p className="text-sm text-slate-600 mb-2">Step 3 of 6 (Implementation)</p>
        <StepProgress current={2} total={6} />
      </div>
      <div>
        <p className="text-sm text-slate-600 mb-2">Step 6 of 6 (Complete)</p>
        <StepProgress current={6} total={6} />
      </div>
    </div>
  ),
};
