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
    created_at: string;
    session: {
        session_number: number;
        class: {
            name: string;
            course: { code: string; name: string };
        };
    };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Menunggu', color: 'bg-amber-500/20 text-amber-400' },
    APPROVED: { label: 'Disetujui', color: 'bg-emerald-500/20 text-emerald-400' },
    REJECTED: { label: 'Ditolak', color: 'bg-red-500/20 text-red-400' },
};

export default function MyPermissionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }
        if (user) {
            loadPermissions();
        }
    }, [user, authLoading, router]);

    const loadPermissions = async () => {
        try {
            setLoading(true);
            const response = await api.request<Permission[]>('/api/student/permissions');
            setPermissions(response.data || []);
        } catch (err) {
            console.error('Load permissions error:', err);
            setError('Gagal memuat data izin.');
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
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Permohonan Izin Saya</h1>
                    <p className="text-slate-400">Riwayat permohonan izin yang Anda ajukan</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 text-red-400 p-4 rounded-xl mb-6">{error}</div>
                )}

                {/* Permissions List */}
                {permissions.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                        <p className="text-slate-400">Anda belum mengajukan permohonan izin.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {permissions.map(perm => {
                            const status = STATUS_LABELS[perm.status] || STATUS_LABELS.PENDING;
                            return (
                                <div key={perm.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">
                                                {perm.session.class.course.code} - {perm.session.class.name}
                                            </h3>
                                            <p className="text-slate-400">
                                                Pertemuan {perm.session.session_number}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm ${status.color}`}>
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-500">Alasan</p>
                                            <p className="text-white">{perm.reason}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">File</p>
                                            <p className="text-indigo-400">{perm.file_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Tanggal Pengajuan</p>
                                            <p className="text-white">
                                                {new Date(perm.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
