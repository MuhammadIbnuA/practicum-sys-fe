interface DividerProps {
  className?: string;
  label?: string;
  orientation?: 'horizontal' | 'vertical';
}

export default function Divider({ 
  className = '', 
  label,
  orientation = 'horizontal'
}: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={`w-px bg-gray-200 self-stretch ${className}`} />;
  }

  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    );
  }

  return <div className={`h-px bg-gray-200 ${className}`} />;
}
