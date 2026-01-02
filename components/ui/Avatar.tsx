interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({ 
  name, 
  src, 
  size = 'md',
  className = '' 
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const colors = [
    'bg-indigo-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-violet-500',
  ];

  const colorIndex = name 
    ? name.charCodeAt(0) % colors.length 
    : 0;

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizes[size]} ${colors[colorIndex]}
        rounded-full flex items-center justify-center
        text-white font-semibold
        ${className}
      `}
    >
      {initials}
    </div>
  );
}

// Avatar group
export function AvatarGroup({ 
  avatars, 
  max = 4,
  size = 'sm',
}: { 
  avatars: { name?: string; src?: string }[];
  max?: number;
  size?: AvatarProps['size'];
}) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, i) => (
        <Avatar
          key={i}
          {...avatar}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div className={`
          ${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}
          rounded-full bg-gray-200 text-gray-600 font-medium
          flex items-center justify-center ring-2 ring-white
        `}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
