import type { Meta, StoryObj } from '@storybook/react';
import { Spinner, LoadingOverlay, LoadingInline, LoadingCard, LoadingDots } from './Loading';
import { Button } from './Button';

const meta: Meta<typeof Spinner> = {
  title: 'Common/Loading',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
로딩 상태를 표시하는 컴포넌트들입니다.

## 구성 요소
| 컴포넌트 | 용도 | 예시 |
|----------|------|------|
| **Spinner** | 기본 스피너 | 버튼 내부, 작은 영역 |
| **LoadingInline** | 인라인 로딩 | 텍스트와 함께 표시 |
| **LoadingOverlay** | 오버레이 로딩 | 전체 영역 덮기 |
| **LoadingCard** | 카드형 로딩 | 카드 로딩 상태 |
| **LoadingDots** | 점 애니메이션 | 버튼 내 "저장중..." |

## Spinner 크기
- **xs**: 12px (아이콘 내부)
- **sm**: 16px (버튼 내부)
- **md**: 24px (기본)
- **lg**: 32px (카드 중앙)
- **xl**: 48px (페이지 로딩)

## 사용 패턴

### 버튼 로딩
\`\`\`tsx
<Button isLoading>저장 중</Button>
\`\`\`

### 인라인 로딩
\`\`\`tsx
<LoadingInline message="데이터 불러오는 중..." />
\`\`\`

### 오버레이 로딩
\`\`\`tsx
<div className="relative">
  <Content />
  {isLoading && <LoadingOverlay />}
</div>
\`\`\`

### 점 애니메이션
\`\`\`tsx
<span>처리 중<LoadingDots /></span>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
};

export const InlineLoading: StoryObj<typeof LoadingInline> = {
  render: () => (
    <div className="space-y-4">
      <LoadingInline />
      <LoadingInline message="Loading data..." />
      <LoadingInline message="Processing..." size="md" />
    </div>
  ),
};

export const CardLoading: StoryObj<typeof LoadingCard> = {
  render: () => (
    <div className="w-64">
      <LoadingCard />
    </div>
  ),
};

export const DotsLoading: StoryObj<typeof LoadingDots> = {
  render: () => (
    <div className="flex items-center gap-4">
      <span className="text-slate-600">
        Loading<LoadingDots className="ml-1" />
      </span>
      <Button disabled>
        Saving<LoadingDots className="ml-2" />
      </Button>
    </div>
  ),
};

export const Overlay: StoryObj<typeof LoadingOverlay> = {
  render: () => (
    <div className="relative w-96 h-64 border rounded-lg">
      <div className="p-4">
        <h3 className="font-medium">Some Content</h3>
        <p className="text-sm text-slate-500 mt-1">This content is loading...</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      {/* Loading button */}
      <div>
        <p className="text-sm text-slate-500 mb-2">Button loading:</p>
        <Button isLoading>Save Changes</Button>
      </div>

      {/* Loading card */}
      <div>
        <p className="text-sm text-slate-500 mb-2">Card loading:</p>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-center h-20">
            <Spinner />
          </div>
        </div>
      </div>

      {/* Loading inline */}
      <div>
        <p className="text-sm text-slate-500 mb-2">Inline loading:</p>
        <LoadingInline message="Fetching data..." />
      </div>

      {/* Loading list */}
      <div>
        <p className="text-sm text-slate-500 mb-2">List loading:</p>
        <div className="space-y-2">
          <div className="h-12 bg-slate-100 rounded animate-pulse" />
          <div className="h-12 bg-slate-100 rounded animate-pulse" />
          <div className="h-12 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
        <span className="text-xs text-slate-500">Indigo</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-slate-200 border-t-green-600" />
        <span className="text-xs text-slate-500">Green</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-slate-200 border-t-red-600" />
        <span className="text-xs text-slate-500">Red</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-slate-200 border-t-amber-600" />
        <span className="text-xs text-slate-500">Amber</span>
      </div>
    </div>
  ),
};
