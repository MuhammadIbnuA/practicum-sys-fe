'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AssistantSession {
    session_number: number;
    checked_in: boolean;
    check_in_time: string | null;
}

interface AssistantRecap {
    assistant_id: number;
    assistant_name: string;
    assistant_email: string;
    sessions: AssistantSession[];
    stats: {
        present_count: number;
        total_sessions: number;
        attendance_percentage: number;
    };
}

interface ClassRecap {
    class_id: number;
    class_name: string;
    course: { code: string; name: string };
    total_sessions: number;
    assistants: AssistantRecap[];
}

export default function AssistantRecapPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [recap, setRecap] = useState<ClassRecap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }
        if (!authLoading && user && !user.is_admin) {
            router.push('/dashboard');
            return;
        }
        if (user?.is_admin) {
            loadRecap();
        }
    }, [user, authLoading, router]);

    const loadRecap = async () => {
        try {
            setLoading(true);
            const response = await api.request<ClassRecap[]>('/api/admin/assistant-recap');
            setRecap(response.data || []);
        } catch (err) {
            console.error('Load recap error:', err);
            setError('Gagal memuat data rekap kehadiran asisten.');
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

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-red-400 text-xl">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Rekap Kehadiran Asisten</h1>
                    <p className="text-slate-400">Monitoring check-in asisten per kelas dan pertemuan</p>
                </div>

                {/* Classes List */}
                {recap.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                        <p className="text-slate-400">Belum ada data kehadiran asisten.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {recap.map(cls => (
                            <div key={cls.class_id} className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
                                {/* Class Header */}
                                <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
                                    <h2 className="text-xl font-bold text-white">
                                        {cls.course.code} - {cls.class_name}
                                    </h2>
                                    <p className="text-amber-100">{cls.course.name}</p>
                                </div>

                                {/* Assistants Table */}
                                <div className="p-6 overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left">
                                                <th className="text-slate-400 font-medium pb-4 pr-4 whitespace-nowrap">
                                                    Asisten
                                                </th>
                                                {Array.from({ length: cls.total_sessions }, (_, i) => (
                                                    <th key={i} className="text-slate-400 font-medium pb-4 px-2 text-center">
                                                        P{i + 1}
                                                    </th>
                                                ))}
                                                <th className="text-slate-400 font-medium pb-4 pl-4 text-center">
                                                    %
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cls.assistants.map(asst => (
                                                <tr key={asst.assistant_id} className="border-t border-slate-700">
                                                    <td className="py-4 pr-4">
                                                        <div>
                                                            <p className="text-white font-medium">{asst.assistant_name}</p>
                                                            <p className="text-slate-500 text-sm">{asst.assistant_email}</p>
                                                        </div>
                                                    </td>
                                                    {asst.sessions.map((session, idx) => (
                                                        <td key={idx} className="py-4 px-2 text-center">
                                                            <div
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${session.checked_in
                                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                                        : 'bg-slate-700/50 text-slate-500'
                                                                    }`}
                                                                title={session.check_in_time || 'Belum check-in'}
                                                            >
                                                                {session.checked_in ? '✓' : '−'}
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td className="py-4 pl-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${asst.stats.attendance_percentage >= 80
                                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                                : asst.stats.attendance_percentage >= 50
                                                                    ? 'bg-amber-500/20 text-amber-400'
                                                                    : 'bg-red-500/20 text-red-400'
                                                            }`}>
                                                            {asst.stats.attendance_percentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {cls.assistants.length === 0 && (
                                        <p className="text-slate-500 text-center py-4">Belum ada asisten untuk kelas ini.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
