import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown, SelectDropdown, MenuDropdown } from './Dropdown';
import { Button } from './Button';
import { useState } from 'react';
import { MoreHorizontal, Edit, Copy, Archive, Trash2, Settings, User, LogOut, HelpCircle } from 'lucide-react';

const meta: Meta<typeof Dropdown> = {
  title: 'Common/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
드롭다운 메뉴 컴포넌트입니다.

## 구성 요소
- **Dropdown**: 기본 드롭다운 메뉴
- **SelectDropdown**: 선택용 드롭다운 (값 선택)
- **MenuDropdown**: 섹션으로 구분된 메뉴

## Dropdown 기능
- 커스텀 트리거 (버튼, 아이콘 등)
- 아이콘 포함 항목
- 비활성화 항목
- 위험 항목 (danger: 빨간색)
- 좌/우 정렬 옵션

## SelectDropdown 기능
- 값 선택 UI
- placeholder 지원
- 3가지 크기 (sm, md, lg)
- fullWidth 옵션
- 비활성화 상태

## MenuDropdown 기능
- 섹션으로 그룹화
- 섹션 라벨
- 구분선 자동 생성

## 사용 예시
\`\`\`tsx
<Dropdown
  trigger={<Button>Options</Button>}
  items={[
    { label: 'Edit', value: 'edit', icon: <Edit /> },
    { label: 'Delete', value: 'delete', danger: true },
  ]}
  onSelect={(value) => handleAction(value)}
/>

<SelectDropdown
  value={selected}
  options={priorityOptions}
  onChange={setSelected}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  render: () => (
    <Dropdown
      trigger={<Button variant="secondary">Options</Button>}
      items={[
        { label: 'Edit', value: 'edit' },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Archive', value: 'archive' },
        { label: 'Delete', value: 'delete', danger: true },
      ]}
      onSelect={(value) => alert(`Selected: ${value}`)}
    />
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Dropdown
      trigger={<Button variant="secondary">Actions</Button>}
      items={[
        { label: 'Edit', value: 'edit', icon: <Edit size={16} /> },
        { label: 'Copy', value: 'copy', icon: <Copy size={16} /> },
        { label: 'Archive', value: 'archive', icon: <Archive size={16} /> },
        { label: 'Delete', value: 'delete', icon: <Trash2 size={16} />, danger: true },
      ]}
      onSelect={(value) => alert(`Selected: ${value}`)}
    />
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <Dropdown
      trigger={<Button variant="secondary">Options</Button>}
      items={[
        { label: 'Edit', value: 'edit' },
        { label: 'Copy', value: 'copy' },
        { label: 'Archive', value: 'archive', disabled: true },
        { label: 'Delete', value: 'delete', danger: true },
      ]}
      onSelect={(value) => alert(`Selected: ${value}`)}
    />
  ),
};

export const IconTrigger: Story = {
  render: () => (
    <Dropdown
      trigger={
        <button className="p-2 hover:bg-slate-100 rounded-lg">
          <MoreHorizontal size={20} className="text-slate-500" />
        </button>
      }
      items={[
        { label: 'Edit', value: 'edit', icon: <Edit size={16} /> },
        { label: 'Duplicate', value: 'duplicate', icon: <Copy size={16} /> },
        { label: 'Delete', value: 'delete', icon: <Trash2 size={16} />, danger: true },
      ]}
      onSelect={(value) => alert(`Selected: ${value}`)}
      align="right"
    />
  ),
};

export const RightAligned: Story = {
  render: () => (
    <div className="flex justify-end w-64">
      <Dropdown
        trigger={<Button variant="secondary">Right Aligned</Button>}
        items={[
          { label: 'Option 1', value: '1' },
          { label: 'Option 2', value: '2' },
          { label: 'Option 3', value: '3' },
        ]}
        onSelect={(value) => alert(`Selected: ${value}`)}
        align="right"
      />
    </div>
  ),
};

// SelectDropdown Stories
export const SelectDefault: StoryObj<typeof SelectDropdown> = {
  render: () => {
    const [value, setValue] = useState<string>('');
    return (
      <SelectDropdown
        value={value}
        placeholder="Select priority"
        options={[
          { label: 'Critical', value: 'CRITICAL' },
          { label: 'High', value: 'HIGH' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'Low', value: 'LOW' },
        ]}
        onChange={setValue}
      />
    );
  },
};

export const SelectWithValue: StoryObj<typeof SelectDropdown> = {
  render: () => {
    const [value, setValue] = useState('MEDIUM');
    return (
      <SelectDropdown
        value={value}
        options={[
          { label: 'Critical', value: 'CRITICAL' },
          { label: 'High', value: 'HIGH' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'Low', value: 'LOW' },
        ]}
        onChange={setValue}
      />
    );
  },
};

export const SelectSizes: StoryObj<typeof SelectDropdown> = {
  render: () => {
    const [value, setValue] = useState('MEDIUM');
    return (
      <div className="space-y-4">
        <SelectDropdown
          value={value}
          options={[
            { label: 'Critical', value: 'CRITICAL' },
            { label: 'High', value: 'HIGH' },
            { label: 'Medium', value: 'MEDIUM' },
          ]}
          onChange={setValue}
          size="sm"
        />
        <SelectDropdown
          value={value}
          options={[
            { label: 'Critical', value: 'CRITICAL' },
            { label: 'High', value: 'HIGH' },
            { label: 'Medium', value: 'MEDIUM' },
          ]}
          onChange={setValue}
          size="md"
        />
        <SelectDropdown
          value={value}
          options={[
            { label: 'Critical', value: 'CRITICAL' },
            { label: 'High', value: 'HIGH' },
            { label: 'Medium', value: 'MEDIUM' },
          ]}
          onChange={setValue}
          size="lg"
        />
      </div>
    );
  },
};

export const SelectFullWidth: StoryObj<typeof SelectDropdown> = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-64">
        <SelectDropdown
          value={value}
          placeholder="Select status"
          options={[
            { label: 'Backlog', value: 'BACKLOG' },
            { label: 'Threading', value: 'THREADING' },
            { label: 'Woven', value: 'WOVEN' },
            { label: 'Archived', value: 'ARCHIVED', disabled: true },
          ]}
          onChange={setValue}
          fullWidth
        />
      </div>
    );
  },
};

export const SelectDisabled: StoryObj<typeof SelectDropdown> = {
  render: () => (
    <SelectDropdown
      value="MEDIUM"
      options={[
        { label: 'Critical', value: 'CRITICAL' },
        { label: 'High', value: 'HIGH' },
        { label: 'Medium', value: 'MEDIUM' },
      ]}
      onChange={() => {}}
      disabled
    />
  ),
};

// MenuDropdown Stories
export const MenuDefault: StoryObj<typeof MenuDropdown> = {
  render: () => (
    <MenuDropdown
      trigger={<Button variant="secondary">Menu</Button>}
      sections={[
        {
          items: [
            { label: 'Edit', value: 'edit', icon: <Edit size={16} /> },
            { label: 'Duplicate', value: 'duplicate', icon: <Copy size={16} /> },
          ],
        },
        {
          items: [
            { label: 'Archive', value: 'archive', icon: <Archive size={16} /> },
            { label: 'Delete', value: 'delete', icon: <Trash2 size={16} />, danger: true },
          ],
        },
      ]}
      onSelect={(value) => alert(`Selected: ${value}`)}
    />
  ),
};

export const MenuWithLabels: StoryObj<typeof MenuDropdown> = {
  render: () => (
    <MenuDropdown
      trigger={<Button variant="secondary">Account</Button>}
      sections={[
        {
          label: 'Account',
          items: [
            { label: 'Profile', value: 'profile', icon: <User size={16} /> },
            { label: 'Settings', value: 'settings', icon: <Settings size={16} /> },
          ],
        },
        {
          label: 'Support',
          items: [
            { label: 'Help Center', value: 'help', icon: <HelpCircle size={16} /> },
          ],
        },
        {
          items: [
            { label: 'Log out', value: 'logout', icon: <LogOut size={16} />, danger: true },
          ],
        },
      ]}
      onSelect={(value) => alert(`Selected: ${value}`)}
    />
  ),
};

export const InCardContext: Story = {
  render: () => (
    <div className="w-72 p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-slate-900">Mission Title</h3>
          <p className="text-sm text-slate-500 mt-1">Description here</p>
        </div>
        <Dropdown
          trigger={
            <button className="p-1 hover:bg-slate-100 rounded">
              <MoreHorizontal size={16} className="text-slate-400" />
            </button>
          }
          items={[
            { label: 'Edit', value: 'edit', icon: <Edit size={16} /> },
            { label: 'Archive', value: 'archive', icon: <Archive size={16} /> },
            { label: 'Delete', value: 'delete', icon: <Trash2 size={16} />, danger: true },
          ]}
          onSelect={(value) => alert(`Selected: ${value}`)}
          align="right"
        />
      </div>
    </div>
  ),
};
