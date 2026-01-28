import { clsx } from 'clsx';
import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  currentPath?: string;
  onNavigate?: (nav: 'all' | 'active' | 'completed' | 'archived') => void;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  notifications?: number;
  onNotificationClick?: () => void;
  onUserMenuClick?: () => void;
  onAddClick?: () => void;
  headerActions?: ReactNode;
  stats?: {
    total: number;
    active: number;
    successRate: number;
    remainingTime?: string;
  };
  onCreateMission?: () => void;
}

export function Layout({
  children,
  currentPath = '/',
  onNavigate,
  title,
  subtitle,
  showSearch = true,
  onSearch,
  user,
  notifications = 0,
  onNotificationClick,
  onUserMenuClick,
  onAddClick,
  headerActions,
  stats = { total: 0, active: 0, successRate: 0, remainingTime: '~0h' },
  onCreateMission,
}: LayoutProps) {
  // Determine active nav from currentPath
  const getActiveNav = (): 'all' | 'active' | 'completed' | 'archived' => {
    if (currentPath.includes('active')) return 'active';
    if (currentPath.includes('completed')) return 'completed';
    if (currentPath.includes('archived')) return 'archived';
    return 'all';
  };

  const [activeNav, setActiveNav] = useState<'all' | 'active' | 'completed' | 'archived'>(getActiveNav());

  const handleNavChange = (navId: string) => {
    const nav = navId as 'all' | 'active' | 'completed' | 'archived';
    setActiveNav(nav);
    onNavigate?.(nav);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        stats={stats}
        onCreateMission={onCreateMission}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          title={title}
          subtitle={subtitle}
          showSearch={showSearch}
          onSearch={onSearch}
          user={user}
          notifications={notifications}
          onNotificationClick={onNotificationClick}
          onUserMenuClick={onUserMenuClick}
          onAddClick={onAddClick}
          actions={headerActions}
        />

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Simple content wrapper
interface ContentWrapperProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export function ContentWrapper({
  children,
  maxWidth = 'full',
  className,
}: ContentWrapperProps) {
  const maxWidthStyles = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-[1400px]',
    full: 'max-w-full',
  };

  return (
    <div className={clsx('mx-auto w-full', maxWidthStyles[maxWidth], className)}>
      {children}
    </div>
  );
}

// Split layout for detail views
interface SplitLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  sidebarWidth?: 'sm' | 'md' | 'lg';
  sidebarPosition?: 'left' | 'right';
}

export function SplitLayout({
  children,
  sidebar,
  sidebarWidth = 'md',
  sidebarPosition = 'right',
}: SplitLayoutProps) {
  const widthStyles = {
    sm: 'w-72',
    md: 'w-80',
    lg: 'w-96',
  };

  const sidebarElement = (
    <aside
      className={clsx(
        'flex-shrink-0 border-slate-200 bg-white',
        widthStyles[sidebarWidth],
        sidebarPosition === 'left' ? 'border-r' : 'border-l'
      )}
    >
      {sidebar}
    </aside>
  );

  return (
    <div className="flex h-full">
      {sidebarPosition === 'left' && sidebarElement}
      <div className="flex-1 min-w-0 overflow-auto">{children}</div>
      {sidebarPosition === 'right' && sidebarElement}
    </div>
  );
}
