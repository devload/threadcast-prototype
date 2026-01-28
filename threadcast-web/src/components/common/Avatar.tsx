import { clsx } from 'clsx';
import { User } from 'lucide-react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; icon: number }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs', icon: 12 },
  sm: { container: 'w-8 h-8', text: 'text-sm', icon: 14 },
  md: { container: 'w-10 h-10', text: 'text-base', icon: 18 },
  lg: { container: 'w-12 h-12', text: 'text-lg', icon: 22 },
  xl: { container: 'w-16 h-16', text: 'text-xl', icon: 28 },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const sizeStyle = sizeStyles[size];

  // Image avatar
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={clsx(
          'rounded-full object-cover',
          sizeStyle.container,
          className
        )}
      />
    );
  }

  // Initials avatar
  if (name) {
    return (
      <div
        className={clsx(
          'rounded-full flex items-center justify-center font-medium text-white',
          sizeStyle.container,
          sizeStyle.text,
          getColorFromName(name),
          className
        )}
        title={name}
      >
        {getInitials(name)}
      </div>
    );
  }

  // Placeholder avatar
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center bg-slate-200 text-slate-400',
        sizeStyle.container,
        className
      )}
    >
      <User size={sizeStyle.icon} />
    </div>
  );
}

// Avatar group component
interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    name?: string;
  }>;
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ avatars, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  const sizeStyle = sizeStyles[size];

  return (
    <div className="flex -space-x-2">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className="relative ring-2 ring-white rounded-full"
        >
          <Avatar src={avatar.src} name={avatar.name} size={size} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={clsx(
            'relative ring-2 ring-white rounded-full flex items-center justify-center bg-slate-100 text-slate-600 font-medium',
            sizeStyle.container,
            sizeStyle.text
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// Avatar with status indicator
interface AvatarWithStatusProps extends AvatarProps {
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-slate-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
};

export function AvatarWithStatus({
  status,
  size = 'md',
  ...props
}: AvatarWithStatusProps) {
  const statusSize = size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className="relative inline-block">
      <Avatar size={size} {...props} />
      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            statusSize,
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
