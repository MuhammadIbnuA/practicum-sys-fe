import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export function TableRow({ 
  children, 
  className = '',
  onClick,
  hover = false,
}: { 
  children: ReactNode; 
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}) {
  return (
    <tr 
      className={`
        ${hover ? 'hover:bg-gray-50 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ 
  children, 
  className = '',
  align = 'left',
}: { 
  children: ReactNode; 
  className?: string;
  align?: 'left' | 'center' | 'right';
}) {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <th className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${alignments[align]} ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ 
  children, 
  className = '',
  align = 'left',
}: { 
  children: ReactNode; 
  className?: string;
  align?: 'left' | 'center' | 'right';
}) {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td className={`px-4 py-3 text-sm text-gray-700 ${alignments[align]} ${className}`}>
      {children}
    </td>
  );
}
