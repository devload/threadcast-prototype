import type { Meta, StoryObj } from '@storybook/react';
import { Modal, ConfirmDialog, Drawer } from './Modal';
import { useState } from 'react';
import { Button } from '../common/Button';
import { Input, TextArea } from '../form/Input';
import { Select } from '../form/Select';

const meta: Meta<typeof Modal> = {
  title: 'Feedback/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
모달 및 Drawer 컴포넌트입니다.

## 구성 요소
- **Modal**: 중앙 팝업 모달
- **ConfirmDialog**: 확인/취소 다이얼로그
- **Drawer**: 측면 슬라이드 패널

## Modal 크기 (size)
- **sm**: 400px - 간단한 확인
- **md**: 500px - 기본
- **lg**: 600px - 폼이 있는 모달
- **xl**: 800px - 복잡한 콘텐츠
- **full**: 전체 화면

## Modal 옵션
- **showCloseButton**: X 버튼 표시
- **closeOnOverlayClick**: 배경 클릭 시 닫힘
- **closeOnEscape**: ESC 키로 닫힘

## ConfirmDialog
확인/취소가 필요한 액션에 사용합니다.
- **variant**: 'default' | 'danger'
- **isLoading**: 확인 버튼 로딩 상태

## Drawer
측면에서 슬라이드되는 패널입니다.
- **position**: 'left' | 'right'
- **size**: 'sm' | 'md' | 'lg'

## 사용 예시
\`\`\`tsx
<Modal isOpen={isOpen} onClose={handleClose} title="제목">
  콘텐츠
</Modal>

<ConfirmDialog
  isOpen={isOpen}
  title="삭제하시겠습니까?"
  message="되돌릴 수 없습니다."
  variant="danger"
  onConfirm={handleDelete}
  onClose={handleClose}
/>

<Drawer isOpen={isOpen} position="right" title="상세">
  상세 내용
</Drawer>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Modal Title"
          description="This is a description of the modal"
        >
          <p className="text-slate-600">
            This is the modal content. You can put anything here.
          </p>
        </Modal>
      </>
    );
  },
};

export const WithFooter: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Create New Mission"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>Create</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Title" placeholder="Enter mission title" fullWidth />
            <TextArea label="Description" placeholder="Describe the mission" fullWidth />
            <Select
              label="Priority"
              options={[
                { value: 'HIGH', label: 'High' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'LOW', label: 'Low' },
              ]}
              placeholder="Select priority"
              fullWidth
            />
          </div>
        </Modal>
      </>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl' | 'full' | null>(null);
    return (
      <div className="flex gap-2">
        {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((s) => (
          <Button key={s} variant="secondary" onClick={() => setSize(s)}>
            {s}
          </Button>
        ))}
        <Modal
          isOpen={!!size}
          onClose={() => setSize(null)}
          title={`Size: ${size}`}
          size={size || 'md'}
        >
          <p className="text-slate-600">
            This modal has size "{size}". Try different sizes to see how they look.
          </p>
        </Modal>
      </div>
    );
  },
};

export const NoCloseButton: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Required Action"
          showCloseButton={false}
          closeOnOverlayClick={false}
          closeOnEscape={false}
          footer={
            <Button onClick={() => setIsOpen(false)}>I understand</Button>
          }
        >
          <p className="text-slate-600">
            This modal cannot be dismissed by clicking outside or pressing Escape.
            You must click the button below.
          </p>
        </Modal>
      </>
    );
  },
};

// ConfirmDialog Stories
export const ConfirmDialogDefault: StoryObj<typeof ConfirmDialog> = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Show Confirm</Button>
        <ConfirmDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            alert('Confirmed!');
            setIsOpen(false);
          }}
          title="Confirm Action"
          message="Are you sure you want to proceed with this action?"
        />
      </>
    );
  },
};

export const ConfirmDialogDanger: StoryObj<typeof ConfirmDialog> = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>
        <ConfirmDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            alert('Deleted!');
            setIsOpen(false);
          }}
          title="Delete Mission"
          message="This action cannot be undone. All todos and progress will be permanently deleted."
          confirmLabel="Delete"
          cancelLabel="Keep"
          variant="danger"
        />
      </>
    );
  },
};

export const ConfirmDialogLoading: StoryObj<typeof ConfirmDialog> = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = () => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsOpen(false);
      }, 2000);
    };

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Show Confirm</Button>
        <ConfirmDialog
          isOpen={isOpen}
          onClose={() => !isLoading && setIsOpen(false)}
          onConfirm={handleConfirm}
          title="Save Changes"
          message="Do you want to save your changes?"
          confirmLabel="Save"
          isLoading={isLoading}
        />
      </>
    );
  },
};

// Drawer Stories
export const DrawerRight: StoryObj<typeof Drawer> = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Drawer</Button>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Todo Details"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-500">Title</h3>
              <p className="mt-1 text-slate-900">Implement JWT Token Validation</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Status</h3>
              <p className="mt-1 text-amber-600">Threading</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Progress</h3>
              <div className="mt-1 w-full bg-slate-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
          </div>
        </Drawer>
      </>
    );
  },
};

export const DrawerLeft: StoryObj<typeof Drawer> = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Left Drawer</Button>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Navigation"
          position="left"
          size="sm"
        >
          <nav className="space-y-1">
            {['Home', 'Missions', 'Todos', 'Timeline', 'Settings'].map((item) => (
              <button
                key={item}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 rounded-lg"
              >
                {item}
              </button>
            ))}
          </nav>
        </Drawer>
      </>
    );
  },
};

export const DrawerSizes: StoryObj<typeof Drawer> = {
  render: () => {
    const [size, setSize] = useState<'sm' | 'md' | 'lg' | null>(null);
    return (
      <div className="flex gap-2">
        {(['sm', 'md', 'lg'] as const).map((s) => (
          <Button key={s} variant="secondary" onClick={() => setSize(s)}>
            {s}
          </Button>
        ))}
        <Drawer
          isOpen={!!size}
          onClose={() => setSize(null)}
          title={`Size: ${size}`}
          size={size || 'md'}
        >
          <p className="text-slate-600">
            This drawer has size "{size}".
          </p>
        </Drawer>
      </div>
    );
  },
};
