import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CreateMissionForm, CreateMissionInline, type CreateMissionFormData } from './CreateMissionForm';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

const meta: Meta<typeof CreateMissionForm> = {
  title: 'Mission/CreateMissionForm',
  component: CreateMissionForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
새로운 Mission을 생성하는 폼 컴포넌트입니다.

## 입력 필드
| 필드 | 필수 | 설명 |
|------|------|------|
| 제목 | ✓ | Mission의 이름 |
| 설명 | - | 목표와 범위 설명 (AI가 참고) |
| 우선순위 | ✓ | Critical, High, Medium, Low |
| 태그 | - | 분류용 태그 (복수 선택) |

## AI 자동 Todo 생성
Mission을 생성하면 AI가 설명을 분석하여 세부 Todo 항목들을
자동으로 생성합니다. 설명이 자세할수록 정확한 Todo가 생성됩니다.

## 변형
- **CreateMissionForm**: 전체 폼 (Modal 내부 사용)
- **CreateMissionInline**: 간단한 인라인 입력 (빠른 생성)

## 사용 예시
\`\`\`tsx
// 전체 폼
<CreateMissionForm
  onSubmit={(data) => createMission(data)}
  onCancel={() => closeModal()}
  isLoading={isCreating}
/>

// 인라인 폼
<CreateMissionInline
  onSubmit={(title) => quickCreate(title)}
  placeholder="새 Mission..."
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CreateMissionForm>;

/**
 * 기본 Mission 생성 폼입니다.
 */
export const Default: Story = {
  args: {
    onSubmit: (data) => console.log('Submit:', data),
    onCancel: () => console.log('Cancel'),
  },
};

/**
 * 로딩 중 상태입니다.
 */
export const Loading: Story = {
  args: {
    onSubmit: (data) => console.log('Submit:', data),
    onCancel: () => console.log('Cancel'),
    isLoading: true,
  },
};

/**
 * 기본 우선순위가 HIGH로 설정된 폼입니다.
 */
export const HighPriorityDefault: Story = {
  args: {
    onSubmit: (data) => console.log('Submit:', data),
    defaultPriority: 'HIGH',
  },
};

/**
 * 인터랙티브 데모입니다.
 */
export const Interactive: Story = {
  render: () => {
    const [submitted, setSubmitted] = useState<CreateMissionFormData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (data: CreateMissionFormData) => {
      setIsLoading(true);
      setTimeout(() => {
        setSubmitted(data);
        setIsLoading(false);
      }, 1500);
    };

    if (submitted) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-green-800 font-semibold mb-3">Mission 생성됨!</h3>
          <div className="text-sm text-green-700 space-y-2">
            <p><strong>제목:</strong> {submitted.title}</p>
            <p><strong>설명:</strong> {submitted.description || '(없음)'}</p>
            <p><strong>우선순위:</strong> {submitted.priority}</p>
            <p><strong>태그:</strong> {submitted.tags.length > 0 ? submitted.tags.join(', ') : '(없음)'}</p>
          </div>
          <button
            onClick={() => setSubmitted(null)}
            className="mt-4 text-sm text-green-600 hover:underline"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return (
      <CreateMissionForm
        onSubmit={handleSubmit}
        onCancel={() => alert('취소됨')}
        isLoading={isLoading}
      />
    );
  },
};

/**
 * Modal 내부에서 사용되는 폼입니다.
 */
export const InModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (data: CreateMissionFormData) => {
      setIsLoading(true);
      setTimeout(() => {
        console.log('Created:', data);
        setIsLoading(false);
        setIsOpen(false);
      }, 1000);
    };

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          새 Mission 생성
        </Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="새 Mission 생성"
          subtitle="MISSION"
        >
          <CreateMissionForm
            onSubmit={handleSubmit}
            onCancel={() => setIsOpen(false)}
            isLoading={isLoading}
          />
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal 내부에서 Mission 생성 폼을 사용하는 예시입니다.',
      },
    },
  },
};

// CreateMissionInline Stories
export const Inline: StoryObj<typeof CreateMissionInline> = {
  render: () => (
    <CreateMissionInline
      onSubmit={(title) => console.log('Quick create:', title)}
      onCancel={() => console.log('Cancel')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: '빠른 Mission 생성을 위한 인라인 폼입니다.',
      },
    },
  },
};

export const InlineLoading: StoryObj<typeof CreateMissionInline> = {
  render: () => (
    <CreateMissionInline
      onSubmit={() => {}}
      isLoading={true}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: '인라인 폼의 로딩 상태입니다.',
      },
    },
  },
};

export const InlineCustomPlaceholder: StoryObj<typeof CreateMissionInline> = {
  render: () => (
    <CreateMissionInline
      onSubmit={(title) => console.log('Create:', title)}
      placeholder="+ Add mission..."
    />
  ),
  parameters: {
    docs: {
      description: {
        story: '커스텀 placeholder가 적용된 인라인 폼입니다.',
      },
    },
  },
};

/**
 * 칸반 보드 하단에 표시되는 인라인 생성 폼입니다.
 */
export const InKanbanColumn: Story = {
  render: () => {
    const [showForm, setShowForm] = useState(false);

    return (
      <div className="bg-slate-100 rounded-lg p-4 w-72">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-600">Backlog</h3>
          <span className="text-xs text-slate-400">3</span>
        </div>

        {/* Placeholder cards */}
        <div className="space-y-2 mb-4">
          <div className="bg-white p-3 rounded border border-slate-200">
            <p className="text-sm text-slate-600">Mission Item 1</p>
          </div>
          <div className="bg-white p-3 rounded border border-slate-200">
            <p className="text-sm text-slate-600">Mission Item 2</p>
          </div>
        </div>

        {showForm ? (
          <div className="bg-white p-3 rounded border border-slate-200">
            <CreateMissionInline
              onSubmit={(title) => {
                console.log('New mission:', title);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
          >
            + 새 Mission 추가
          </button>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '칸반 컬럼 하단에서 인라인으로 Mission을 생성하는 패턴입니다.',
      },
    },
  },
};
