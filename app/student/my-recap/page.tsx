'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface SessionRecap {
    session_number: number;
    topic: string;
    type: string;
    status: string | null;
    grade: number | null;
    submitted_at: string | null;
}

interface ClassRecap {
    class_id: number;
    class_name: string;
    course: { code: string; name: string };
    semester: { name: string };
    sessions: SessionRecap[];
    stats: {
        present_count: number;
        total_sessions: number;
        attendance_percentage: number;
        average_grade: number | null;
    };
}

const STATUS_COLORS: Record<string, string> = {
    HADIR: 'bg-emerald-500/20 text-emerald-400',
    PENDING: 'bg-amber-500/20 text-amber-400',
    ALPHA: 'bg-red-500/20 text-red-400',
    IZIN_SAKIT: 'bg-blue-500/20 text-blue-400',
    IZIN_LAIN: 'bg-purple-500/20 text-purple-400',
    IZIN_KAMPUS: 'bg-cyan-500/20 text-cyan-400',
    REJECTED: 'bg-slate-500/20 text-slate-400',
};

export default function MyRecapPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [recaps, setRecaps] = useState<ClassRecap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }
        if (user) {
            loadRecap();
        }
    }, [user, authLoading, router]);

    const loadRecap = async () => {
        try {
            setLoading(true);
            const response = await api.request<ClassRecap[]>('/api/student/my-recap');
            setRecaps(response.data || []);
        } catch (err) {
            console.error('Load recap error:', err);
            setError('Gagal memuat rekap kehadiran.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Rekap Kehadiran Saya</h1>
                    <p className="text-slate-400">Monitoring kehadiran Anda di semua kelas yang diikuti</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 text-red-400 p-4 rounded-xl mb-6">{error}</div>
                )}

                {/* Classes */}
                {recaps.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                        <p className="text-slate-400">Anda belum terdaftar di kelas manapun.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {recaps.map(cls => (
                            <div key={cls.class_id} className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
                                {/* Class Header */}
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                                    <h2 className="text-xl font-bold text-white">
                                        {cls.course.code} - {cls.class_name}
                                    </h2>
                                    <p className="text-indigo-100">{cls.course.name}</p>
                                    <p className="text-indigo-200 text-sm">{cls.semester.name}</p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 p-4 border-b border-slate-700">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-emerald-400">{cls.stats.present_count}</p>
                                        <p className="text-slate-400 text-sm">Hadir</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white">{cls.stats.attendance_percentage}%</p>
                                        <p className="text-slate-400 text-sm">Kehadiran</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-amber-400">
                                            {cls.stats.average_grade || '-'}
                                        </p>
                                        <p className="text-slate-400 text-sm">Rata-rata Nilai</p>
                                    </div>
                                </div>

                                {/* Sessions Grid */}
                                <div className="p-6 overflow-x-auto">
                                    <div className="flex gap-2">
                                        {cls.sessions.map((session, idx) => (
                                            <div key={idx} className="flex flex-col items-center min-w-[60px]">
                                                <span className="text-slate-400 text-xs mb-2">P{session.session_number}</span>
                                                <div
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${session.status
                                                            ? STATUS_COLORS[session.status] || 'bg-slate-700 text-slate-400'
                                                            : 'bg-slate-700/50 text-slate-500'
                                                        }`}
                                                    title={session.topic}
                                                >
                                                    {session.status === 'HADIR' && '✓'}
                                                    {session.status === 'ALPHA' && '✗'}
                                                    {session.status === 'PENDING' && '⏳'}
                                                    {session.status?.startsWith('IZIN') && 'I'}
                                                    {!session.status && '−'}
                                                </div>
                                                {session.grade && (
                                                    <span className="text-xs text-slate-400 mt-1">{session.grade}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="px-6 pb-4 flex flex-wrap gap-3 text-xs">
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-emerald-500/40"></span>
                                        <span className="text-slate-400">Hadir</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-amber-500/40"></span>
                                        <span className="text-slate-400">Pending</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-red-500/40"></span>
                                        <span className="text-slate-400">Alpha</span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded bg-blue-500/40"></span>
                                        <span className="text-slate-400">Izin</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
