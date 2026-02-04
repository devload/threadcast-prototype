import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  dataTour?: string;
}

interface SidebarNavProps {
  items: NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

export function SidebarNav({
  items,
  activeId,
  onSelect,
}: SidebarNavProps) {
  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const isActive = activeId === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition-all duration-150',
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            )}
            aria-current={isActive ? 'page' : undefined}
            data-tour={item.dataTour}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={clsx(
                  'px-1.5 py-0.5 text-[10px] rounded-full font-medium',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
