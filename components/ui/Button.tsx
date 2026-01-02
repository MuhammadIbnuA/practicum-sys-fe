import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = `
    inline-flex items-center justify-center gap-2 font-medium
    rounded-lg transition-all duration-150 ease-out
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none
    active:scale-[0.98]
  `;

  const sizes = {
    xs: 'h-7 px-2.5 text-xs',
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const variants = {
    primary: `
      bg-indigo-600 text-white
      hover:bg-indigo-700
      focus-visible:ring-indigo-500
      shadow-sm hover:shadow
    `,
    secondary: `
      bg-gray-100 text-gray-900
      hover:bg-gray-200
      focus-visible:ring-gray-500
    `,
    outline: `
      border border-gray-300 bg-white text-gray-700
      hover:bg-gray-50 hover:border-gray-400
      focus-visible:ring-gray-500
    `,
    ghost: `
      text-gray-600
      hover:bg-gray-100 hover:text-gray-900
      focus-visible:ring-gray-500
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      focus-visible:ring-red-500
      shadow-sm hover:shadow
    `,
    success: `
      bg-emerald-600 text-white
      hover:bg-emerald-700
      focus-visible:ring-emerald-500
      shadow-sm hover:shadow
    `,
  };

  const width = fullWidth ? 'w-full' : '';

  const iconElement = icon && !loading && (
    <span className="flex-shrink-0">{icon}</span>
  );

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${width} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {iconPosition === 'left' && iconElement}
      {children}
      {iconPosition === 'right' && iconElement}
    </button>
  );
}
