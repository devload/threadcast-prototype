import { clsx } from 'clsx';

interface JiraIssueBadgeProps {
  issueKey: string;
  issueUrl?: string;
  issueType?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Badge component to display JIRA issue link on Mission/Todo cards
 */
export function JiraIssueBadge({
  issueKey,
  issueUrl,
  issueType,
  className,
  size = 'sm',
}: JiraIssueBadgeProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (issueUrl) {
      window.open(issueUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getTypeIcon = () => {
    switch (issueType?.toLowerCase()) {
      case 'epic':
        return (
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 4.5A1.5 1.5 0 014.5 3h7A1.5 1.5 0 0113 4.5v7a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 11.5v-7z" />
          </svg>
        );
      case 'story':
        return (
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 2.5A1.5 1.5 0 014.5 1h7A1.5 1.5 0 0113 2.5v11a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 13.5v-11z" />
          </svg>
        );
      case 'bug':
        return (
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="5" />
          </svg>
        );
      case 'task':
        return (
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.5 4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0 4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0 4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    switch (issueType?.toLowerCase()) {
      case 'epic':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
      case 'story':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'bug':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'task':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      default:
        return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-700';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center gap-1 rounded font-mono transition-all',
        'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        getTypeColor(),
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm',
        issueUrl && 'cursor-pointer',
        !issueUrl && 'cursor-default',
        className
      )}
      title={issueUrl ? `Open ${issueKey} in JIRA` : issueKey}
      disabled={!issueUrl}
    >
      {getTypeIcon()}
      <span>{issueKey}</span>
      {issueUrl && (
        <svg
          className="w-2.5 h-2.5 opacity-60"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 2h8v8M14 2L6 10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default JiraIssueBadge;
