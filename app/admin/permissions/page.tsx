'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Permission {
    id: number;
    reason: string;
    status: string;
    file_name: string;
    file_data: string;
    created_at: string;
    student: { id: number; name: string; email: string };
    session: {
        session_number: number;
        class: {
            name: string;
            course: { code: string; name: string };
        };
    };
}

export default function AdminPermissionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('PENDING');
    const [processing, setProcessing] = useState<number | null>(null);

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
            loadPermissions();
        }
    }, [user, authLoading, router, filter]);

    const loadPermissions = async () => {
        try {
            setLoading(true);
            const response = await api.request<Permission[]>(`/api/admin/permissions?status=${filter}`);
            setPermissions(response.data || []);
        } catch (err) {
            console.error('Load permissions error:', err);
            setError('Gagal memuat data perizinan.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('Setujui permohonan izin ini?')) return;
        setProcessing(id);
        try {
            await api.request(`/api/admin/permissions/${id}/approve`, { method: 'PUT' });
            loadPermissions();
        } catch (err) {
            console.error('Approve error:', err);
            alert('Gagal menyetujui perizinan.');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Tolak permohonan izin ini?')) return;
        setProcessing(id);
        try {
            await api.request(`/api/admin/permissions/${id}/reject`, { method: 'PUT' });
            loadPermissions();
        } catch (err) {
            console.error('Reject error:', err);
            alert('Gagal menolak perizinan.');
        } finally {
            setProcessing(null);
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
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Manajemen Perizinan</h1>
                        <p className="text-slate-400">Approve/reject permohonan izin mahasiswa</p>
                    </div>
                    <div className="flex gap-2">
                        {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === s
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                {s === 'PENDING' ? 'Menunggu' : s === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/20 text-red-400 p-4 rounded-xl mb-6">{error}</div>
                )}

                {/* Permissions */}
                {permissions.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                        <p className="text-slate-400">Tidak ada permohonan izin dengan status ini.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {permissions.map(perm => (
                            <div key={perm.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {perm.student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{perm.student.name}</h3>
                                                <p className="text-slate-400 text-sm">{perm.student.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                            <div>
                                                <p className="text-slate-500">Kelas</p>
                                                <p className="text-white">
                                                    {perm.session.class.course.code} - {perm.session.class.name}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Pertemuan</p>
                                                <p className="text-white">P{perm.session.session_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Alasan</p>
                                                <p className="text-white">{perm.reason}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">File</p>
                                                <a
                                                    href={perm.file_data}
                                                    download={perm.file_name}
                                                    className="text-indigo-400 hover:text-indigo-300"
                                                >
                                                    📎 {perm.file_name}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {filter === 'PENDING' && (
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleApprove(perm.id)}
                                                disabled={processing === perm.id}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50"
                                            >
                                                ✓ Setujui
                                            </button>
                                            <button
                                                onClick={() => handleReject(perm.id)}
                                                disabled={processing === perm.id}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50"
                                            >
                                                ✗ Tolak
                                            </button>
                                        </div>
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
