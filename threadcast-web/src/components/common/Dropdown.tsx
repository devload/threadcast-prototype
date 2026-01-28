import { clsx } from 'clsx';
import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect, type ReactNode } from 'react';

interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
  width?: 'auto' | 'trigger' | number;
}

export function Dropdown({
  trigger,
  items,
  onSelect,
  align = 'left',
  width = 'auto',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return;
    onSelect(item.value);
    setIsOpen(false);
  };

  const getWidth = () => {
    if (width === 'auto') return 'min-w-[160px]';
    if (width === 'trigger') return '';
    return `w-[${width}px]`;
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 mt-1 py-1 bg-white rounded-lg shadow-lg border border-slate-200',
            align === 'right' ? 'right-0' : 'left-0',
            getWidth(),
            width === 'trigger' && triggerRef.current && `w-[${triggerRef.current.offsetWidth}px]`
          )}
          style={width === 'trigger' && triggerRef.current ? { width: triggerRef.current.offsetWidth } : undefined}
        >
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => handleSelect(item)}
              disabled={item.disabled}
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                item.disabled
                  ? 'text-slate-400 cursor-not-allowed'
                  : item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Select dropdown variant
interface SelectDropdownProps {
  value?: string;
  placeholder?: string;
  options: Array<{ label: string; value: string; disabled?: boolean }>;
  onChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
}

export function SelectDropdown({
  value,
  placeholder = 'Select...',
  options,
  onChange,
  size = 'md',
  disabled = false,
  fullWidth = false,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };

  return (
    <div className={clsx('relative', fullWidth && 'w-full')} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'flex items-center justify-between gap-2 bg-white border border-slate-300 rounded-lg transition-colors',
          sizeStyles[size],
          fullWidth ? 'w-full' : 'min-w-[120px]',
          disabled
            ? 'bg-slate-100 cursor-not-allowed text-slate-400'
            : 'hover:border-slate-400'
        )}
      >
        <span className={clsx(!selectedOption && 'text-slate-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={clsx(
            'text-slate-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 py-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
              disabled={option.disabled}
              className={clsx(
                'w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors',
                option.disabled
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-100',
                option.value === value && 'bg-indigo-50 text-indigo-700'
              )}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <Check size={16} className="text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Menu dropdown with dividers and sections
interface MenuSection {
  label?: string;
  items: DropdownItem[];
}

interface MenuDropdownProps {
  trigger: ReactNode;
  sections: MenuSection[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
}

export function MenuDropdown({
  trigger,
  sections,
  onSelect,
  align = 'left',
}: MenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled) return;
    onSelect(item.value);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 mt-1 py-1 bg-white rounded-lg shadow-lg border border-slate-200 min-w-[180px]',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {sectionIndex > 0 && <div className="my-1 border-t border-slate-200" />}
              {section.label && (
                <p className="px-3 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleSelect(item)}
                  disabled={item.disabled}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                    item.disabled
                      ? 'text-slate-400 cursor-not-allowed'
                      : item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
