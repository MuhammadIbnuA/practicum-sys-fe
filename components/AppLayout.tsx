'use client';

import { useAuth } from '@/lib/auth';
import Sidebar from './Sidebar';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { user, loading } = useAuth();

    // Show loading or just content if not logged in (login page)
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    // If not logged in, render children without sidebar (for login page)
    if (!user) {
        return <>{children}</>;
    }

    // Logged in: render with sidebar
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
