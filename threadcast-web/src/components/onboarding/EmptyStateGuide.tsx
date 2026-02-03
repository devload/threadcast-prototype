interface EmptyStateGuideProps {
  type: 'workspace' | 'mission' | 'todo';
  onAction?: () => void;
  onSecondaryAction?: () => void;
}

export function EmptyStateGuide({ type, onAction, onSecondaryAction }: EmptyStateGuideProps) {
  const content = {
    workspace: {
      icon: '📂',
      title: '아직 Workspace가 없어요',
      description: 'Workspace는 프로젝트 폴더와 연결됩니다. 첫 번째 Workspace를 만들어 시작해보세요!',
      steps: [
        { icon: '1️⃣', text: 'Workspace 생성 버튼 클릭' },
        { icon: '2️⃣', text: '이름과 프로젝트 경로 입력' },
        { icon: '3️⃣', text: 'Mission을 추가하면 AI가 Todo로 분해' },
      ],
      actionLabel: '+ 첫 Workspace 만들기',
      secondaryLabel: '데모로 체험하기',
    },
    mission: {
      icon: '📋',
      title: '아직 Mission이 없어요',
      description: 'Mission은 달성하고자 하는 큰 목표입니다. AI가 Todo로 자동 분해해드려요!',
      steps: [
        { icon: '💡', text: '"로그인 기능 구현" 같은 목표를 입력' },
        { icon: '🤖', text: 'AI가 작업을 세부 Todo로 분해' },
        { icon: '✅', text: 'Todo를 하나씩 완료하며 진행' },
      ],
      actionLabel: '+ 첫 Mission 만들기',
      secondaryLabel: '템플릿으로 시작',
    },
    todo: {
      icon: '✅',
      title: 'Todo가 없어요',
      description: 'Mission을 시작하면 AI가 자동으로 Todo를 생성합니다.',
      steps: [
        { icon: '🎯', text: 'Mission의 "Start Weaving" 클릭' },
        { icon: '🧵', text: 'AI가 작업을 분석하고 Todo 생성' },
        { icon: '🚀', text: 'Claude Code가 자동으로 작업 수행' },
      ],
      actionLabel: 'Mission으로 이동',
      secondaryLabel: undefined,
    },
  };

  const { icon, title, description, steps, actionLabel, secondaryLabel } = content[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-md mb-6">{description}</p>

      {/* Steps */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 w-full max-w-sm">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-lg">{step.icon}</span>
              <span className="text-sm text-slate-600 dark:text-slate-300">{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onAction && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
