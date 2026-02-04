import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Code,
  List,
  Eye,
  Save,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { Button } from '../common/Button';

export interface MetaData {
  [key: string]: unknown;
}

interface MetaEditorProps {
  /** 현재 엔티티의 자체 메타 */
  meta: MetaData;
  /** 병합된 effective 메타 (조회 전용) */
  effectiveMeta?: MetaData;
  /** 메타 저장 콜백 */
  onSave: (meta: MetaData, replace?: boolean) => Promise<void>;
  /** 읽기 전용 모드 */
  readOnly?: boolean;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 상위 레벨 이름 (예: "Workspace", "Mission") - 상속 표시용 */
  parentLevel?: string;
  /** 타이틀 */
  title?: string;
  /** 컴팩트 모드 */
  compact?: boolean;
}

type ViewMode = 'tree' | 'json' | 'effective';

interface MetaEntryProps {
  keyName: string;
  value: unknown;
  path: string[];
  onUpdate: (path: string[], value: unknown) => void;
  onDelete: (path: string[]) => void;
  onAddChild: (path: string[]) => void;
  readOnly?: boolean;
  inheritedKeys?: Set<string>;
  level?: number;
  compact?: boolean;
}

function MetaEntry({
  keyName,
  value,
  path,
  onUpdate,
  onDelete,
  onAddChild,
  readOnly,
  inheritedKeys,
  level = 0,
  compact = false,
}: MetaEntryProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const [isEditing, setIsEditing] = useState(false);
  const [editKey, setEditKey] = useState(keyName);
  const [editValue, setEditValue] = useState('');
  const isInherited = inheritedKeys?.has(path.join('.'));

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isPrimitive = !isObject && !isArray;

  const startEdit = () => {
    setIsEditing(true);
    setEditKey(keyName);
    setEditValue(isPrimitive ? String(value) : JSON.stringify(value, null, 2));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditKey(keyName);
  };

  const saveEdit = () => {
    let parsedValue: unknown = editValue;

    if (editValue === 'true') parsedValue = true;
    else if (editValue === 'false') parsedValue = false;
    else if (editValue === 'null') parsedValue = null;
    else if (!isNaN(Number(editValue)) && editValue.trim() !== '') parsedValue = Number(editValue);
    else {
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        parsedValue = editValue;
      }
    }

    if (editKey !== keyName) {
      onDelete(path);
      onUpdate([...path.slice(0, -1), editKey], parsedValue);
    } else {
      onUpdate(path, parsedValue);
    }
    setIsEditing(false);
  };

  const renderValue = () => {
    if (isObject) {
      return <span className="text-slate-400 text-[10px]">{`{${Object.keys(value as object).length}}`}</span>;
    }
    if (isArray) {
      return <span className="text-slate-400 text-[10px]">{`[${(value as unknown[]).length}]`}</span>;
    }
    if (typeof value === 'string') {
      const displayValue = value.length > 30 ? value.slice(0, 30) + '...' : value;
      return <span className="text-green-600 dark:text-green-400 text-xs truncate max-w-[150px]">"{displayValue}"</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-blue-600 dark:text-blue-400 text-xs">{value}</span>;
    }
    if (typeof value === 'boolean') {
      return <span className="text-purple-600 dark:text-purple-400 text-xs">{String(value)}</span>;
    }
    if (value === null) {
      return <span className="text-slate-400 italic text-xs">null</span>;
    }
    return <span className="text-xs">{String(value)}</span>;
  };

  return (
    <div className={clsx(
      level > 0 && 'ml-3 border-l border-slate-200 dark:border-slate-700 pl-2',
    )}>
      <div className={clsx(
        'flex items-center gap-1 py-0.5 group text-xs',
        'hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded px-1',
        isEditing && 'bg-indigo-50 dark:bg-indigo-900/20'
      )}>
        {(isObject || isArray) ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded flex-shrink-0"
          >
            {isExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {isEditing ? (
          <input
            type="text"
            value={editKey}
            onChange={(e) => setEditKey(e.target.value)}
            className="w-20 px-1 py-0.5 text-xs border rounded bg-white dark:bg-slate-800 text-indigo-600 font-mono"
            autoFocus
          />
        ) : (
          <span className={clsx('font-mono text-xs', isInherited ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400')}>
            {keyName}
          </span>
        )}

        <span className="text-slate-300">:</span>

        {isEditing && isPrimitive ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-1 py-0.5 text-xs border rounded bg-white dark:bg-slate-800 font-mono min-w-0"
            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
          />
        ) : (
          <span className="font-mono truncate">{renderValue()}</span>
        )}

        {!readOnly && (
          <div className={clsx('flex items-center gap-0.5 ml-auto flex-shrink-0', isEditing ? '' : 'opacity-0 group-hover:opacity-100')}>
            {isEditing ? (
              <>
                <button onClick={saveEdit} className="p-0.5 hover:bg-green-100 rounded text-green-600"><Check size={12} /></button>
                <button onClick={cancelEdit} className="p-0.5 hover:bg-red-100 rounded text-red-500"><X size={12} /></button>
              </>
            ) : (
              <>
                {(isObject || isArray) && <button onClick={() => onAddChild(path)} className="p-0.5 hover:bg-indigo-100 rounded text-indigo-500"><Plus size={12} /></button>}
                <button onClick={startEdit} className="p-0.5 hover:bg-slate-200 rounded text-slate-500"><Edit3 size={12} /></button>
                {!isInherited && <button onClick={() => onDelete(path)} className="p-0.5 hover:bg-red-100 rounded text-red-500"><Trash2 size={12} /></button>}
              </>
            )}
          </div>
        )}
      </div>

      {isExpanded && isObject && (
        <div>
          {Object.entries(value as object).map(([childKey, childValue]) => (
            <MetaEntry key={childKey} keyName={childKey} value={childValue} path={[...path, childKey]} onUpdate={onUpdate} onDelete={onDelete} onAddChild={onAddChild} readOnly={readOnly} inheritedKeys={inheritedKeys} level={level + 1} compact={compact} />
          ))}
        </div>
      )}

      {isExpanded && isArray && (
        <div>
          {(value as unknown[]).map((item, index) => (
            <MetaEntry key={index} keyName={`[${index}]`} value={item} path={[...path, String(index)]} onUpdate={onUpdate} onDelete={onDelete} onAddChild={onAddChild} readOnly={readOnly} inheritedKeys={inheritedKeys} level={level + 1} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MetaEditor({
  meta,
  effectiveMeta,
  onSave,
  readOnly = false,
  isLoading = false,
  parentLevel: _parentLevel,
  title = '메타데이터',
  compact = false,
}: MetaEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [localMeta, setLocalMeta] = useState<MetaData>(meta);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPath, setAddPath] = useState<string[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    setLocalMeta(meta);
    setJsonText(JSON.stringify(meta, null, 2));
  }, [meta]);

  useEffect(() => {
    setHasChanges(JSON.stringify(localMeta) !== JSON.stringify(meta));
  }, [localMeta, meta]);

  const updateValue = useCallback((path: string[], value: unknown) => {
    setLocalMeta((prev) => {
      const newMeta = JSON.parse(JSON.stringify(prev));
      let current = newMeta;
      for (let i = 0; i < path.length - 1; i++) {
        if (current[path[i]] === undefined) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newMeta;
    });
  }, []);

  const deleteValue = useCallback((path: string[]) => {
    setLocalMeta((prev) => {
      const newMeta = JSON.parse(JSON.stringify(prev));
      let current = newMeta;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      if (Array.isArray(current)) {
        current.splice(Number(path[path.length - 1]), 1);
      } else {
        delete current[path[path.length - 1]];
      }
      return newMeta;
    });
  }, []);

  const addChild = useCallback((path: string[]) => {
    setAddPath(path);
    setNewKey('');
    setNewValue('');
    setShowAddModal(true);
  }, []);

  const confirmAdd = () => {
    if (!newKey.trim()) return;

    let parsedValue: unknown = newValue;
    if (newValue === 'true') parsedValue = true;
    else if (newValue === 'false') parsedValue = false;
    else if (newValue === 'null') parsedValue = null;
    else if (newValue === '{}') parsedValue = {};
    else if (newValue === '[]') parsedValue = [];
    else if (!isNaN(Number(newValue)) && newValue.trim() !== '') parsedValue = Number(newValue);
    else {
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue;
      }
    }

    updateValue([...addPath, newKey], parsedValue);
    setShowAddModal(false);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setLocalMeta(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localMeta, false);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save meta:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalMeta(meta);
    setJsonText(JSON.stringify(meta, null, 2));
    setJsonError(null);
  };

  const copyToClipboard = () => {
    const textToCopy = viewMode === 'effective'
      ? JSON.stringify(effectiveMeta, null, 2)
      : JSON.stringify(localMeta, null, 2);
    navigator.clipboard.writeText(textToCopy);
  };

  const renderContent = () => {
    if (viewMode === 'json') {
      return (
        <div className="relative">
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            className={clsx(
              'w-full h-[200px] p-2 font-mono text-xs rounded border',
              'bg-slate-900 text-slate-100',
              jsonError ? 'border-red-500' : 'border-slate-700',
              readOnly && 'opacity-60 cursor-not-allowed'
            )}
            readOnly={readOnly}
            spellCheck={false}
          />
          {jsonError && (
            <div className="absolute bottom-1 left-1 right-1 px-2 py-1 bg-red-500/90 text-white text-[10px] rounded">
              JSON 오류: {jsonError}
            </div>
          )}
        </div>
      );
    }

    if (viewMode === 'effective') {
      return (
        <pre className="font-mono text-[10px] bg-slate-900 text-slate-100 p-2 rounded overflow-auto max-h-[200px]">
          {JSON.stringify(effectiveMeta || {}, null, 2)}
        </pre>
      );
    }

    // Tree view
    const entries = Object.entries(localMeta);
    if (entries.length === 0) {
      return (
        <div className="text-center py-6 text-slate-400">
          <p className="text-xs">메타데이터 없음</p>
          {!readOnly && (
            <button
              onClick={() => addChild([])}
              className="mt-2 text-xs text-indigo-500 hover:text-indigo-600"
            >
              + 항목 추가
            </button>
          )}
        </div>
      );
    }

    return (
      <div>
        {entries.map(([key, value]) => (
          <MetaEntry
            key={key}
            keyName={key}
            value={value}
            path={[key]}
            onUpdate={updateValue}
            onDelete={deleteValue}
            onAddChild={addChild}
            readOnly={readOnly}
            compact={compact}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{title}</span>
          {hasChanges && <span className="w-2 h-2 rounded-full bg-amber-500" title="수정됨" />}
        </div>

        <div className="flex items-center gap-1">
          {/* 뷰 모드 전환 */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded p-0.5 text-[10px]">
            <button
              onClick={() => setViewMode('tree')}
              className={clsx(
                'px-2 py-0.5 rounded transition-colors flex items-center gap-1',
                viewMode === 'tree' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
              )}
            >
              <List size={10} />트리
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={clsx(
                'px-2 py-0.5 rounded transition-colors flex items-center gap-1',
                viewMode === 'json' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
              )}
            >
              <Code size={10} />JSON
            </button>
            {effectiveMeta && (
              <button
                onClick={() => setViewMode('effective')}
                className={clsx(
                  'px-2 py-0.5 rounded transition-colors flex items-center gap-1',
                  viewMode === 'effective' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500'
                )}
                title="상위 레벨(Workspace→Mission→Todo)에서 상속받은 메타와 현재 메타가 합쳐진 최종 결과"
              >
                <Eye size={10} />병합
              </button>
            )}
          </div>
          <button onClick={copyToClipboard} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400" title="복사">
            <Copy size={12} />
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-2 max-h-[250px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          renderContent()
        )}
      </div>

      {/* 푸터 - 액션 버튼 */}
      {!readOnly && viewMode !== 'effective' && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => addChild([])}
            className="text-[10px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Plus size={12} />항목 추가
          </button>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <button onClick={handleReset} className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1">
                <RotateCcw size={10} />되돌리기
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving || !!jsonError}
              className={clsx(
                'px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1',
                hasChanges && !isSaving && !jsonError
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <Save size={10} />{isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* 항목 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h4 className="text-lg font-semibold mb-4">새 항목 추가</h4>
            {addPath.length > 0 && (
              <p className="text-xs text-slate-500 mb-4">
                경로: {addPath.join(' → ')}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  키 (Key)
                </label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="예: repo, branch, url"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  값 (Value)
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder='예: "value", 123, true, {}, []'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmAdd();
                  }}
                />
                <p className="text-xs text-slate-500 mt-1">
                  객체는 {'{}'}, 배열은 [], 문자열/숫자/boolean 입력 가능
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                취소
              </Button>
              <Button variant="primary" onClick={confirmAdd} disabled={!newKey.trim()}>
                추가
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
