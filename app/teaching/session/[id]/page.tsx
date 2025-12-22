'use client';

import { useAuth } from '@/lib/auth';
import { api, RosterData, RosterStudent } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
    HADIR: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    ALPHA: 'bg-red-100 text-red-700',
    REJECTED: 'bg-red-100 text-red-700',
    IZIN_SAKIT: 'bg-blue-100 text-blue-700',
    IZIN_LAIN: 'bg-blue-100 text-blue-700',
    IZIN_KAMPUS: 'bg-purple-100 text-purple-700',
};

export default function SessionPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const sessionId = parseInt(params.id as string);

    const [roster, setRoster] = useState<RosterData | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [loading, user, router]);

    const loadRoster = async () => {
        try {
            const res = await api.getSessionRoster(sessionId);
            setRoster(res.data);
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal memuat' });
        }
    };

    useEffect(() => {
        if (user && sessionId) {
            loadRoster().finally(() => setLoadingData(false));
        }
    }, [user, sessionId]);

    const handleApprove = async (attendanceId: number) => {
        setProcessing(attendanceId);
        try {
            await api.approveAttendance(attendanceId);
            setMessage({ type: 'success', text: 'Berhasil disetujui!' });
            await loadRoster();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal' });
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (attendanceId: number) => {
        setProcessing(attendanceId);
        try {
            await api.rejectAttendance(attendanceId);
            setMessage({ type: 'success', text: 'Ditolak' });
            await loadRoster();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal' });
        } finally {
            setProcessing(null);
        }
    };

    const handleCheckIn = async () => {
        try {
            await api.checkIn(sessionId);
            setMessage({ type: 'success', text: 'Check-in berhasil!' });
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal check-in' });
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                            ← Kembali
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">
                                {roster?.session?.topic || 'Loading...'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {roster?.class?.course?.name} • {roster?.class?.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCheckIn}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                        ✓ Check-in
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {message && (
                    <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {loadingData ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : roster ? (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-xl p-4 border text-center">
                                <p className="text-2xl font-bold text-yellow-600">{roster.status_counts.pending}</p>
                                <p className="text-xs text-gray-500">Pending</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border text-center">
                                <p className="text-2xl font-bold text-green-600">{roster.status_counts.hadir}</p>
                                <p className="text-xs text-gray-500">Hadir</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border text-center">
                                <p className="text-2xl font-bold text-red-600">{roster.status_counts.alpha}</p>
                                <p className="text-xs text-gray-500">Belum Absen</p>
                            </div>
                        </div>

                        {/* Roster */}
                        <div className="bg-white rounded-xl border overflow-hidden">
                            <h2 className="font-semibold text-gray-800 p-5 border-b">📋 Daftar Mahasiswa ({roster.student_count})</h2>
                            <div className="divide-y">
                                {roster.roster.map((student: RosterStudent) => (
                                    <div key={student.student_id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                        <div>
                                            <p className="font-medium text-gray-800">{student.student_name}</p>
                                            <p className="text-xs text-gray-500">{student.student_email}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {student.attendance?.status === 'PENDING' && student.attendance.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(student.attendance!.id!)}
                                                        disabled={processing === student.attendance.id}
                                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(student.attendance!.id!)}
                                                        disabled={processing === student.attendance.id}
                                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                                    >
                                                        ✗
                                                    </button>
                                                </>
                                            ) : student.attendance?.status ? (
                                                <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[student.attendance.status] || 'bg-gray-100'}`}>
                                                    {student.attendance.status}
                                                    {student.attendance.grade !== null && ` (${student.attendance.grade})`}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">Belum absen</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-500 py-12">Gagal memuat data</div>
                )}
            </main>
        </div>
    );
}
