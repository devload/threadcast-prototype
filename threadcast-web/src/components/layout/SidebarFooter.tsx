import { LogOut, User, HelpCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useOnboardingStore } from '../onboarding';

interface SidebarFooterProps {
  user?: {
    name: string;
    email: string;
  };
  onLogout?: () => void;
}

export function SidebarFooter({ user, onLogout }: SidebarFooterProps) {
  return (
    <>
      {/* Help Button */}
      <HelpMenuButton />

      {/* User Profile & Logout */}
      {user && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700" data-tour="user-menu">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-600 hover:border-red-200 dark:hover:border-red-800 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>로그아웃</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}

// Help Menu Button Component
function HelpMenuButton() {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { startTour, setHasSeenWelcome, resetOnboarding } = useOnboardingStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="px-3 pb-3 relative" ref={menuRef} data-tour="help-button">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all"
      >
        <HelpCircle size={18} />
        <span className="flex-1 text-left font-medium">도움말</span>
      </button>

      {showMenu && (
        <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
          <button
            onClick={() => {
              setShowMenu(false);
              startTour();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span>🎯</span> UI 투어 다시 보기
          </button>
          <button
            onClick={() => {
              setShowMenu(false);
              setHasSeenWelcome(false);
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span>👋</span> 환영 화면 다시 보기
          </button>
          <button
            onClick={() => {
              setShowMenu(false);
              resetOnboarding();
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span>🔄</span> 전체 가이드 초기화
          </button>
        </div>
      )}
    </div>
  );
}
