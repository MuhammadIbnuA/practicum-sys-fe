'use client';

import { ReactNode, useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  className = '',
}: TabsProps) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-sm',
  };

  const variants = {
    default: {
      container: 'border-b border-gray-200',
      tab: 'border-b-2 -mb-px',
      active: 'border-indigo-600 text-indigo-600',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg',
      tab: 'rounded-md',
      active: 'bg-white text-gray-900 shadow-sm',
      inactive: 'text-gray-600 hover:text-gray-900',
    },
    underline: {
      container: '',
      tab: 'border-b-2',
      active: 'border-indigo-600 text-indigo-600',
      inactive: 'border-transparent text-gray-500 hover:text-gray-700',
    },
  };

  const style = variants[variant];

  return (
    <div className={`${style.container} ${className}`}>
      <nav className="flex gap-1" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 font-medium transition-all
              ${sizes[size]}
              ${style.tab}
              ${activeTab === tab.id ? style.active : style.inactive}
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${activeTab === tab.id 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

// Tab panels container
export function TabPanels({ 
  children, 
  activeTab,
  tabs,
}: { 
  children: ReactNode[];
  activeTab: string;
  tabs: Tab[];
}) {
  const activeIndex = tabs.findIndex(t => t.id === activeTab);
  return (
    <div className="mt-4">
      {children[activeIndex]}
    </div>
  );
}
