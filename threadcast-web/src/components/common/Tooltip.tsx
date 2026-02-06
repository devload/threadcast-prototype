import { clsx } from 'clsx';
import { useState, useRef, useEffect, type ReactNode, type ReactElement, cloneElement } from 'react';
import { createPortal } from 'react-dom';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [adjustedPosition, setAdjustedPosition] = useState<'left' | 'center' | 'right'>('center');
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 280; // max-w-xs is roughly 280px
    const padding = 12; // padding from screen edge
    let top = 0;
    let left = 0;
    let horizontalAlign: 'left' | 'center' | 'right' = 'center';

    switch (position) {
      case 'top':
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
        break;
    }

    // Check horizontal boundaries for top/bottom positions
    if (position === 'top' || position === 'bottom') {
      const halfTooltip = tooltipWidth / 2;

      // Would overflow left?
      if (left - halfTooltip < padding) {
        left = padding;
        horizontalAlign = 'left';
      }
      // Would overflow right?
      else if (left + halfTooltip > window.innerWidth - padding) {
        left = window.innerWidth - padding;
        horizontalAlign = 'right';
      }
    }

    setAdjustedPosition(horizontalAlign);
    setCoords({ top, left });
  };

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionClasses = () => {
    // For top/bottom, adjust horizontal translation based on boundary detection
    if (position === 'top' || position === 'bottom') {
      const verticalClass = position === 'top' ? '-translate-y-full' : '';

      switch (adjustedPosition) {
        case 'left':
          return verticalClass; // No horizontal translate, left-aligned
        case 'right':
          return `${verticalClass} -translate-x-full`; // Right-aligned
        default:
          return `${verticalClass} -translate-x-1/2`; // Centered
      }
    }

    switch (position) {
      case 'left':
        return '-translate-x-full -translate-y-1/2';
      case 'right':
        return '-translate-y-1/2';
      default:
        return '-translate-x-1/2 -translate-y-full';
    }
  };

  const getArrowStyle = () => {
    // For top/bottom with adjusted position, move arrow to correct location
    if (position === 'top' || position === 'bottom') {
      const verticalPart = position === 'top'
        ? 'top-full border-t-slate-800 border-x-transparent border-b-transparent'
        : 'bottom-full border-b-slate-800 border-x-transparent border-t-transparent';

      switch (adjustedPosition) {
        case 'left':
          return `${verticalPart} left-4`; // Arrow near left edge
        case 'right':
          return `${verticalPart} right-4`; // Arrow near right edge
        default:
          return `${verticalPart} left-1/2 -translate-x-1/2`; // Arrow centered
      }
    }

    return arrowStyles[position];
  };

  const arrowStyles: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent',
  };

  return (
    <>
      <div ref={triggerRef} className="inline-flex">
        {cloneElement(children, {
          onMouseEnter: showTooltip,
          onMouseLeave: hideTooltip,
          onFocus: showTooltip,
          onBlur: hideTooltip,
        })}
      </div>
      {isVisible &&
        createPortal(
          <div
            className={clsx(
              'fixed z-[9999] px-3 py-2 text-[11px] text-white bg-slate-800 rounded-lg shadow-lg max-w-xs',
              getPositionClasses()
            )}
            style={{ top: coords.top, left: coords.left }}
            role="tooltip"
          >
            {content}
            <div
              className={clsx(
                'absolute w-0 h-0 border-4',
                getArrowStyle()
              )}
            />
          </div>,
          document.body
        )}
    </>
  );
}

// Simple info tooltip icon
interface InfoTooltipProps {
  content: ReactNode;
  position?: TooltipPosition;
}

export function InfoTooltip({ content, position = 'right' }: InfoTooltipProps) {
  return (
    <Tooltip content={content} position={position}>
      <span className="text-slate-400 hover:text-slate-600 cursor-help text-xs">
        ⓘ
      </span>
    </Tooltip>
  );
}
