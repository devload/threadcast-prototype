import type { Meta, StoryObj } from '@storybook/react';
import { AIQuestionPanel } from './AIQuestionPanel';
import { useAIQuestionStore } from '../../stores/aiQuestionStore';
import { useEffect } from 'react';

const meta: Meta<typeof AIQuestionPanel> = {
  title: 'AI/AIQuestionPanel',
  component: AIQuestionPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
AI 질문 패널 컴포넌트입니다.

## 기능
- 왼쪽 슬라이드 패널로 AI 질문 목록 표시
- 각 질문에 대한 답변 옵션 제공
- 질문 건너뛰기 기능
- 특정 Todo의 질문만 필터링 표시 가능

## 사용법
\`\`\`tsx
import { AIQuestionPanel } from '@/components/ai/AIQuestionPanel';
import { useAIQuestionStore } from '@/stores/aiQuestionStore';

// 전체 질문 표시
const { openPanel } = useAIQuestionStore();
openPanel();

// 특정 Todo의 질문만 표시
const { openPanelForTodo } = useAIQuestionStore();
openPanelForTodo('todo-123');

// 패널 컴포넌트 렌더링
<AIQuestionPanel />
\`\`\`

## 상태 관리
- Zustand store (aiQuestionStore)를 통해 상태 관리
- isPanelOpen: 패널 열림/닫힘 상태
- filteredTodoId: 특정 Todo로 필터링 시 해당 ID
- questions: AI 질문 목록
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AIQuestionPanel>;

// Wrapper to control the panel state
function PanelWrapper({ filteredTodoId }: { filteredTodoId?: string }) {
  const { openPanel, openPanelForTodo, closePanel } = useAIQuestionStore();

  useEffect(() => {
    if (filteredTodoId) {
      openPanelForTodo(filteredTodoId);
    } else {
      openPanel();
    }
    return () => closePanel();
  }, [filteredTodoId, openPanel, openPanelForTodo, closePanel]);

  return <AIQuestionPanel />;
}

export const Default: Story = {
  render: () => <PanelWrapper />,
  parameters: {
    docs: {
      description: {
        story: '모든 AI 질문을 표시하는 기본 패널 상태입니다.',
      },
    },
  },
};

export const FilteredByTodo: Story = {
  render: () => <PanelWrapper filteredTodoId="todo-42-3" />,
  parameters: {
    docs: {
      description: {
        story: '특정 Todo의 질문만 필터링하여 표시합니다. Todo 카드에서 AI 질문 배지를 클릭하면 이 상태로 열립니다.',
      },
    },
  },
};

// Interactive demo
function InteractiveDemo() {
  const { openPanel, openPanelForTodo, isPanelOpen } = useAIQuestionStore();

  return (
    <div className="p-8">
      <h2 className="text-lg font-semibold mb-4">AI Question Panel Demo</h2>
      <div className="flex gap-4 mb-8">
        <button
          onClick={openPanel}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          모든 질문 보기
        </button>
        <button
          onClick={() => openPanelForTodo('todo-42-3')}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
        >
          특정 Todo 질문만 보기
        </button>
      </div>
      <p className="text-sm text-slate-500">
        패널 상태: {isPanelOpen ? '열림' : '닫힘'}
      </p>
      <AIQuestionPanel />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story: '버튼을 클릭하여 패널을 열고 닫을 수 있는 인터랙티브 데모입니다.',
      },
    },
  },
};
