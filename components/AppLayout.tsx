'use client';

import { useAuth } from '@/lib/auth';
import Sidebar from './Sidebar';
import { LoadingScreen } from './ui/Spinner';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Not logged in - render without sidebar (login page)
  if (!user) {
    return <>{children}</>;
  }

  // Logged in - render with sidebar
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
