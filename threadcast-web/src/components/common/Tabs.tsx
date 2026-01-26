import { clsx } from 'clsx';
import { type ReactNode, createContext, useContext, useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children: ReactNode;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  children,
  variant = 'default',
  size = 'md',
  fullWidth = false,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2.5',
  };

  const variantStyles = {
    default: {
      container: 'border-b border-slate-200',
      tab: (isActive: boolean) =>
        clsx(
          'relative',
          isActive
            ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-600'
            : 'text-slate-500 hover:text-slate-700'
        ),
    },
    pills: {
      container: 'bg-slate-100 p-1 rounded-lg',
      tab: (isActive: boolean) =>
        clsx(
          'rounded-md transition-colors',
          isActive
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        ),
    },
    underline: {
      container: '',
      tab: (isActive: boolean) =>
        clsx(
          'border-b-2 transition-colors',
          isActive
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        ),
    },
  };

  const variantStyle = variantStyles[variant];

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div>
        <div
          className={clsx(
            'flex gap-1',
            variantStyle.container,
            fullWidth && 'w-full'
          )}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={clsx(
                'flex items-center gap-2 font-medium transition-colors focus:outline-none',
                sizeStyles[size],
                variantStyle.tab(activeTab === tab.id),
                tab.disabled && 'opacity-50 cursor-not-allowed',
                fullWidth && 'flex-1 justify-center'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    'px-1.5 py-0.5 text-xs rounded-full',
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-200 text-slate-600'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </TabsContext.Provider>
  );
}

interface TabPanelProps {
  id: string;
  children: ReactNode;
}

export function TabPanel({ id, children }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabPanel must be used within Tabs');
  }

  if (context.activeTab !== id) {
    return null;
  }

  return <div>{children}</div>;
}
