import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface SentryIssueBadgeProps {
  issueId: string;
  issueUrl: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function SentryIssueBadge({ issueId, issueUrl, size = 'sm', className }: SentryIssueBadgeProps) {
  // Extract short ID from URL if available (e.g., PROJ-123)
  const shortId = issueUrl?.match(/issues\/(\d+)/)?.[1] || issueId;

  return (
    <a
      href={issueUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={clsx(
        'inline-flex items-center gap-1 rounded font-medium transition-colors',
        'bg-purple-100 text-purple-700 hover:bg-purple-200',
        'dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50',
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2 py-1 text-xs',
        className
      )}
      title={`Sentry Issue: ${shortId}`}
    >
      <SentryIcon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{shortId.length > 10 ? `#${shortId.slice(-6)}` : `#${shortId}`}</span>
      <ExternalLink className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
    </a>
  );
}

function SentryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 66" fill="currentColor">
      <path d="M29,2.26a4.67,4.67,0,0,0-8,0L14.42,13.53A32.21,32.21,0,0,1,32.17,40.19H27.55A27.68,27.68,0,0,0,12.09,17.47L6,28a15.92,15.92,0,0,1,9.23,12.17H4.62A.76.76,0,0,1,4,39.06l2.94-5a10.74,10.74,0,0,0-3.36-1.9l-2.91,5a4.54,4.54,0,0,0,1.69,6.24A4.66,4.66,0,0,0,4.62,44H19.15a19.4,19.4,0,0,0-8-17.31l2.31-4A23.87,23.87,0,0,1,23.76,44H36.07a35.88,35.88,0,0,0-16.41-31.8l4.67-8a.77.77,0,0,1,1.05-.27c.53.29,20.29,34.77,20.66,35.17a.76.76,0,0,1-.68,1.13H40.6q.09,1.91,0,3.81h4.78A4.59,4.59,0,0,0,50,42.67a4.49,4.49,0,0,0-.62-2.29Z"/>
    </svg>
  );
}

export default SentryIssueBadge;
