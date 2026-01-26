import {
  WorkspaceSelector,
  AutonomySlider,
  SidebarNav,
  WorkspaceStats,
  type Workspace,
  type NavItem,
} from './sidebar-components';

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
}

const defaultNavItems: NavItem[] = [
  { id: 'all', label: 'All Missions', icon: <span>📊</span> },
  { id: 'active', label: 'Active', icon: <span>⚡️</span> },
  { id: 'completed', label: 'Completed', icon: <span>✅</span> },
  { id: 'archived', label: 'Archived', icon: <span>📦</span> },
];

export function Sidebar({
  brandName = 'ThreadCast',
  workspace = { id: '1', name: 'My Workspace' },
  onWorkspaceChange,
  workspaces = [],
  autonomyLevel = 3,
  onAutonomyChange,
  activeNav = 'all',
  onNavChange,
  navItems = defaultNavItems,
  stats = { total: 0, active: 0, successRate: 0, remainingTime: '~0h' },
}: SidebarProps) {
  return (
    <aside className="flex flex-col h-screen w-[260px] bg-white border-r border-slate-200 overflow-y-auto">
      {/* Header - Logo & Workspace */}
      <div className="p-4 pb-4 border-b border-slate-200">
        {/* Logo */}
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-lg mb-3">
          <span className="text-xl">🧵</span>
          <span>{brandName}</span>
        </div>

        {/* Workspace Selector */}
        <WorkspaceSelector
          current={workspace}
          workspaces={workspaces}
          onChange={onWorkspaceChange}
        />
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
    </aside>
  );
}
