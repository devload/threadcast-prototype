import type { Meta, StoryObj } from '@storybook/react';
import { Select, Checkbox, RadioGroup } from './Select';
import { useState } from 'react';

const meta: Meta<typeof Select> = {
  title: 'Form/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
선택 입력 컴포넌트들입니다.

## 구성 요소
- **Select**: 드롭다운 선택 (단일 선택)
- **Checkbox**: 체크박스 (다중 선택, 불리언)
- **RadioGroup**: 라디오 버튼 그룹 (단일 선택)

## Select
- 3가지 크기 (sm, md, lg)
- 라벨, 힌트, 에러 상태 지원
- 개별 옵션 비활성화 가능

## Checkbox
- 설명 텍스트 지원
- 3가지 크기
- 그룹으로 묶어서 다중 선택 UI 구현

## RadioGroup
- 세로/가로 방향 지원
- 옵션별 설명 텍스트
- 에러 상태 표시

## 사용 예시
\`\`\`tsx
<Select
  label="우선순위"
  options={[
    { value: 'HIGH', label: '높음' },
    { value: 'MEDIUM', label: '보통' },
    { value: 'LOW', label: '낮음' },
  ]}
  placeholder="선택하세요"
/>

<Checkbox
  label="알림 수신"
  description="이메일로 알림을 받습니다"
/>

<RadioGroup
  label="빈도"
  options={frequencyOptions}
  value={selected}
  onChange={setSelected}
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
type Story = StoryObj<typeof Select>;

const priorityOptions = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const statusOptions = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'THREADING', label: 'Threading' },
  { value: 'WOVEN', label: 'Woven' },
  { value: 'ARCHIVED', label: 'Archived', disabled: true },
];

export const Default: Story = {
  args: {
    options: priorityOptions,
    placeholder: 'Select priority',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Priority',
    options: priorityOptions,
    placeholder: 'Select priority',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Status',
    options: statusOptions,
    placeholder: 'Select status',
    hint: 'Choose the current status of this item',
  },
};

export const WithError: Story = {
  args: {
    label: 'Priority',
    options: priorityOptions,
    placeholder: 'Select priority',
    error: 'Please select a priority',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Status',
    options: statusOptions,
    defaultValue: 'THREADING',
    disabled: true,
  },
};

export const WithDisabledOptions: Story = {
  args: {
    label: 'Status',
    options: statusOptions,
    placeholder: 'Select status',
    hint: 'Some options may be disabled',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Select size="sm" options={priorityOptions} placeholder="Small" label="Small" />
      <Select size="md" options={priorityOptions} placeholder="Medium" label="Medium" />
      <Select size="lg" options={priorityOptions} placeholder="Large" label="Large" />
    </div>
  ),
};

// Checkbox Stories
export const CheckboxDefault: StoryObj<typeof Checkbox> = {
  render: () => <Checkbox label="Accept terms and conditions" />,
};

export const CheckboxWithDescription: StoryObj<typeof Checkbox> = {
  render: () => (
    <Checkbox
      label="Email notifications"
      description="Receive email when something happens"
    />
  ),
};

export const CheckboxChecked: StoryObj<typeof Checkbox> = {
  render: () => <Checkbox label="Checked by default" defaultChecked />,
};

export const CheckboxDisabled: StoryObj<typeof Checkbox> = {
  render: () => (
    <div className="space-y-3">
      <Checkbox label="Disabled unchecked" disabled />
      <Checkbox label="Disabled checked" disabled defaultChecked />
    </div>
  ),
};

export const CheckboxWithError: StoryObj<typeof Checkbox> = {
  render: () => (
    <Checkbox
      label="Accept terms"
      error="You must accept the terms to continue"
    />
  ),
};

export const CheckboxSizes: StoryObj<typeof Checkbox> = {
  render: () => (
    <div className="space-y-3">
      <Checkbox size="sm" label="Small checkbox" />
      <Checkbox size="md" label="Medium checkbox" />
      <Checkbox size="lg" label="Large checkbox" />
    </div>
  ),
};

export const CheckboxGroup: StoryObj<typeof Checkbox> = {
  render: () => (
    <div className="space-y-3">
      <span className="text-sm font-medium text-slate-700">Notification preferences</span>
      <Checkbox label="Email" description="Get notified via email" />
      <Checkbox label="Push" description="Get push notifications" defaultChecked />
      <Checkbox label="SMS" description="Get text messages" />
    </div>
  ),
};

// RadioGroup Stories
export const RadioGroupDefault: StoryObj<typeof RadioGroup> = {
  render: () => {
    const [value, setValue] = useState('MEDIUM');
    return (
      <RadioGroup
        name="priority"
        label="Priority"
        options={priorityOptions}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const RadioGroupHorizontal: StoryObj<typeof RadioGroup> = {
  render: () => {
    const [value, setValue] = useState('MEDIUM');
    return (
      <RadioGroup
        name="priority-h"
        label="Priority"
        options={priorityOptions}
        value={value}
        onChange={setValue}
        orientation="horizontal"
      />
    );
  },
};

export const RadioGroupWithDescriptions: StoryObj<typeof RadioGroup> = {
  render: () => {
    const [value, setValue] = useState('daily');
    return (
      <RadioGroup
        name="frequency"
        label="Email frequency"
        options={[
          { value: 'instant', label: 'Instant', description: 'Get notified immediately' },
          { value: 'daily', label: 'Daily digest', description: 'Get a summary once per day' },
          { value: 'weekly', label: 'Weekly digest', description: 'Get a summary once per week' },
          { value: 'never', label: 'Never', description: 'Do not send any emails' },
        ]}
        value={value}
        onChange={setValue}
      />
    );
  },
};

export const RadioGroupWithError: StoryObj<typeof RadioGroup> = {
  render: () => (
    <RadioGroup
      name="required"
      label="Select an option"
      options={[
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
        { value: 'c', label: 'Option C' },
      ]}
      error="Please select an option"
    />
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        label="Priority"
        options={priorityOptions}
        placeholder="Select priority"
      />
      <Select
        label="Status"
        options={statusOptions}
        placeholder="Select status"
      />
      <div className="pt-2">
        <Checkbox
          label="Mark as urgent"
          description="This will highlight the item"
        />
      </div>
    </div>
  ),
};
