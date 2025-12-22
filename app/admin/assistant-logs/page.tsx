'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AssistantLog {
    id: number;
    check_in_time: string;
    status: string;
    user: { id: number; name: string; email: string };
    session: {
        session_number: number;
        date: string;
        class: {
            name: string;
            course: { code: string; name: string };
        };
    };
}

export default function AssistantLogsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<AssistantLog[]>([]);
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
            loadLogs();
        }
    }, [user, authLoading, router]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const response = await api.request<AssistantLog[]>('/api/admin/assistants/log');
            setLogs(response.data || []);
        } catch (err) {
            console.error('Load logs error:', err);
            setError('Gagal memuat log kehadiran asisten.');
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
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Log Kehadiran Asisten</h1>
                    <p className="text-slate-400">Riwayat check-in asisten praktikum</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 text-red-400 p-4 rounded-xl mb-6">{error}</div>
                )}

                {/* Logs Table */}
                {logs.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                        <p className="text-slate-400">Belum ada log kehadiran asisten.</p>
                    </div>
                ) : (
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-700 bg-slate-800">
                                    <th className="px-6 py-4 text-slate-400 font-medium">Asisten</th>
                                    <th className="px-6 py-4 text-slate-400 font-medium">Kelas</th>
                                    <th className="px-6 py-4 text-slate-400 font-medium">Pertemuan</th>
                                    <th className="px-6 py-4 text-slate-400 font-medium">Waktu Check-in</th>
                                    <th className="px-6 py-4 text-slate-400 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white font-medium">{log.user.name}</p>
                                                <p className="text-slate-500 text-sm">{log.user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white">{log.session.class.course.code}</p>
                                                <p className="text-slate-500 text-sm">{log.session.class.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm">
                                                P{log.session.session_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {new Date(log.check_in_time).toLocaleString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-sm ${log.status === 'HADIR'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
