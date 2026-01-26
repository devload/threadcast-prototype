import type { Meta, StoryObj } from '@storybook/react';
import { Input, TextArea } from './Input';
import { Search, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const meta: Meta<typeof Input> = {
  title: 'Form/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
텍스트 입력 필드 컴포넌트입니다.

## 구성 요소
- **Input**: 단일 행 텍스트 입력
- **TextArea**: 여러 행 텍스트 입력

## 주요 기능
- 3가지 크기 (sm, md, lg)
- 라벨 및 힌트 텍스트
- 에러 상태 표시
- 좌/우 아이콘 슬롯
- 비활성화 상태

## 아이콘 활용 예시
- 검색: 좌측 돋보기 아이콘
- 이메일: 우측 메일 아이콘
- 비밀번호: 좌측 자물쇠, 우측 눈 아이콘 (보기 토글)

## 사용 예시
\`\`\`tsx
<Input
  label="이메일"
  placeholder="you@example.com"
  leftIcon={<Mail size={18} />}
  error="유효한 이메일을 입력하세요"
/>

<TextArea
  label="설명"
  placeholder="내용을 입력하세요..."
  hint="마크다운을 지원합니다"
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Username',
    placeholder: 'johndoe',
    hint: 'This will be your public display name',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    defaultValue: 'invalid-email',
    error: 'Please enter a valid email address',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
    defaultValue: 'Disabled value',
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    leftIcon: <Search size={18} />,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    rightIcon: <Mail size={18} />,
  },
};

export const PasswordInput: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter password"
        leftIcon={<Lock size={18} />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Input size="sm" placeholder="Small input" label="Small" />
      <Input size="md" placeholder="Medium input" label="Medium" />
      <Input size="lg" placeholder="Large input" label="Large" />
    </div>
  ),
};

export const FullWidth: Story = {
  args: {
    label: 'Full Width',
    placeholder: 'This input takes full width',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

// TextArea Stories
export const TextAreaDefault: StoryObj<typeof TextArea> = {
  render: () => (
    <TextArea
      label="Description"
      placeholder="Enter a description..."
    />
  ),
};

export const TextAreaWithHint: StoryObj<typeof TextArea> = {
  render: () => (
    <TextArea
      label="Notes"
      placeholder="Add notes..."
      hint="Markdown is supported"
    />
  ),
};

export const TextAreaWithError: StoryObj<typeof TextArea> = {
  render: () => (
    <TextArea
      label="Comments"
      placeholder="Enter comments..."
      error="This field is required"
    />
  ),
};

export const TextAreaDisabled: StoryObj<typeof TextArea> = {
  render: () => (
    <TextArea
      label="Read Only"
      defaultValue="This content cannot be edited"
      disabled
    />
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Mission Title"
        placeholder="Enter mission title"
        leftIcon={<span className="text-lg">📋</span>}
      />
      <Input
        label="Priority"
        placeholder="Select priority"
      />
      <TextArea
        label="Description"
        placeholder="Describe the mission..."
        hint="Be as detailed as possible"
      />
      <div className="flex gap-2 pt-2">
        <button className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">
          Cancel
        </button>
        <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          Create
        </button>
      </div>
    </div>
  ),
};
