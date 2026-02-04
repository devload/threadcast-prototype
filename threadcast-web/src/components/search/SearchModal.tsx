import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import {
  Search,
  X,
  Clock,
  Target,
  CheckSquare,
  MessageSquare,
  FolderKanban,
  ArrowRight,
  Command,
  Loader2,
} from 'lucide-react';
import { useSearchStore } from '../../stores/searchStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useNavigate } from 'react-router-dom';
import type { SearchResultItem, SearchResultType } from '../../types/search';

const TYPE_ICONS: Record<SearchResultType, typeof Target> = {
  MISSION: Target,
  TODO: CheckSquare,
  COMMENT: MessageSquare,
  PROJECT: FolderKanban,
  ALL: Search,
};

const TYPE_LABELS: Record<SearchResultType, string> = {
  MISSION: 'Mission',
  TODO: 'Todo',
  COMMENT: 'Comment',
  PROJECT: 'Project',
  ALL: 'All',
};

const TYPE_COLORS: Record<SearchResultType, string> = {
  MISSION: 'bg-indigo-100 text-indigo-700',
  TODO: 'bg-emerald-100 text-emerald-700',
  COMMENT: 'bg-amber-100 text-amber-700',
  PROJECT: 'bg-purple-100 text-purple-700',
  ALL: 'bg-slate-100 text-slate-700',
};

interface SearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function SearchModal({ isOpen: externalIsOpen, onClose: externalOnClose }: SearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    query,
    response,
    isSearching,
    isOpen: storeIsOpen,
    selectedIndex,
    recentSearches,
    filters,
    error,
    setQuery,
    search,
    setIsOpen,
    setFilters,
    moveSelection,
    getSelectedResult,
    clearRecentSearches,
  } = useSearchStore();

  const { currentWorkspace } = useWorkspaceStore();

  // Use external props or store state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : storeIsOpen;
  const handleClose = useCallback(() => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setIsOpen(false);
    }
  }, [externalOnClose, setIsOpen]);

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!storeIsOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [storeIsOpen, setIsOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search when query or filters change
  useEffect(() => {
    if (!currentWorkspace?.id || !query) return;

    const timer = setTimeout(() => {
      search(currentWorkspace.id);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters, currentWorkspace?.id, search]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveSelection('down');
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveSelection('up');
        break;
      case 'Enter':
        e.preventDefault();
        const selected = getSelectedResult();
        if (selected) {
          handleResultClick(selected);
        }
        break;
      case 'Escape':
        handleClose();
        break;
    }
  };

  // Navigate to result
  const handleResultClick = (result: SearchResultItem) => {
    handleClose();
    setQuery('');

    switch (result.type) {
      case 'MISSION':
        navigate(`/missions/${result.id}/todos`);
        break;
      case 'TODO':
        if (result.parentId) {
          navigate(`/missions/${result.parentId}/todos?todo=${result.id}`);
        } else {
          navigate(`/todos?todo=${result.id}`);
        }
        break;
      case 'PROJECT':
        navigate(`/projects/${result.id}`);
        break;
      case 'COMMENT':
        if (result.parentId) {
          navigate(`/todos?todo=${result.parentId}`);
        }
        break;
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  // Filter tabs
  const filterTypes: Array<SearchResultType | 'ALL'> = ['ALL', 'MISSION', 'TODO', 'PROJECT', 'COMMENT'];

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search size={20} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search missions, todos, projects..."
            className="flex-1 text-base bg-transparent border-0 outline-none placeholder-slate-400"
          />
          {isSearching && (
            <Loader2 size={18} className="text-slate-400 animate-spin flex-shrink-0" />
          )}
          {query && !isSearching && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <X size={16} className="text-slate-400" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-slate-400 bg-slate-100 rounded">
            <span>ESC</span>
          </kbd>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 overflow-x-auto">
          {filterTypes.map((type) => {
            const isActive = (filters.type || 'ALL') === type;
            const Icon = TYPE_ICONS[type];
            const count =
              type === 'ALL'
                ? response.totalCount
                : type === 'MISSION'
                ? response.missionCount
                : type === 'TODO'
                ? response.todoCount
                : type === 'PROJECT'
                ? response.projectCount
                : response.commentCount;

            return (
              <button
                key={type}
                onClick={() => setFilters({ ...filters, type: type === 'ALL' ? undefined : type })}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )}
              >
                <Icon size={14} />
                <span>{TYPE_LABELS[type]}</span>
                {query && count > 0 && (
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 text-xs rounded-full',
                      isActive ? 'bg-indigo-200' : 'bg-slate-200'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results / Recent Searches */}
        <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
          {error && (
            <div className="px-4 py-8 text-center">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {!error && !query && recentSearches.length > 0 && (
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((searchQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(searchQuery)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Clock size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-600">{searchQuery}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!error && query && response.results.length === 0 && !isSearching && (
            <div className="px-4 py-12 text-center">
              <Search size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No results found for "{query}"</p>
              <p className="text-slate-400 text-xs mt-1">Try different keywords or filters</p>
            </div>
          )}

          {!error && query && response.results.length > 0 && (
            <div className="py-2">
              {response.results.map((result, index) => (
                <SearchResultItemComponent
                  key={result.id}
                  result={result}
                  index={index}
                  isSelected={selectedIndex === index}
                  onClick={() => handleResultClick(result)}
                />
              ))}
            </div>
          )}

          {!error && !query && recentSearches.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Search size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">Start typing to search</p>
              <p className="text-slate-400 text-xs mt-1">
                Search across missions, todos, projects, and comments
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">Enter</kbd>
              <span>to select</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command size={12} />
            <span>K to toggle</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Search Result Item Component
interface SearchResultItemComponentProps {
  result: SearchResultItem;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

function SearchResultItemComponent({
  result,
  index,
  isSelected,
  onClick,
}: SearchResultItemComponentProps) {
  const Icon = TYPE_ICONS[result.type];

  return (
    <button
      data-index={index}
      onClick={onClick}
      className={clsx(
        'flex items-start gap-3 w-full px-4 py-3 text-left transition-colors',
        isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
      )}
    >
      {/* Type Icon */}
      <div
        className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
          TYPE_COLORS[result.type]
        )}
      >
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 truncate">{result.title}</span>
          {result.status && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
              {result.status}
            </span>
          )}
        </div>

        {/* Highlighted content or description */}
        {result.highlightedContent ? (
          <p
            className="text-sm text-slate-500 truncate mt-0.5"
            dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
          />
        ) : result.description ? (
          <p className="text-sm text-slate-500 truncate mt-0.5">{result.description}</p>
        ) : null}

        {/* Parent info */}
        {result.parentTitle && (
          <p className="text-xs text-slate-400 mt-1">
            in <span className="text-slate-500">{result.parentTitle}</span>
          </p>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight
        size={16}
        className={clsx(
          'flex-shrink-0 mt-2 transition-colors',
          isSelected ? 'text-indigo-500' : 'text-slate-300'
        )}
      />
    </button>
  );
}

// Search Trigger Button (for sidebar/header)
interface SearchTriggerProps {
  className?: string;
  compact?: boolean;
}

export function SearchTrigger({ className, compact = false }: SearchTriggerProps) {
  const { setIsOpen } = useSearchStore();

  return (
    <button
      onClick={() => setIsOpen(true)}
      className={clsx(
        'flex items-center gap-2 transition-colors',
        compact
          ? 'p-2 hover:bg-slate-100 rounded-lg'
          : 'w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg',
        className
      )}
    >
      <Search size={compact ? 20 : 16} className="text-slate-400" />
      {!compact && (
        <>
          <span className="flex-1 text-left text-sm text-slate-400">Search...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-slate-400 bg-white border border-slate-200 rounded">
            <Command size={10} />
            <span>K</span>
          </kbd>
        </>
      )}
    </button>
  );
}
