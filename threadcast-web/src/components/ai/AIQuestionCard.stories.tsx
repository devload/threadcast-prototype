import type { Meta, StoryObj } from '@storybook/react';
import { AIQuestionCard, AIQuestionBadge } from './AIQuestionCard';
import { useState } from 'react';

const meta: Meta<typeof AIQuestionCard> = {
  title: 'AI/AIQuestionCard',
  component: AIQuestionCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
AI가 사용자에게 질문하고 답변을 받는 카드 컴포넌트입니다.

## ThreadCast AI 질문 시스템

AI가 작업 중 결정이 필요할 때 사용자에게 질문합니다.
자율성 레벨에 따라 질문 빈도가 달라집니다:
- Level 1-2: 대부분의 결정에 질문
- Level 3: 중요한 결정에만 질문
- Level 4-5: 거의 질문하지 않음

## 우선순위 (Priority)
| 우선순위 | 색상 | 설명 |
|---------|------|------|
| urgent | 빨강 | 즉시 답변 필요, 작업 블로킹 |
| high | 주황 | 빠른 답변 권장 |
| medium | 노랑 | 일반적인 질문 |
| low | 파랑 | 나중에 답변해도 됨 |

## 답변 옵션
- 미리 정의된 선택지
- "AI가 결정" 옵션
- 커스텀 텍스트 입력

## 사용 예시
\`\`\`tsx
<AIQuestionCard
  id="q-1"
  question="세션 만료 시간을 어떻게 설정할까요?"
  priority="high"
  options={[
    { id: '15m', label: '15분', description: '보안 강화' },
    { id: '30m', label: '30분', description: '일반적' },
    { id: '60m', label: '60분', description: '편의성' },
  ]}
  onAnswer={(qId, aId) => handleAnswer(qId, aId)}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AIQuestionCard>;

const defaultOptions = [
  { id: '15m', label: '15분', description: '보안이 강화됩니다' },
  { id: '30m', label: '30분', description: '일반적인 설정입니다' },
  { id: '60m', label: '60분', description: '편의성이 높아집니다' },
];

/**
 * 기본 AI 질문 카드입니다.
 */
export const Default: Story = {
  args: {
    id: 'q-1',
    question: '세션 만료 시간을 어떻게 설정할까요?',
    context: '보안과 사용자 편의성 사이의 균형을 고려해주세요.',
    todoId: 'todo-42-3',
    todoTitle: 'API 엔드포인트 구현',
    priority: 'medium',
    options: defaultOptions,
    onAnswer: (qId, aId) => console.log('Answer:', qId, aId),
  },
};

/**
 * Urgent 우선순위 질문입니다.
 */
export const Urgent: Story = {
  args: {
    id: 'q-2',
    question: '데이터베이스 연결이 실패했습니다. 어떻게 처리할까요?',
    todoId: 'todo-42-1',
    todoTitle: '데이터베이스 설정',
    priority: 'urgent',
    options: [
      { id: 'retry', label: '재시도', description: '3번까지 재시도' },
      { id: 'fallback', label: '폴백 DB 사용', description: '읽기 전용 모드' },
      { id: 'fail', label: '에러 반환', description: '사용자에게 에러 표시' },
    ],
    onAnswer: (qId, aId) => console.log('Answer:', qId, aId),
  },
};

/**
 * High 우선순위 질문입니다.
 */
export const High: Story = {
  args: {
    id: 'q-3',
    question: '테스트 커버리지 목표를 몇 %로 설정할까요?',
    todoId: 'todo-42-5',
    todoTitle: '통합 테스트 작성',
    priority: 'high',
    options: [
      { id: '80', label: '80% 이상', description: '엄격한 기준' },
      { id: '60', label: '60-80%', description: '적절한 기준' },
      { id: '40', label: '40-60%', description: '최소 기준' },
    ],
    onAnswer: (qId, aId) => console.log('Answer:', qId, aId),
  },
};

/**
 * Low 우선순위 질문입니다.
 */
export const Low: Story = {
  args: {
    id: 'q-4',
    question: '로그 레벨을 어떻게 설정할까요?',
    todoId: 'todo-42-2',
    priority: 'low',
    options: [
      { id: 'debug', label: 'DEBUG' },
      { id: 'info', label: 'INFO' },
      { id: 'warn', label: 'WARN' },
    ],
    onAnswer: (qId, aId) => console.log('Answer:', qId, aId),
  },
};

/**
 * 컨텍스트 정보가 있는 질문입니다.
 */
export const WithContext: Story = {
  args: {
    id: 'q-5',
    question: '인증 방식을 선택해주세요.',
    context: '현재 프로젝트는 마이크로서비스 아키텍처를 사용하고 있으며, 여러 서비스 간 인증이 필요합니다. 기존 시스템은 세션 기반 인증을 사용하고 있습니다.',
    todoId: 'todo-42-3',
    todoTitle: '인증 시스템 구현',
    priority: 'high',
    options: [
      { id: 'jwt', label: 'JWT', description: '무상태, 확장성 좋음' },
      { id: 'session', label: '세션 기반', description: '기존 방식 유지' },
      { id: 'oauth', label: 'OAuth 2.0', description: '외부 인증 연동' },
    ],
    onAnswer: (qId, aId) => console.log('Answer:', qId, aId),
  },
};

/**
 * 커스텀 답변을 허용하지 않는 질문입니다.
 */
export const NoCustomAnswer: Story = {
  args: {
    id: 'q-6',
    question: '사용할 데이터베이스를 선택해주세요.',
    priority: 'high',
    options: [
      { id: 'postgres', label: 'PostgreSQL' },
      { id: 'mysql', label: 'MySQL' },
      { id: 'mongodb', label: 'MongoDB' },
    ],
    allowCustomAnswer: false,
    onAnswer: (qId, aId) => console.log('Answer:', qId, aId),
  },
};

/**
 * 답변 완료된 상태입니다.
 */
export const Answered: Story = {
  args: {
    id: 'q-7',
    question: '이미 답변된 질문입니다.',
    options: [],
    isAnswered: true,
    onAnswer: () => {},
  },
};

/**
 * 로딩 상태입니다.
 */
export const Loading: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false);

    return (
      <AIQuestionCard
        id="q-8"
        question="테스트 로딩 상태"
        options={defaultOptions}
        isLoading={isLoading}
        onAnswer={() => {
          setIsLoading(true);
          setTimeout(() => setIsLoading(false), 2000);
        }}
      />
    );
  },
};

/**
 * 인터랙티브 데모입니다.
 */
export const Interactive: Story = {
  render: () => {
    const [answered, setAnswered] = useState<string | null>(null);

    if (answered) {
      return (
        <div className="text-center p-8">
          <p className="text-green-600 font-medium mb-4">
            Selected: {answered}
          </p>
          <button
            onClick={() => setAnswered(null)}
            className="text-sm text-indigo-600 hover:underline"
          >
            Reset
          </button>
        </div>
      );
    }

    return (
      <AIQuestionCard
        id="q-9"
        question="배포 환경을 선택해주세요."
        context="선택에 따라 CI/CD 파이프라인이 구성됩니다."
        todoId="todo-1"
        todoTitle="배포 설정"
        priority="medium"
        options={[
          { id: 'aws', label: 'AWS', description: 'EC2, S3, CloudFront' },
          { id: 'gcp', label: 'Google Cloud', description: 'GKE, Cloud Storage' },
          { id: 'azure', label: 'Azure', description: 'AKS, Blob Storage' },
        ]}
        onAnswer={(_, aId) => setAnswered(aId)}
        onSkip={() => setAnswered('skipped')}
      />
    );
  },
};

// AIQuestionBadge Stories
export const BadgeSingle: StoryObj<typeof AIQuestionBadge> = {
  render: () => <AIQuestionBadge count={1} onClick={() => alert('Open questions')} />,
  parameters: {
    docs: {
      description: {
        story: '단일 질문이 있을 때의 뱃지입니다.',
      },
    },
  },
};

export const BadgeMultiple: StoryObj<typeof AIQuestionBadge> = {
  render: () => <AIQuestionBadge count={5} onClick={() => alert('Open questions')} />,
  parameters: {
    docs: {
      description: {
        story: '여러 질문이 있을 때의 뱃지입니다.',
      },
    },
  },
};

export const BadgeZero: StoryObj<typeof AIQuestionBadge> = {
  render: () => <AIQuestionBadge count={0} />,
  parameters: {
    docs: {
      description: {
        story: '질문이 없으면 뱃지가 표시되지 않습니다.',
      },
    },
  },
};
