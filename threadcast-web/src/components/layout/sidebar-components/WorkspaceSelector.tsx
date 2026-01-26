import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceSelectorProps {
  current: Workspace;
  workspaces?: Workspace[];
  onChange?: (workspaceId: string) => void;
}

export function WorkspaceSelector({
  current,
  workspaces = [],
  onChange,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (workspaceId: string) => {
    onChange?.(workspaceId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-slate-700 truncate">{current.name}</span>
        <ChevronDown
          size={16}
          className={clsx(
            'text-slate-400 transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && workspaces.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
          role="listbox"
        >
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws.id)}
              className={clsx(
                'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                ws.id === current.id && 'bg-indigo-50 text-indigo-600'
              )}
              role="option"
              aria-selected={ws.id === current.id}
            >
              {ws.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
