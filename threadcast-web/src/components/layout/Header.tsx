import { clsx } from 'clsx';
import { Search, Bell, Plus, User, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  actions?: ReactNode;
  notifications?: number;
  onNotificationClick?: () => void;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  onUserMenuClick?: () => void;
  onAddClick?: () => void;
  className?: string;
}

export function Header({
  title,
  subtitle,
  showSearch = true,
  searchPlaceholder = 'Search...',
  onSearch,
  actions,
  notifications = 0,
  onNotificationClick,
  user,
  onUserMenuClick,
  onAddClick,
  className,
}: HeaderProps) {
  return (
    <header
      className={clsx(
        'flex items-center justify-between h-14 px-6 bg-white border-b border-slate-200',
        className
      )}
    >
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        {title && (
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Center: Search */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Custom actions */}
        {actions}

        {/* Add button */}
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            <span>New</span>
          </button>
        )}

        {/* Notifications */}
        {onNotificationClick && (
          <button
            onClick={onNotificationClick}
            className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell size={20} className="text-slate-500" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>
        )}

        {/* User menu */}
        {user && (
          <button
            onClick={onUserMenuClick}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <User size={18} />
              </div>
            )}
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            <ChevronDown size={16} className="text-slate-400 hidden md:block" />
          </button>
        )}
      </div>
    </header>
  );
}

// Page header for content areas
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onBreadcrumbClick?: (href: string) => void;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  onBreadcrumbClick,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-slate-500 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <button
                  onClick={() => onBreadcrumbClick?.(crumb.href!)}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-slate-900">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Title & Actions */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
