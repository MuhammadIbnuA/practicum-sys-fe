'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
    label: string;
    href: string;
    icon: string;
    roles?: ('admin' | 'assistant' | 'student')[];
}

const menuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠', roles: ['admin', 'assistant', 'student'] },
    { label: 'Jadwal Saya', href: '/schedule', icon: '📅', roles: ['assistant', 'student'] },
    { label: 'Enrollment', href: '/enroll', icon: '📝', roles: ['student'] },
    { label: 'Admin Panel', href: '/admin', icon: '⚙️', roles: ['admin'] },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    // Determine user role
    const userRole = user.is_admin ? 'admin' : 'assistant'; // For now, all logged-in non-admin users are treated as potential assistants/students

    const visibleMenus = menuItems.filter(item => {
        if (!item.roles) return true;
        if (user.is_admin && item.roles.includes('admin')) return true;
        if (item.roles.includes('student')) return true; // All users can be students
        if (item.roles.includes('assistant')) return true; // Show for all, filter on backend
        return false;
    });

    return (
        <aside className="w-64 min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-xl">
            {/* Logo / Branding */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg">
                        📚
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">Praktikum</h1>
                        <p className="text-xs text-slate-400">Attendance System</p>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="px-6 py-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-lg font-bold shadow">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        {user.is_admin && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                                Admin
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {visibleMenus.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}

                {/* Divider */}
                <div className="pt-4 pb-2">
                    <div className="border-t border-slate-700"></div>
                </div>

                {/* Role-specific sections */}
                {user.is_admin && (
                    <div className="space-y-1">
                        <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Admin Menu
                        </p>
                        <Link
                            href="/admin"
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname.startsWith('/admin')
                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                }`}
                        >
                            <span className="text-lg">⚙️</span>
                            <span className="font-medium">Kelola Sistem</span>
                        </Link>
                    </div>
                )}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                >
                    <span>🚪</span>
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
