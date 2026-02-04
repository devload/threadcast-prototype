import { clsx } from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-lg', gap: 'gap-2' },
    md: { icon: 40, text: 'text-xl', gap: 'gap-2.5' },
    lg: { icon: 48, text: 'text-2xl', gap: 'gap-3' },
    xl: { icon: 56, text: 'text-3xl', gap: 'gap-3' },
  };

  const { icon, text, gap } = sizes[size];

  return (
    <div className={clsx('flex items-center', gap, className)}>
      {/* Logo Icon - Cards cascading down with AI glow */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="aiPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width="56" height="56" rx="14" fill="url(#cardGrad)" />

        {/* Cards falling down (staggered cascade) */}
        <rect x="10" y="6" width="16" height="10" rx="2" fill="white" opacity="0.5" />
        <rect x="20" y="20" width="16" height="10" rx="2" fill="white" filter="url(#glow)" />
        <circle cx="36" cy="20" r="4" fill="url(#aiPink)" />
        <rect x="30" y="34" width="16" height="10" rx="2" fill="white" opacity="0.7" />

        {/* Flow lines */}
        <path d="M18 18 L24 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <path d="M28 32 L34 34" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

        {/* Dots */}
        <circle cx="12" cy="48" r="2" fill="white" opacity="0.3" />
        <circle cx="20" cy="50" r="2" fill="white" opacity="0.3" />
      </svg>

      {/* Logo Text */}
      {showText && (
        <div className="flex items-center gap-2">
          <span className={clsx('font-bold', text)}>
            <span className="text-slate-900 dark:text-white">Thread</span>
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Cast
            </span>
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded">
            Beta
          </span>
        </div>
      )}
    </div>
  );
}
