import { X } from 'lucide-react';
import { useAIQuestionStore } from '../../stores/aiQuestionStore';
import { AIQuestionCard } from './AIQuestionCard';

export function AIQuestionPanel() {
  const { questions, isPanelOpen, closePanel, answerQuestion, skipQuestion, filteredTodoId } = useAIQuestionStore();

  if (!isPanelOpen) return null;

  // Filter questions if filteredTodoId is set
  const displayQuestions = filteredTodoId
    ? questions.filter(q => q.todoId === filteredTodoId)
    : questions;

  const handleAnswer = (questionId: string, answerId: string, customText?: string) => {
    const answer = customText || answerId;
    answerQuestion(questionId, answer);
  };

  // Generate options based on question category
  const getOptionsForQuestion = (question: typeof questions[0]) => {
    if (question.question.includes('라이브러리')) {
      return [
        { id: 'chartjs', label: 'Chart.js', description: '가볍고 간단한 차트에 적합' },
        { id: 'recharts', label: 'Recharts', description: 'React 친화적, 커스터마이징 용이' },
        { id: 'd3', label: 'D3.js', description: '복잡한 시각화에 적합하지만 러닝커브 높음' },
      ];
    }
    if (question.question.includes('세션') || question.question.includes('로그아웃')) {
      return [
        { id: 'redirect', label: '로그인 페이지로 리다이렉트', description: '토큰 만료 시 즉시 로그인 페이지로 이동' },
        { id: 'refresh', label: '자동 토큰 갱신', description: 'Refresh Token으로 자동 갱신 시도' },
        { id: 'modal', label: '세션 만료 모달 표시', description: '사용자에게 재로그인 선택권 제공' },
      ];
    }
    if (question.question.includes('프로필') || question.question.includes('OAuth')) {
      return [
        { id: 'yes', label: '예, 저장합니다', description: '프로필 사진과 이름을 DB에 저장' },
        { id: 'no', label: '아니오, 이메일만', description: '최소한의 정보만 저장' },
        { id: 'optional', label: '사용자 선택', description: '사용자가 추가 정보 저장 여부 선택' },
      ];
    }
    return [
      { id: 'option1', label: '옵션 1', description: '첫 번째 선택지' },
      { id: 'option2', label: '옵션 2', description: '두 번째 선택지' },
    ];
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={closePanel}
      />

      {/* Panel */}
      <div className="fixed top-0 left-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-lg">🤔</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">AI 질문</h2>
              <p className="text-sm text-slate-500">
                {filteredTodoId
                  ? `이 Todo의 ${displayQuestions.length}개 질문`
                  : `${displayQuestions.length}개의 질문이 대기 중`}
              </p>
            </div>
          </div>
          <button
            onClick={closePanel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {displayQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <span className="text-5xl mb-4">✅</span>
              <p className="text-lg font-medium">
                {filteredTodoId ? '이 Todo의 질문에 모두 답변했습니다!' : '모든 질문에 답변했습니다!'}
              </p>
              <p className="text-sm mt-1">AI가 작업을 계속 진행합니다.</p>
            </div>
          ) : (
            displayQuestions.map((question) => (
              <div key={question.id} className="relative">
                {/* Mission/Todo Info */}
                <div className="flex items-center gap-2 mb-2 text-xs">
                  {question.missionTitle && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                      {question.missionTitle}
                    </span>
                  )}
                  {question.todoTitle && (
                    <span className="text-slate-400">→ {question.todoTitle}</span>
                  )}
                </div>

                <AIQuestionCard
                  id={question.id}
                  question={question.question}
                  context={question.context}
                  todoId={question.todoId}
                  priority={question.category === 'ARCHITECTURE' ? 'high' : 'medium'}
                  options={getOptionsForQuestion(question)}
                  onAnswer={handleAnswer}
                  onSkip={() => skipQuestion(question.id)}
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {displayQuestions.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                답변하면 AI가 작업을 계속합니다
              </span>
              <button
                onClick={() => displayQuestions.forEach(q => skipQuestion(q.id))}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                모두 건너뛰기
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
