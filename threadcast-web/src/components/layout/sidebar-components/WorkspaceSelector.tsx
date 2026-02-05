import { clsx } from 'clsx';
import { ChevronDown, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ConfirmDialog } from '../../feedback/Modal';
import { workspaceService } from '../../../services';

export interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceSelectorProps {
  current: Workspace;
  workspaces?: Workspace[];
  onChange?: (workspaceId: string) => void;
  onDelete?: () => void;
}

export function WorkspaceSelector({
  current,
  workspaces = [],
  onChange,
  onDelete,
}: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDeleteClick = (e: React.MouseEvent, ws: Workspace) => {
    e.stopPropagation();
    setWorkspaceToDelete(ws);
    setShowDeleteConfirm(true);
    setIsOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!workspaceToDelete) return;
    setIsDeleting(true);
    try {
      await workspaceService.delete(workspaceToDelete.id);
      setShowDeleteConfirm(false);
      setWorkspaceToDelete(null);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    } finally {
      setIsDeleting(false);
    }
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
            <div
              key={ws.id}
              className={clsx(
                'flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 transition-colors group',
                ws.id === current.id && 'bg-indigo-50 text-indigo-600'
              )}
            >
              <button
                onClick={() => handleSelect(ws.id)}
                className="flex-1 text-left"
                role="option"
                aria-selected={ws.id === current.id}
              >
                {ws.name}
              </button>
              {workspaces.length > 1 && (
                <button
                  onClick={(e) => handleDeleteClick(e, ws)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                  title="Delete workspace"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setWorkspaceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${workspaceToDelete?.name}"? All missions, todos, and data will be permanently deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
