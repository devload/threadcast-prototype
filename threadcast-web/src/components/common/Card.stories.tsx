import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { MoreHorizontal } from 'lucide-react';

const meta: Meta<typeof Card> = {
  title: 'Common/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
범용 카드 컨테이너 컴포넌트입니다.

## 구성 요소
- **Card**: 기본 카드 컨테이너
- **CardHeader**: 제목과 액션 버튼 영역
- **CardContent**: 본문 콘텐츠 영역
- **CardFooter**: 하단 액션 버튼 영역

## 주요 기능
- 패딩 크기 조절 (none, sm, md, lg)
- 호버 효과
- 선택 상태 표시

## 사용 예시
\`\`\`tsx
<Card hover>
  <CardHeader action={<MenuButton />}>
    카드 제목
  </CardHeader>
  <CardContent>
    카드 내용
  </CardContent>
  <CardFooter>
    <Button>저장</Button>
  </CardFooter>
</Card>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    padding: {
      control: 'radio',
      options: ['none', 'sm', 'md', 'lg'],
    },
    hover: {
      control: 'boolean',
    },
    selected: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>Card Title</CardHeader>
        <CardContent>
          This is the card content. It can contain any content you want.
        </CardContent>
      </>
    ),
  },
};

export const WithAction: Story = {
  args: {
    children: (
      <>
        <CardHeader
          action={
            <button className="p-1 hover:bg-slate-100 rounded">
              <MoreHorizontal size={16} className="text-slate-400" />
            </button>
          }
        >
          Card with Action
        </CardHeader>
        <CardContent>
          This card has an action button in the header.
        </CardContent>
      </>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    children: (
      <>
        <CardHeader>Card with Footer</CardHeader>
        <CardContent>
          This card includes a footer section with action buttons.
        </CardContent>
        <CardFooter>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm">Cancel</Button>
            <Button size="sm">Save</Button>
          </div>
        </CardFooter>
      </>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    hover: true,
    children: (
      <>
        <CardHeader>Hoverable Card</CardHeader>
        <CardContent>
          Hover over this card to see the effect.
        </CardContent>
      </>
    ),
  },
};

export const Selected: Story = {
  args: {
    selected: true,
    children: (
      <>
        <CardHeader>Selected Card</CardHeader>
        <CardContent>
          This card is in a selected state.
        </CardContent>
      </>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'sm',
    children: (
      <>
        <CardHeader>Small Padding</CardHeader>
        <CardContent>Compact card with small padding.</CardContent>
      </>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: (
      <>
        <CardHeader>Large Padding</CardHeader>
        <CardContent>Spacious card with large padding.</CardContent>
      </>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div className="p-4">
        <CardHeader>Custom Padding</CardHeader>
        <CardContent>Card with no default padding.</CardContent>
      </div>
    ),
  },
};

export const ComplexContent: Story = {
  args: {
    children: (
      <>
        <CardHeader
          action={
            <span className="text-xs text-slate-500">2 min ago</span>
          }
        >
          Mission Update
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">Implement user authentication module</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                Threading
              </span>
              <span className="text-xs text-slate-500">3/6 steps</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '50%' }} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Due: Jan 30, 2026</span>
            <span>Priority: High 🟠</span>
          </div>
        </CardFooter>
      </>
    ),
  },
};
