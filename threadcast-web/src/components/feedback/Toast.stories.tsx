import type { Meta, StoryObj } from '@storybook/react';
import { ToastContainer, useToast, SingleToast } from './Toast';
import { useState } from 'react';
import { Button } from '../common/Button';

const meta: Meta<typeof ToastContainer> = {
  title: 'Feedback/Toast',
  component: ToastContainer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
일시적인 알림 메시지를 표시하는 토스트 컴포넌트입니다.

## 구성 요소
- **ToastContainer**: 토스트들을 관리하고 렌더링
- **SingleToast**: 개별 토스트 (직접 제어용)
- **useToast**: 토스트 관리 훅

## 타입
- **success**: 성공 (초록색)
- **error**: 에러 (빨간색)
- **warning**: 경고 (노란색)
- **info**: 정보 (파란색)

## 위치 옵션
- top-right (기본값)
- top-left
- top-center
- bottom-right
- bottom-left
- bottom-center

## 주요 기능
- 자동 닫힘 (duration 설정)
- 수동 닫기 버튼
- 스택으로 여러 개 표시

## 사용 예시
\`\`\`tsx
const { success, error, toasts, dismissToast } = useToast();

// 토스트 표시
success('저장 완료', '변경사항이 저장되었습니다');
error('오류', '저장에 실패했습니다');

// 컨테이너 렌더링
<ToastContainer toasts={toasts} onDismiss={dismissToast} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToastContainer>;

export const AllTypes: Story = {
  render: () => {
    const { toasts, success, error, warning, info, dismissToast } = useToast();
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => success('Success', 'Operation completed successfully')}>
            Success
          </Button>
          <Button variant="danger" onClick={() => error('Error', 'Something went wrong')}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => warning('Warning', 'Please review your changes')}>
            Warning
          </Button>
          <Button variant="ghost" onClick={() => info('Info', 'New updates available')}>
            Info
          </Button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  },
};

export const Positions: Story = {
  render: () => {
    const [position, setPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'>('top-right');
    const { toasts, success, dismissToast } = useToast();

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {(['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'] as const).map((pos) => (
            <Button
              key={pos}
              variant={position === pos ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setPosition(pos)}
            >
              {pos}
            </Button>
          ))}
        </div>
        <Button onClick={() => success('Success', `Toast at ${position}`)}>
          Show Toast
        </Button>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} position={position} />
      </div>
    );
  },
};

export const MultipleToasts: Story = {
  render: () => {
    const { toasts, success, error, warning, info, dismissToast } = useToast();

    const showAll = () => {
      success('Mission Created', 'User Authentication has been created');
      setTimeout(() => error('Build Failed', 'Check the console for errors'), 200);
      setTimeout(() => warning('Low Priority', 'This task has low priority'), 400);
      setTimeout(() => info('Tip', 'Press Cmd+K to open quick actions'), 600);
    };

    return (
      <div>
        <Button onClick={showAll}>Show Multiple Toasts</Button>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  },
};

export const AutoDismiss: Story = {
  render: () => {
    const { toasts, addToast, dismissToast } = useToast();

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-500 mb-2">Toasts auto-dismiss after their duration</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => addToast('success', '2 seconds', 'Auto dismisses quickly', 2000)}>
            2s
          </Button>
          <Button variant="secondary" onClick={() => addToast('info', '5 seconds', 'Default duration', 5000)}>
            5s
          </Button>
          <Button variant="secondary" onClick={() => addToast('warning', 'Persistent', 'Click X to dismiss', 0)}>
            No auto-dismiss
          </Button>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  },
};

export const SingleToastExample: Story = {
  render: () => {
    const [isVisible, setIsVisible] = useState(false);
    const [type, setType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {(['success', 'error', 'warning', 'info'] as const).map((t) => (
            <Button
              key={t}
              variant={type === t ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setType(t)}
            >
              {t}
            </Button>
          ))}
        </div>
        <Button onClick={() => setIsVisible(true)}>Show Single Toast</Button>
        <SingleToast
          type={type}
          title={`${type.charAt(0).toUpperCase() + type.slice(1)} Toast`}
          message="This is a single toast notification"
          isVisible={isVisible}
          onClose={() => setIsVisible(false)}
        />
      </div>
    );
  },
};

export const RealWorldExample: Story = {
  render: () => {
    const { toasts, success, error, dismissToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 1500));
      setIsLoading(false);

      if (Math.random() > 0.5) {
        success('Saved', 'Your changes have been saved successfully');
      } else {
        error('Save Failed', 'Unable to save changes. Please try again.');
      }
    };

    return (
      <div className="flex flex-col gap-4 w-64">
        <p className="text-sm text-slate-500">Simulate save operation (50% success rate)</p>
        <Button onClick={handleSave} isLoading={isLoading}>
          Save Changes
        </Button>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  },
};

export const ToastTypes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <p className="text-sm text-slate-500 mb-4">Static preview of all toast types:</p>

      <div className="flex items-start gap-3 p-4 rounded-lg border bg-green-50 border-green-200">
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">Success</p>
          <p className="text-sm text-slate-600 mt-0.5">Operation completed successfully</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg border bg-red-50 border-red-200">
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">!</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">Error</p>
          <p className="text-sm text-slate-600 mt-0.5">Something went wrong</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg border bg-amber-50 border-amber-200">
        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs">⚠</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">Warning</p>
          <p className="text-sm text-slate-600 mt-0.5">Please review your changes</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg border bg-blue-50 border-blue-200">
        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">i</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">Info</p>
          <p className="text-sm text-slate-600 mt-0.5">New updates available</p>
        </div>
      </div>
    </div>
  ),
};
