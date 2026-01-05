import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-indigo-50 text-indigo-700',
    secondary: 'bg-gray-100 text-gray-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
    outline: 'bg-transparent border border-gray-300 text-gray-600',
  };

  const dotColors = {
    default: 'bg-gray-500',
    primary: 'bg-indigo-500',
    secondary: 'bg-gray-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    outline: 'bg-gray-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

// Status badge with predefined styles
export function StatusBadge({ 
  status 
}: { 
  status: 'HADIR' | 'ALPHA' | 'PENDING' | 'IZIN_SAKIT' | 'IZIN_LAIN' | 'IZIN_KAMPUS' | 'REJECTED' | 'INHAL' | string 
}) {
  const config: Record<string, { variant: BadgeProps['variant']; label: string; dot?: boolean }> = {
    HADIR: { variant: 'success', label: 'Hadir', dot: true },
    ALPHA: { variant: 'danger', label: 'Alpha', dot: true },
    PENDING: { variant: 'warning', label: 'Pending', dot: true },
    IZIN_SAKIT: { variant: 'info', label: 'Sakit' },
    IZIN_LAIN: { variant: 'info', label: 'Izin' },
    IZIN_KAMPUS: { variant: 'info', label: 'Izin Kampus' },
    REJECTED: { variant: 'danger', label: 'Ditolak' },
    APPROVED: { variant: 'success', label: 'Disetujui' },
    INHAL: { variant: 'primary', label: 'INHAL', dot: true },
  };

  const { variant, label, dot } = config[status] || { variant: 'default', label: status };

  return <Badge variant={variant} dot={dot} size="sm">{label}</Badge>;
}
