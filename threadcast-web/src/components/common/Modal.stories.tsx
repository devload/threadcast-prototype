import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal, SlidePanel } from './Modal';
import { Button } from './Button';
import { Play } from 'lucide-react';

/**
 * Modal 컴포넌트는 사용자의 주의를 끌어야 하는 콘텐츠나 액션을 표시합니다.
 *
 * ## 사용 사례
 * - **Mission Summary**: Mission 상세 정보 표시
 * - **Create Mission**: 새 Mission 생성 폼
 * - **Confirmation**: 삭제 등 중요한 액션 확인
 *
 * ## 특징
 * - ESC 키로 닫기
 * - 오버레이 클릭으로 닫기
 * - 부드러운 애니메이션 (fade + slide up)
 * - 스크롤 가능한 콘텐츠 영역
 */
const meta: Meta<typeof Modal> = {
  title: 'Common/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
ThreadCast의 모달 컴포넌트입니다. 사용자의 주의를 끌어야 하는 콘텐츠나 액션을 표시할 때 사용합니다.

### Import
\`\`\`tsx
import { Modal, SlidePanel } from '@/components/common/Modal';
\`\`\`

### 기본 사용법
\`\`\`tsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Mission Details"
>
  <p>Modal content here</p>
</Modal>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: '모달의 열림/닫힘 상태를 제어합니다.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '모달의 최대 너비를 결정합니다.',
      table: {
        type: { summary: 'sm | md | lg | xl' },
        defaultValue: { summary: 'lg' },
      },
    },
    title: {
      control: 'text',
      description: '모달 헤더에 표시될 제목입니다.',
    },
    subtitle: {
      control: 'text',
      description: '제목 위에 표시될 작은 서브타이틀입니다.',
    },
    showCloseButton: {
      control: 'boolean',
      description: '닫기 버튼 표시 여부를 결정합니다.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

/**
 * 기본 모달입니다.
 */
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Mission Details"
          subtitle="MISSION-1234"
        >
          <div className="space-y-4">
            <p className="text-slate-600">
              이것은 기본 모달의 콘텐츠 영역입니다. 모달은 사용자의 주의를 끌어야 하는
              중요한 정보나 액션을 표시할 때 사용합니다.
            </p>
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">Progress</h4>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-gradient-to-r from-amber-500 to-green-500 rounded-full" />
              </div>
              <p className="text-sm text-slate-500 mt-2">3/5 todos completed</p>
            </div>
          </div>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '기본 모달입니다. 제목과 서브타이틀을 포함하고, ESC 키나 오버레이 클릭으로 닫을 수 있습니다.',
      },
    },
  },
};

/**
 * Footer가 있는 모달입니다.
 */
export const WithFooter: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal with Footer</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Start Weaving?"
          footer={
            <>
              <span className="text-xs text-slate-400">Press ESC to close</span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" leftIcon={<Play size={16} />}>
                  Start Weaving
                </Button>
              </div>
            </>
          }
        >
          <p className="text-slate-600">
            AI가 자동으로 Todo를 생성하고 작업을 시작합니다.
            진행 중에도 언제든 중단할 수 있습니다.
          </p>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Footer 영역에 버튼이나 힌트 텍스트를 추가할 수 있습니다.',
      },
    },
  },
};

/**
 * 작은 크기의 모달입니다.
 */
export const SmallSize: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Small Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Delete Mission?"
          size="sm"
          footer={
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger">Delete</Button>
            </div>
          }
        >
          <p className="text-slate-600">
            이 Mission과 모든 관련 Todo가 삭제됩니다.
            이 작업은 되돌릴 수 없습니다.
          </p>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '확인 다이얼로그 등 짧은 콘텐츠에는 작은 크기의 모달을 사용합니다.',
      },
    },
  },
};

/**
 * 스크롤 가능한 긴 콘텐츠의 모달입니다.
 */
export const LongContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Long Content Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Todo Threads"
          subtitle="MISSION-1234"
          size="xl"
        >
          <div className="space-y-3">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${i < 3 ? 'bg-green-500' : i === 3 ? 'bg-amber-500' : 'bg-slate-300'}`} />
                  <span className="text-xs font-semibold text-slate-400">TODO-{1234 + i}</span>
                </div>
                <h4 className="font-medium text-slate-900">Todo Item {i + 1}</h4>
                <p className="text-sm text-slate-500">This is a description for todo item {i + 1}</p>
              </div>
            ))}
          </div>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '콘텐츠가 길면 자동으로 스크롤됩니다. 모달의 최대 높이는 85vh로 제한됩니다.',
      },
    },
  },
};

// SlidePanel Stories

/**
 * 우측에서 슬라이드되는 패널입니다.
 */
export const RightSlidePanel: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Right Panel</Button>
        <SlidePanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Todo Details"
          subtitle="TODO-1234"
          position="right"
          footer={
            <div className="flex gap-2 w-full">
              <Button variant="primary" className="flex-1">Mark Complete</Button>
              <Button variant="secondary" className="flex-1">View Timeline</Button>
            </div>
          }
        >
          <div className="p-5 space-y-4">
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
                🧵 Threading
              </span>
            </div>
            <p className="text-sm text-slate-600">
              API 엔드포인트 구현을 위한 Todo입니다.
              JWT 기반 인증 시스템을 구현합니다.
            </p>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step Progress (3/6)
              </h4>
              {['Analysis', 'Design', 'Implementation', 'Verification', 'Review', 'Integration'].map((step, i) => (
                <div key={step} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  i < 2 ? 'bg-green-50 border-green-200' :
                  i === 2 ? 'bg-amber-50 border-amber-300' :
                  'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    i < 2 ? 'bg-green-500 text-white' :
                    i === 2 ? 'bg-amber-500 text-white' :
                    'bg-slate-300 text-slate-600'
                  }`}>
                    {i < 2 ? '✓' : i + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-900">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </SlidePanel>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'SlidePanel은 화면 측면에서 슬라이드되어 나타나는 패널입니다. Todo 상세 보기 등에 사용합니다.',
      },
    },
  },
};

/**
 * 좌측에서 슬라이드되는 패널입니다.
 */
export const LeftSlidePanel: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Left Panel (Questions)</Button>
        <SlidePanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="AI Questions"
          subtitle="3 pending questions"
          position="left"
        >
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <select className="text-sm border rounded-lg px-3 py-2">
                <option>All Questions</option>
                <option>Urgent</option>
                <option>High</option>
              </select>
              <Button variant="ghost" size="sm">Batch Answer</Button>
            </div>

            {[
              { priority: 'urgent', question: 'API 응답 형식을 어떻게 설정할까요?' },
              { priority: 'high', question: '에러 핸들링 방식을 선택해주세요' },
              { priority: 'medium', question: '테스트 커버리지 목표를 설정해주세요' },
            ].map((q, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${
                    q.priority === 'urgent' ? 'bg-red-500' :
                    q.priority === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-xs font-semibold text-slate-400">TODO-1234</span>
                </div>
                <p className="text-sm text-slate-900 font-medium mb-3">{q.question}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1">Option A</Button>
                  <Button size="sm" variant="secondary" className="flex-1">Option B</Button>
                </div>
              </div>
            ))}
          </div>
        </SlidePanel>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '좌측에서 슬라이드되는 패널입니다. AI 질문 패널 등에 사용합니다.',
      },
    },
  },
};
