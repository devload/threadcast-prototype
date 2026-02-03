import {
  WorkspaceSelector,
  AutonomySlider,
  SidebarNav,
  WorkspaceStats,
  type Workspace,
  type NavItem,
} from './sidebar-components';
import { SearchTrigger } from '../search';
import { Logo } from '../common/Logo';
import { SidebarFooter } from './SidebarFooter';

interface SidebarProps {
  brandName?: string;
  workspace?: Workspace;
  onWorkspaceChange?: (workspaceId: string) => void;
  workspaces?: Workspace[];
  autonomyLevel?: number;
  onAutonomyChange?: (level: number) => void;
  activeNav?: string;
  onNavChange?: (navId: string) => void;
  navItems?: NavItem[];
  stats?: {
    total: number;
    active: number;
    successRate: number;
    remainingTime?: string;
  };
  user?: {
    name: string;
    email: string;
  };
  onLogout?: () => void;
  pendingQuestions?: number;
  onAIQuestionsClick?: () => void;
  onCreateMission?: () => void;
}

const defaultNavItems: NavItem[] = [
  { id: 'all', label: 'All Missions', icon: <span>📊</span>, dataTour: 'missions-menu' },
  { id: 'active', label: 'Active', icon: <span>⚡️</span> },
  { id: 'completed', label: 'Completed', icon: <span>✅</span> },
  { id: 'archived', label: 'Archived', icon: <span>📦</span> },
  { id: 'timeline', label: 'Timeline', icon: <span>📅</span>, dataTour: 'timeline-menu' },
];

export function Sidebar({
  brandName: _brandName = 'ThreadCast',
  workspace = { id: '1', name: 'My Workspace' },
  onWorkspaceChange,
  workspaces = [],
  autonomyLevel = 3,
  onAutonomyChange,
  activeNav = 'all',
  onNavChange,
  navItems = defaultNavItems,
  stats = { total: 0, active: 0, successRate: 0, remainingTime: '~0h' },
  user,
  onLogout,
  pendingQuestions = 0,
  onAIQuestionsClick,
  onCreateMission,
}: SidebarProps) {
  return (
    <aside data-tour="sidebar" className="flex flex-col h-screen w-[260px] bg-white border-r border-slate-200 overflow-y-auto">
      {/* Header - Logo & Workspace */}
      <div className="p-4 pb-4 border-b border-slate-200">
        {/* Logo */}
        <div className="mb-3">
          <Logo size="sm" />
        </div>

        {/* Workspace Selector */}
        <div data-tour="workspace-selector">
          <WorkspaceSelector
            current={workspace}
            workspaces={workspaces}
            onChange={onWorkspaceChange}
          />
        </div>

        {/* Search Trigger */}
        <div className="mt-3">
          <SearchTrigger />
        </div>
      </div>

      {/* AI Autonomy Section */}
      <div className="p-4 border-b border-slate-200">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3 px-2">
          🤖 Workspace AI Autonomy
        </div>
        <AutonomySlider
          value={autonomyLevel}
          onChange={onAutonomyChange}
        />
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3">
        <SidebarNav
          items={navItems}
          activeId={activeNav}
          onSelect={onNavChange}
        />

        {/* Create Mission Button */}
        {onCreateMission && (
          <button
            onClick={onCreateMission}
            data-tour="create-mission"
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span>+</span>
            <span>New Mission</span>
          </button>
        )}
      </div>

      {/* AI Questions Button */}
      <div className="px-3 pb-3" data-tour="ai-questions">
        <button
          onClick={onAIQuestionsClick}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
            pendingQuestions > 0
              ? 'bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 hover:border-pink-300 text-pink-700'
              : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600'
          }`}
        >
          <span className="text-lg">🤔</span>
          <span className="flex-1 text-left font-medium">AI 질문</span>
          {pendingQuestions > 0 && (
            <span className="px-2 py-0.5 bg-pink-500 text-white text-xs font-bold rounded-full animate-pulse">
              {pendingQuestions}
            </span>
          )}
        </button>
      </div>

      {/* Stats Section */}
      <div className="p-4 border-t border-slate-200">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3 px-2">
          Overview
        </div>
        <div className="px-2">
          <WorkspaceStats
            total={stats.total}
            active={stats.active}
            successRate={stats.successRate}
            remainingTime={stats.remainingTime}
          />
        </div>
      </div>

      {/* Help & User Footer */}
      <SidebarFooter user={user} onLogout={onLogout} />
    </aside>
  );
}
