import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  ViewSwitcher,
  ViewSwitcherWithLabels,
  SegmentedViewSwitcher,
  ViewDropdown,
  type ViewMode,
} from './ViewSwitcher';

const meta: Meta<typeof ViewSwitcher> = {
  title: 'Common/ViewSwitcher',
  component: ViewSwitcher,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
뷰 모드를 전환하는 컴포넌트입니다.

## 지원 뷰 모드
| 모드 | 아이콘 | 설명 |
|------|--------|------|
| board | Grid | 칸반 보드 뷰 |
| list | List | 리스트 뷰 |
| table | Table | 테이블 뷰 |
| calendar | Calendar | 캘린더 뷰 |
| timeline | Dashboard | 타임라인 뷰 |

## 변형 (Variants)
- **ViewSwitcher**: 아이콘만 표시 (기본)
- **ViewSwitcherWithLabels**: 아이콘 + 라벨
- **SegmentedViewSwitcher**: 세그먼트 컨트롤 스타일
- **ViewDropdown**: 드롭다운 (모바일용)

## 사용 예시
\`\`\`tsx
const [view, setView] = useState<ViewMode>('board');

<ViewSwitcher
  value={view}
  onChange={setView}
  options={['board', 'list', 'table']}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ViewSwitcher>;

/**
 * 기본 ViewSwitcher입니다. 아이콘만 표시됩니다.
 */
export const Default: Story = {
  render: () => {
    const [view, setView] = useState<ViewMode>('board');
    return (
      <ViewSwitcher
        value={view}
        onChange={setView}
        options={['board', 'list']}
      />
    );
  },
};

/**
 * 작은 크기의 ViewSwitcher입니다.
 */
export const Small: Story = {
  render: () => {
    const [view, setView] = useState<ViewMode>('board');
    return (
      <ViewSwitcher
        value={view}
        onChange={setView}
        options={['board', 'list']}
        size="sm"
      />
    );
  },
};

/**
 * 여러 뷰 옵션이 있는 ViewSwitcher입니다.
 */
export const MultipleOptions: Story = {
  render: () => {
    const [view, setView] = useState<ViewMode>('board');
    return (
      <ViewSwitcher
        value={view}
        onChange={setView}
        options={['board', 'list', 'table', 'calendar']}
      />
    );
  },
};

/**
 * 라벨이 포함된 ViewSwitcher입니다.
 */
export const WithLabels: Story = {
  render: () => {
    const [view, setView] = useState<ViewMode>('board');
    return (
      <ViewSwitcherWithLabels
        value={view}
        onChange={setView}
        options={['board', 'list', 'table']}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: '아이콘과 라벨이 함께 표시되는 변형입니다.',
      },
    },
  },
};

/**
 * 세그먼트 컨트롤 스타일입니다.
 */
export const Segmented: Story = {
  render: () => {
    const [view, setView] = useState<ViewMode>('board');
    return (
      <SegmentedViewSwitcher
        value={view}
        onChange={setView}
        options={[
          { id: 'board', label: 'Board' },
          { id: 'list', label: 'List' },
          { id: 'table', label: 'Table' },
        ]}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: '테두리가 있는 세그먼트 컨트롤 스타일입니다.',
      },
    },
  },
};

/**
 * 드롭다운 스타일입니다. 모바일에서 유용합니다.
 */
export const Dropdown: Story = {
  render: () => {
    const [view, setView] = useState<ViewMode>('board');
    return (
      <ViewDropdown
        value={view}
        onChange={setView}
        options={['board', 'list', 'table', 'calendar']}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: '공간이 제한된 모바일 환경에서 사용하는 드롭다운 스타일입니다.',
      },
    },
  },
};

/**
 * 실제 사용 컨텍스트입니다.
 */
export const InContext: Story = {
  render: () => {
    const [view, setView] = useState<ViewMode>('board');

    return (
      <div className="w-[600px] space-y-4">
        {/* Header with view switcher */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div>
            <h2 className="font-semibold text-slate-900">Missions</h2>
            <p className="text-sm text-slate-500">12 active missions</p>
          </div>
          <ViewSwitcher
            value={view}
            onChange={setView}
            options={['board', 'list', 'table']}
          />
        </div>

        {/* Content preview based on view */}
        <div className="bg-slate-100 rounded-lg p-4 h-40 flex items-center justify-center">
          <p className="text-slate-500">
            Currently showing: <span className="font-semibold capitalize">{view}</span> view
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '페이지 헤더에서 ViewSwitcher를 사용하는 실제 패턴입니다.',
      },
    },
  },
};

/**
 * 모든 변형을 비교합니다.
 */
export const AllVariants: Story = {
  render: () => {
    const [view1, setView1] = useState<ViewMode>('board');
    const [view2, setView2] = useState<ViewMode>('board');
    const [view3, setView3] = useState<ViewMode>('board');
    const [view4, setView4] = useState<ViewMode>('board');

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">ICON ONLY (Default)</p>
          <ViewSwitcher value={view1} onChange={setView1} options={['board', 'list', 'table']} />
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">WITH LABELS</p>
          <ViewSwitcherWithLabels value={view2} onChange={setView2} options={['board', 'list', 'table']} />
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">SEGMENTED</p>
          <SegmentedViewSwitcher
            value={view3}
            onChange={setView3}
            options={[
              { id: 'board', label: 'Board' },
              { id: 'list', label: 'List' },
            ]}
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">DROPDOWN</p>
          <ViewDropdown value={view4} onChange={setView4} options={['board', 'list', 'table']} />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '모든 ViewSwitcher 변형을 한눈에 비교할 수 있습니다.',
      },
    },
  },
};

/**
 * 반응형 ViewSwitcher 패턴입니다.
 */
export const Responsive: Story = {
  render: () => {
    const [view, setView] = useState<ViewMode>('board');

    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500">화면 크기에 따라 다른 스타일 사용:</p>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <ViewSwitcherWithLabels
              value={view}
              onChange={setView}
              options={['board', 'list', 'table']}
            />
          </div>
          <div className="block sm:hidden">
            <ViewDropdown
              value={view}
              onChange={setView}
              options={['board', 'list', 'table']}
            />
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Desktop: ViewSwitcherWithLabels / Mobile: ViewDropdown
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '데스크톱에서는 라벨이 있는 스위처, 모바일에서는 드롭다운을 사용하는 반응형 패턴입니다.',
      },
    },
  },
};
