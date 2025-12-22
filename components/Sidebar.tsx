'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const isAdmin = user.is_admin;

    // Define menu items based on role
    const studentMenus = [
        { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
        { label: 'Jadwal Saya', href: '/schedule', icon: '📅' },
        { label: 'Enrollment', href: '/enroll', icon: '📝' },
    ];

    const adminMenus = [
        { label: 'Dashboard', href: '/admin', icon: '🏠' },
        { label: 'Kelola Semester', href: '/admin?tab=semesters', icon: '📆' },
        { label: 'Kelola Kursus', href: '/admin?tab=courses', icon: '📚' },
        { label: 'Kelola Kelas', href: '/admin?tab=classes', icon: '🏫' },
        { label: 'Jadwal Besar', href: '/admin?tab=schedule', icon: '📅' },
    ];

    const menus = isAdmin ? adminMenus : studentMenus;

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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow ${isAdmin
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                            : 'bg-gradient-to-br from-emerald-400 to-cyan-500'
                        }`}>
                        {user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${isAdmin
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                            {isAdmin ? 'Admin' : 'Mahasiswa'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {isAdmin ? 'Menu Admin' : 'Menu Utama'}
                </p>

                {menus.map((item) => {
                    const isActive = item.href.includes('?')
                        ? pathname === '/admin' && item.href.includes(pathname)
                        : pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? isAdmin
                                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}

                {/* Mahasiswa: Show Teaching Section if they have assignments */}
                {!isAdmin && (
                    <>
                        <div className="pt-4 pb-2">
                            <div className="border-t border-slate-700"></div>
                        </div>
                        <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Mengajar
                        </p>
                        <p className="px-4 text-xs text-slate-400">
                            Kelas yang Anda ajar akan muncul di Dashboard
                        </p>
                    </>
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
