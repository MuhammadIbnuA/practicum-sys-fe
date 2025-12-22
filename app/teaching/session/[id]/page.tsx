'use client';

import { useAuth } from '@/lib/auth';
import { api, RosterData, RosterStudent } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
    HADIR: 'bg-green-100 text-green-700 border-green-200',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    ALPHA: 'bg-red-100 text-red-700 border-red-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    IZIN_SAKIT: 'bg-blue-100 text-blue-700 border-blue-200',
    IZIN_LAIN: 'bg-blue-100 text-blue-700 border-blue-200',
    IZIN_KAMPUS: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function SessionPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const sessionId = parseInt(params.id as string);

    const [roster, setRoster] = useState<RosterData | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    const [finalizing, setFinalizing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
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

    const handleFinalize = async () => {
        setFinalizing(true);
        setShowConfirm(false);
        try {
            const res = await api.finalizeSession(sessionId);
            setMessage({
                type: 'success',
                text: `Rekap selesai! ${res.data.markedAlpha} mahasiswa ditandai ALPHA.`
            });
            await loadRoster();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal finalisasi' });
        } finally {
            setFinalizing(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    const isFinalized = roster?.session?.is_finalized;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
                <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={roster?.class?.id ? `/teaching/class/${roster.class.id}` : '/dashboard'}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
                        >
                            <span>←</span>
                            <span className="hidden sm:inline">Kembali</span>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold">
                                    Pertemuan {roster?.session?.session_number || '?'}
                                </h1>
                                {isFinalized && (
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                                        ✓ Selesai
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-indigo-200">
                                {roster?.class?.course?.name} • {roster?.class?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCheckIn}
                            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition text-sm flex items-center gap-2"
                        >
                            <span>✓</span>
                            <span className="hidden sm:inline">Check-in</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Messages */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
                            <span>{message.text}</span>
                        </div>
                        <button onClick={() => setMessage(null)} className="hover:opacity-70">✕</button>
                    </div>
                )}

                {loadingData ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                ) : roster ? (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-2xl p-5 border shadow-sm">
                                <p className="text-3xl font-bold text-yellow-600">{roster.status_counts.pending}</p>
                                <p className="text-sm text-gray-500 mt-1">Pending</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 border shadow-sm">
                                <p className="text-3xl font-bold text-green-600">{roster.status_counts.hadir}</p>
                                <p className="text-sm text-gray-500 mt-1">Hadir</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 border shadow-sm">
                                <p className="text-3xl font-bold text-red-600">{roster.status_counts.alpha}</p>
                                <p className="text-sm text-gray-500 mt-1">Alpha</p>
                            </div>
                            <div className="bg-white rounded-2xl p-5 border shadow-sm">
                                <p className="text-3xl font-bold text-gray-600">{roster.student_count}</p>
                                <p className="text-sm text-gray-500 mt-1">Total</p>
                            </div>
                        </div>

                        {/* Rekap Button */}
                        {!isFinalized && (
                            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-2xl">📋</span>
                                            Rekap Sesi
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Finalisasi sesi dan tandai mahasiswa yang belum absen sebagai <strong>ALPHA</strong>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowConfirm(true)}
                                        disabled={finalizing}
                                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {finalizing ? (
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <span>📋</span>
                                        )}
                                        Rekap Sekarang
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Confirmation Modal */}
                        {showConfirm && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                                    <div className="text-center">
                                        <div className="text-5xl mb-4">⚠️</div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">Konfirmasi Rekap</h3>
                                        <p className="text-gray-600 mb-6">
                                            {roster.status_counts.alpha} mahasiswa yang belum absen akan ditandai sebagai <strong className="text-red-600">ALPHA</strong>.
                                            Aksi ini tidak dapat dibatalkan.
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowConfirm(false)}
                                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={handleFinalize}
                                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold"
                                            >
                                                Ya, Rekap
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Roster */}
                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                            <div className="p-5 border-b flex items-center justify-between">
                                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span>📋</span>
                                    Daftar Mahasiswa
                                </h2>
                                <span className="text-sm text-gray-500">{roster.student_count} mahasiswa</span>
                            </div>
                            <div className="divide-y">
                                {roster.roster.map((student: RosterStudent) => (
                                    <div key={student.student_id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {student.student_name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{student.student_name}</p>
                                                <p className="text-xs text-gray-500">{student.student_email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {student.attendance?.status === 'PENDING' && student.attendance.id ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleApprove(student.attendance!.id!)}
                                                        disabled={processing === student.attendance.id}
                                                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <span>✓</span>
                                                        <span className="hidden sm:inline">Setuju</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(student.attendance!.id!)}
                                                        disabled={processing === student.attendance.id}
                                                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <span>✗</span>
                                                        <span className="hidden sm:inline">Tolak</span>
                                                    </button>
                                                </div>
                                            ) : student.attendance?.status ? (
                                                <span className={`text-xs px-4 py-2 rounded-full font-medium border ${STATUS_COLORS[student.attendance.status] || 'bg-gray-100 border-gray-200'}`}>
                                                    {student.attendance.status.replace('_', ' ')}
                                                    {student.attendance.grade !== null && ` (${student.attendance.grade})`}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 px-4 py-2 bg-gray-50 rounded-full border border-dashed border-gray-300">
                                                    Belum absen
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">😕</div>
                        <p className="text-gray-500">Gagal memuat data</p>
                    </div>
                )}
            </main>
        </div>
    );
}
