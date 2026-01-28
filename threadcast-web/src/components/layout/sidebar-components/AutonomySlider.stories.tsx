import type { Meta, StoryObj } from '@storybook/react';
import { AutonomySlider } from './AutonomySlider';
import { useState } from 'react';

const meta: Meta<typeof AutonomySlider> = {
  title: 'Layout/Sidebar/AutonomySlider',
  component: AutonomySlider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
AI 자율성 레벨을 조절하는 슬라이더 컴포넌트입니다.

## 자율성 레벨
| 레벨 | 이름 | 설명 |
|------|------|------|
| 1 | Minimal | 모든 결정에 사용자 확인 필요 |
| 2 | Guided | 주요 결정에만 확인 필요 |
| 3 | Balanced | AI와 사용자가 균형있게 협업 |
| 4 | Autonomous | AI가 대부분 자율적으로 진행 |
| 5 | Maximum | AI가 완전 자율적으로 진행 |

## 사용 예시
\`\`\`tsx
<AutonomySlider
  value={3}
  onChange={(level) => console.log('Level:', level)}
  showHint={true}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[260px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    value: {
      control: { type: 'range', min: 1, max: 5, step: 1 },
      description: '현재 자율성 레벨 (1-5)',
    },
    showHint: {
      control: 'boolean',
      description: '힌트 메시지 표시 여부',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AutonomySlider>;

/**
 * Level 1 - Minimal 자율성입니다.
 * 모든 결정에 사용자 확인이 필요합니다.
 */
export const Level1Minimal: Story = {
  args: {
    value: 1,
  },
};

/**
 * Level 2 - Guided 자율성입니다.
 */
export const Level2Guided: Story = {
  args: {
    value: 2,
  },
};

/**
 * Level 3 - Balanced 자율성입니다. (기본값)
 * AI와 사용자가 균형있게 협업합니다.
 */
export const Level3Balanced: Story = {
  args: {
    value: 3,
  },
};

/**
 * Level 4 - Autonomous 자율성입니다.
 */
export const Level4Autonomous: Story = {
  args: {
    value: 4,
  },
};

/**
 * Level 5 - Maximum 자율성입니다.
 * AI가 완전 자율적으로 진행합니다.
 */
export const Level5Maximum: Story = {
  args: {
    value: 5,
  },
};

/**
 * 힌트 메시지 없이 표시됩니다.
 */
export const WithoutHint: Story = {
  args: {
    value: 3,
    showHint: false,
  },
};

/**
 * 인터랙티브 데모입니다.
 * 슬라이더를 움직이면 레벨이 변경됩니다.
 */
export const Interactive: Story = {
  render: () => {
    const [level, setLevel] = useState(3);

    return (
      <div>
        <AutonomySlider value={level} onChange={setLevel} />
        <div className="mt-4 text-sm text-slate-600 text-center">
          현재 선택: Level {level}
        </div>
      </div>
    );
  },
};
