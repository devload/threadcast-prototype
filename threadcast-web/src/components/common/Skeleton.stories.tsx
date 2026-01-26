import type { Meta, StoryObj } from '@storybook/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonMissionCard,
  SkeletonTodoCard,
} from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Common/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
콘텐츠 로딩 중 레이아웃을 유지하기 위한 스켈레톤 컴포넌트입니다.

## 구성 요소
| 컴포넌트 | 용도 |
|----------|------|
| **Skeleton** | 기본 스켈레톤 (커스텀 형태) |
| **SkeletonText** | 텍스트 줄 스켈레톤 |
| **SkeletonAvatar** | 아바타 스켈레톤 |
| **SkeletonCard** | 카드형 스켈레톤 |
| **SkeletonTable** | 테이블 스켈레톤 |
| **SkeletonList** | 리스트 스켈레톤 |
| **SkeletonMissionCard** | Mission 카드 스켈레톤 |
| **SkeletonTodoCard** | Todo 카드 스켈레톤 |

## 형태 (variant)
- **text**: 둥근 모서리 텍스트
- **circular**: 원형 (아바타용)
- **rectangular**: 직사각형

## 애니메이션 (animation)
- **pulse**: 밝기 변화 (기본값)
- **none**: 애니메이션 없음

## 스켈레톤 vs 로딩 스피너
- **Skeleton**: 레이아웃 유지, 콘텐츠 위치 예측 가능
- **Spinner**: 단순 로딩 표시, 레이아웃 미정

## 사용 예시
\`\`\`tsx
// 커스텀 스켈레톤
<Skeleton width={200} height={20} />

// Mission 카드 로딩
{isLoading ? <SkeletonMissionCard /> : <MissionCard {...data} />}

// 텍스트 로딩
<SkeletonText lines={3} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    width: 200,
    height: 20,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <Skeleton variant="text" width={150} height={16} />
        <span className="text-xs text-slate-500">Text</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton variant="circular" width={48} height={48} />
        <span className="text-xs text-slate-500">Circular</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton variant="rectangular" width={100} height={60} />
        <span className="text-xs text-slate-500">Rectangular</span>
      </div>
    </div>
  ),
};

export const Animations: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500 mb-2">Pulse (default)</p>
        <Skeleton width={200} height={20} animation="pulse" />
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-2">None</p>
        <Skeleton width={200} height={20} animation="none" />
      </div>
    </div>
  ),
};

export const Text: StoryObj<typeof SkeletonText> = {
  render: () => (
    <div className="w-80 space-y-6">
      <div>
        <p className="text-sm text-slate-500 mb-2">1 line</p>
        <SkeletonText lines={1} />
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-2">3 lines (default)</p>
        <SkeletonText lines={3} />
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-2">5 lines</p>
        <SkeletonText lines={5} />
      </div>
    </div>
  ),
};

export const Avatar: StoryObj<typeof SkeletonAvatar> = {
  render: () => (
    <div className="flex items-center gap-4">
      <SkeletonAvatar size={24} />
      <SkeletonAvatar size={32} />
      <SkeletonAvatar size={40} />
      <SkeletonAvatar size={48} />
      <SkeletonAvatar size={64} />
    </div>
  ),
};

export const Card: StoryObj<typeof SkeletonCard> = {
  render: () => (
    <div className="w-80">
      <SkeletonCard />
    </div>
  ),
};

export const Table: StoryObj<typeof SkeletonTable> = {
  render: () => (
    <div className="w-[500px]">
      <SkeletonTable rows={5} columns={4} />
    </div>
  ),
};

export const List: StoryObj<typeof SkeletonList> = {
  render: () => (
    <div className="w-80">
      <SkeletonList items={4} />
    </div>
  ),
};

export const MissionCard: StoryObj<typeof SkeletonMissionCard> = {
  render: () => <SkeletonMissionCard />,
};

export const TodoCard: StoryObj<typeof SkeletonTodoCard> = {
  render: () => <SkeletonTodoCard />,
};

export const ComparisonWithReal: Story = {
  render: () => (
    <div className="flex gap-4">
      {/* Skeleton */}
      <div className="w-72">
        <p className="text-sm text-slate-500 mb-2">Loading...</p>
        <SkeletonMissionCard />
      </div>
      {/* Real (simulated) */}
      <div className="w-72">
        <p className="text-sm text-slate-500 mb-2">Loaded</p>
        <div className="p-4 border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
              THREADING
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
              HIGH
            </span>
          </div>
          <h3 className="font-medium">User Authentication</h3>
          <p className="text-sm text-slate-500">
            Implement JWT-based authentication system with refresh tokens
          </p>
          <div className="pt-2">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-amber-500 rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
                JD
              </div>
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
                AS
              </div>
            </div>
            <span className="text-xs text-slate-500">8 of 12 todos</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const KanbanBoardLoading: Story = {
  render: () => (
    <div className="flex gap-4">
      {['Backlog', 'Threading', 'Woven'].map((column) => (
        <div key={column} className="w-72">
          <div className="flex items-center justify-between mb-3">
            <Skeleton height={20} width={80} />
            <Skeleton variant="circular" width={24} height={24} />
          </div>
          <div className="space-y-3">
            <SkeletonMissionCard />
            {column === 'Threading' && <SkeletonMissionCard />}
          </div>
        </div>
      ))}
    </div>
  ),
};
