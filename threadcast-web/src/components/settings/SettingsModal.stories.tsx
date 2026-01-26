import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SettingsModal } from './SettingsModal';

const meta: Meta<typeof SettingsModal> = {
  title: 'Settings/SettingsModal',
  component: SettingsModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
설정 모달 컴포넌트입니다.

## 기능
- **언어 설정**: 한국어/영어 선택
- **테마 설정**: 라이트/다크/시스템 모드 선택

## 사용법
\`\`\`tsx
const [isOpen, setIsOpen] = useState(false);

<SettingsModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
\`\`\`

## 저장
- 설정은 자동으로 localStorage에 저장됩니다
- 페이지 새로고침 후에도 설정이 유지됩니다
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SettingsModal>;

// Interactive wrapper component
function SettingsModalWrapper() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        설정 열기
      </button>
      <SettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

export const Default: Story = {
  render: () => <SettingsModalWrapper />,
  parameters: {
    docs: {
      description: {
        story: '기본 설정 모달. 언어와 테마를 선택할 수 있습니다.',
      },
    },
  },
};

export const OpenState: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
};
