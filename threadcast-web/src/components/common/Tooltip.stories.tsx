import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip, InfoTooltip } from './Tooltip';
import { Button } from './Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Common/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
마우스 오버 시 추가 정보를 표시하는 툴팁 컴포넌트입니다.

## 구성 요소
- **Tooltip**: 기본 툴팁 (children 요소를 감싸서 사용)
- **InfoTooltip**: 정보 아이콘(ℹ)이 포함된 툴팁

## 주요 기능
- 4방향 위치 지정 (top, bottom, left, right)
- 표시 딜레이 설정
- 비활성화 옵션
- 다크 테마 스타일

## 사용 예시
\`\`\`tsx
// 기본 툴팁
<Tooltip content="저장합니다">
  <Button>저장</Button>
</Tooltip>

// 정보 툴팁
<div className="flex items-center gap-2">
  <label>API Key</label>
  <InfoTooltip content="API 키는 외부에 노출하지 마세요" />
</div>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="This is a tooltip">
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

export const Positions: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-12 p-16">
      <Tooltip content="Top tooltip" position="top">
        <Button variant="secondary">Top</Button>
      </Tooltip>
      <div className="flex gap-24">
        <Tooltip content="Left tooltip" position="left">
          <Button variant="secondary">Left</Button>
        </Tooltip>
        <Tooltip content="Right tooltip" position="right">
          <Button variant="secondary">Right</Button>
        </Tooltip>
      </div>
      <Tooltip content="Bottom tooltip" position="bottom">
        <Button variant="secondary">Bottom</Button>
      </Tooltip>
    </div>
  ),
};

export const WithDelay: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="No delay" delay={0}>
        <Button variant="secondary">Instant</Button>
      </Tooltip>
      <Tooltip content="200ms delay" delay={200}>
        <Button variant="secondary">Default (200ms)</Button>
      </Tooltip>
      <Tooltip content="500ms delay" delay={500}>
        <Button variant="secondary">Slow (500ms)</Button>
      </Tooltip>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="This shows" disabled={false}>
        <Button variant="secondary">Enabled</Button>
      </Tooltip>
      <Tooltip content="This won't show" disabled={true}>
        <Button variant="secondary">Disabled</Button>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Tooltip content="This is a longer tooltip message that provides more detailed information about the element.">
      <Button>Hover for details</Button>
    </Tooltip>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="Edit item">
        <button className="p-2 hover:bg-slate-100 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </Tooltip>
      <Tooltip content="Delete item">
        <button className="p-2 hover:bg-slate-100 rounded text-red-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </Tooltip>
      <Tooltip content="Share item">
        <button className="p-2 hover:bg-slate-100 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </Tooltip>
    </div>
  ),
};

// InfoTooltip Stories
export const InfoTooltipDefault: StoryObj<typeof InfoTooltip> = {
  render: () => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-700">Priority</span>
      <InfoTooltip content="Set the priority level for this task" />
    </div>
  ),
};

export const InfoTooltipPositions: StoryObj<typeof InfoTooltip> = {
  render: () => (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center gap-2">
        <span className="text-sm">Top (default)</span>
        <InfoTooltip content="Tooltip on top" position="top" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Bottom</span>
        <InfoTooltip content="Tooltip on bottom" position="bottom" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Left</span>
        <InfoTooltip content="Tooltip on left" position="left" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm">Right</span>
        <InfoTooltip content="Tooltip on right" position="right" />
      </div>
    </div>
  ),
};

export const InFormContext: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-medium text-slate-700">Email</label>
          <InfoTooltip content="We'll never share your email with anyone else." />
        </div>
        <input
          type="email"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-medium text-slate-700">API Key</label>
          <InfoTooltip content="Your API key is used to authenticate requests. Keep it secret!" />
        </div>
        <input
          type="password"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          placeholder="sk-..."
        />
      </div>
    </div>
  ),
};
