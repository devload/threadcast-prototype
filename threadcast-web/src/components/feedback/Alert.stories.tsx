import type { Meta, StoryObj } from '@storybook/react';
import { Alert, Banner } from './Alert';
import { useState } from 'react';

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
정적인 알림 메시지를 표시하는 컴포넌트입니다.

## 구성 요소
- **Alert**: 인라인 알림 박스
- **Banner**: 전체 너비 배너 알림

## 타입
- **success**: 성공 메시지 (초록색)
- **error**: 에러 메시지 (빨간색)
- **warning**: 경고 메시지 (노란색)
- **info**: 정보 메시지 (파란색)

## Alert 기능
- 제목 + 내용 구조
- 아이콘 표시/숨김
- 닫기 버튼 (dismissible)

## Banner 기능
- 전체 너비 레이아웃
- 액션 버튼 추가 가능
- 닫기 버튼

## Alert vs Toast 차이
- **Alert**: 페이지에 고정 표시, 사용자가 명시적으로 닫음
- **Toast**: 일시적 표시, 자동으로 사라짐

## 사용 예시
\`\`\`tsx
<Alert type="warning" title="주의" dismissible onDismiss={handleDismiss}>
  5분 후 세션이 만료됩니다.
</Alert>

<Banner
  type="info"
  action={{ label: '업데이트', onClick: handleUpdate }}
>
  새 버전이 있습니다.
</Banner>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Success: Story = {
  args: {
    type: 'success',
    title: 'Success',
    children: 'Your changes have been saved successfully.',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    title: 'Error',
    children: 'There was an error processing your request. Please try again.',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Warning',
    children: 'Your session will expire in 5 minutes.',
  },
};

export const Info: Story = {
  args: {
    type: 'info',
    title: 'Information',
    children: 'A new version is available. Refresh to update.',
  },
};

export const WithoutTitle: Story = {
  args: {
    type: 'info',
    children: 'This is an alert without a title.',
  },
};

export const WithoutIcon: Story = {
  args: {
    type: 'success',
    title: 'No Icon',
    icon: false,
    children: 'This alert does not display an icon.',
  },
};

export const Dismissible: Story = {
  render: () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
      return (
        <button
          onClick={() => setIsVisible(true)}
          className="text-sm text-indigo-600 hover:underline"
        >
          Show alert again
        </button>
      );
    }

    return (
      <Alert
        type="info"
        title="Dismissible Alert"
        dismissible
        onDismiss={() => setIsVisible(false)}
      >
        Click the X button to dismiss this alert.
      </Alert>
    );
  },
};

export const LongContent: Story = {
  args: {
    type: 'warning',
    title: 'Important Notice',
    children: (
      <>
        <p>This is a longer alert message that spans multiple lines.</p>
        <ul className="mt-2 list-disc list-inside">
          <li>First important point</li>
          <li>Second important point</li>
          <li>Third important point</li>
        </ul>
      </>
    ),
  },
};

export const AllTypes: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert type="success" title="Success">
        Operation completed successfully.
      </Alert>
      <Alert type="error" title="Error">
        Something went wrong.
      </Alert>
      <Alert type="warning" title="Warning">
        Please review your changes.
      </Alert>
      <Alert type="info" title="Info">
        New updates available.
      </Alert>
    </div>
  ),
};

// Banner Stories
export const BannerDefault: StoryObj<typeof Banner> = {
  render: () => (
    <div className="w-full">
      <Banner type="info">
        This is a banner notification that spans the full width.
      </Banner>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export const BannerWithAction: StoryObj<typeof Banner> = {
  render: () => (
    <Banner
      type="warning"
      action={{
        label: 'Update now',
        onClick: () => alert('Update clicked!'),
      }}
    >
      A new version is available.
    </Banner>
  ),
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export const BannerDismissible: StoryObj<typeof Banner> = {
  render: () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
      return (
        <button
          onClick={() => setIsVisible(true)}
          className="text-sm text-indigo-600 hover:underline"
        >
          Show banner again
        </button>
      );
    }

    return (
      <Banner type="success" dismissible onDismiss={() => setIsVisible(false)}>
        Your profile has been updated successfully.
      </Banner>
    );
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export const BannerTypes: StoryObj<typeof Banner> = {
  render: () => (
    <div className="space-y-2">
      <Banner type="success">Success banner message</Banner>
      <Banner type="error">Error banner message</Banner>
      <Banner type="warning">Warning banner message</Banner>
      <Banner type="info">Info banner message</Banner>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};
