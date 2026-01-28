import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Plus, ArrowRight, Save, Trash2, Download } from 'lucide-react';

/**
 * Button 컴포넌트는 ThreadCast의 기본 인터랙션 요소입니다.
 *
 * ## 사용 사례
 * - **Primary**: 주요 CTA 액션 (Mission 생성, Todo 완료 등)
 * - **Secondary**: 보조 액션 (취소, 닫기 등)
 * - **Ghost**: 덜 강조되는 액션 (필터, 정렬 등)
 * - **Danger**: 삭제 등 위험한 액션
 *
 * ## 접근성
 * - 키보드 포커스 지원
 * - disabled 상태에서 aria-disabled 자동 적용
 * - 로딩 상태에서 스피너와 함께 텍스트 유지
 */
const meta: Meta<typeof Button> = {
  title: 'Common/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
ThreadCast의 기본 버튼 컴포넌트입니다. 다양한 variant와 size를 지원하며,
아이콘과 로딩 상태를 포함할 수 있습니다.

### Import
\`\`\`tsx
import { Button } from '@/components/common/Button';
\`\`\`

### 기본 사용법
\`\`\`tsx
<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: '버튼의 시각적 스타일을 결정합니다.',
      table: {
        type: { summary: 'primary | secondary | ghost | danger' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: '버튼의 크기를 결정합니다.',
      table: {
        type: { summary: 'sm | md | lg' },
        defaultValue: { summary: 'md' },
      },
    },
    isLoading: {
      control: 'boolean',
      description: '로딩 스피너를 표시하고 버튼을 비활성화합니다.',
    },
    disabled: {
      control: 'boolean',
      description: '버튼을 비활성화합니다.',
    },
    fullWidth: {
      control: 'boolean',
      description: '버튼이 부모 요소의 전체 너비를 차지합니다.',
    },
    leftIcon: {
      description: '버튼 텍스트 왼쪽에 표시될 아이콘입니다.',
      table: { type: { summary: 'ReactNode' } },
    },
    rightIcon: {
      description: '버튼 텍스트 오른쪽에 표시될 아이콘입니다.',
      table: { type: { summary: 'ReactNode' } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * 기본 Primary 버튼입니다.
 * 주요 CTA(Call-to-Action)에 사용합니다.
 */
export const Primary: Story = {
  args: {
    children: 'Create Mission',
    variant: 'primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Primary 버튼은 페이지에서 가장 중요한 액션에 사용합니다. Mission 생성, Weaving 시작 등의 주요 CTA에 적합합니다.',
      },
    },
  },
};

/**
 * Secondary 버튼은 보조 액션에 사용합니다.
 */
export const Secondary: Story = {
  args: {
    children: 'Cancel',
    variant: 'secondary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Secondary 버튼은 Primary 버튼과 함께 사용되는 보조 액션에 적합합니다. 취소, 닫기, 뒤로가기 등에 사용합니다.',
      },
    },
  },
};

/**
 * Ghost 버튼은 덜 강조되는 액션에 사용합니다.
 */
export const Ghost: Story = {
  args: {
    children: 'More Options',
    variant: 'ghost',
  },
  parameters: {
    docs: {
      description: {
        story: 'Ghost 버튼은 시각적으로 덜 강조되어야 하는 액션에 사용합니다. 필터, 정렬, 더보기 등에 적합합니다.',
      },
    },
  },
};

/**
 * Danger 버튼은 삭제 등 위험한 액션에 사용합니다.
 */
export const Danger: Story = {
  args: {
    children: 'Delete Mission',
    variant: 'danger',
    leftIcon: <Trash2 size={16} />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Danger 버튼은 삭제, 취소 등 되돌릴 수 없는 위험한 액션에 사용합니다. 항상 확인 다이얼로그와 함께 사용하세요.',
      },
    },
  },
};

/**
 * Small 버튼은 좁은 공간에서 사용합니다.
 */
export const Small: Story = {
  args: {
    children: 'View Details',
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: '카드 내부, 테이블 셀 등 좁은 공간에서 사용하는 작은 버튼입니다.',
      },
    },
  },
};

/**
 * Large 버튼은 강조가 필요한 CTA에 사용합니다.
 */
export const Large: Story = {
  args: {
    children: 'Start Weaving',
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: '모달의 주요 CTA, 온보딩 플로우 등 강조가 필요한 곳에서 사용하는 큰 버튼입니다.',
      },
    },
  },
};

/**
 * 왼쪽 아이콘이 있는 버튼입니다.
 */
export const WithLeftIcon: Story = {
  args: {
    children: 'Add Todo',
    leftIcon: <Plus size={16} />,
  },
  parameters: {
    docs: {
      description: {
        story: '아이콘을 버튼 텍스트 왼쪽에 배치합니다. 생성, 추가 등의 액션에 적합합니다.',
      },
    },
  },
};

/**
 * 오른쪽 아이콘이 있는 버튼입니다.
 */
export const WithRightIcon: Story = {
  args: {
    children: 'Continue',
    rightIcon: <ArrowRight size={16} />,
  },
  parameters: {
    docs: {
      description: {
        story: '아이콘을 버튼 텍스트 오른쪽에 배치합니다. 다음 단계로 진행하는 액션에 적합합니다.',
      },
    },
  },
};

/**
 * 로딩 상태의 버튼입니다.
 */
export const Loading: Story = {
  args: {
    children: 'Saving...',
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: '비동기 작업 중일 때 표시되는 로딩 상태입니다. 스피너가 표시되고 버튼이 자동으로 비활성화됩니다.',
      },
    },
  },
};

/**
 * 비활성화된 버튼입니다.
 */
export const Disabled: Story = {
  args: {
    children: 'Cannot Submit',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: '버튼이 비활성화되어 클릭할 수 없는 상태입니다. 필수 필드가 채워지지 않았거나 권한이 없을 때 사용합니다.',
      },
    },
  },
};

/**
 * 전체 너비 버튼입니다.
 */
export const FullWidth: Story = {
  args: {
    children: 'Sign In',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '부모 컨테이너의 전체 너비를 차지하는 버튼입니다. 모달, 폼 등에서 사용합니다.',
      },
    },
  },
};

/**
 * 모든 Variant 비교 보기
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">Variants</h3>
        <div className="flex gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">Sizes</h3>
        <div className="flex items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">With Icons</h3>
        <div className="flex gap-3">
          <Button leftIcon={<Plus size={16} />}>Add</Button>
          <Button leftIcon={<Save size={16} />}>Save</Button>
          <Button leftIcon={<Download size={16} />} variant="secondary">Export</Button>
          <Button leftIcon={<Trash2 size={16} />} variant="danger">Delete</Button>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-3">States</h3>
        <div className="flex gap-3">
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '모든 버튼 variant, size, 상태를 한 눈에 비교할 수 있습니다.',
      },
    },
  },
};
