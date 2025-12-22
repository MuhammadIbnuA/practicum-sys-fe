'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassReport } from '@/lib/api';
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

const STATUS_LABELS: Record<string, string> = {
    HADIR: 'Hadir',
    PENDING: 'Menunggu',
    ALPHA: 'Alpha',
    REJECTED: 'Ditolak',
    IZIN_SAKIT: 'Izin Sakit',
    IZIN_LAIN: 'Izin Lain',
    IZIN_KAMPUS: 'Izin Kampus',
};

export default function StudentClassPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const classId = parseInt(params.id as string);

    const [report, setReport] = useState<ClassReport | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState<number | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [loading, user, router]);

    useEffect(() => {
        if (user && classId) {
            api.getClassReport(classId)
                .then(res => setReport(res.data))
                .catch(err => setMessage({ type: 'error', text: err.message }))
                .finally(() => setLoadingData(false));
        }
    }, [user, classId]);

    const handleSubmitAttendance = async (sessionId: number) => {
        setSubmitting(sessionId);
        setMessage(null);
        try {
            await api.submitAttendance(sessionId);
            setMessage({ type: 'success', text: 'Absensi terkirim! Menunggu persetujuan asisten.' });
            // Refresh
            const res = await api.getClassReport(classId);
            setReport(res.data);
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mengirim' });
        } finally {
            setSubmitting(null);
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
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                        ← Kembali
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            {report?.class.course.name || 'Loading...'}
                        </h1>
                        <p className="text-sm text-gray-500">{report?.class.name}</p>
                    </div>
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
                ) : report ? (
                    <>
                        {/* Summary */}
                        <div className="bg-white rounded-xl p-5 border mb-6">
                            <h2 className="font-semibold text-gray-800 mb-4">📊 Ringkasan</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">{report.summary.attendance_percentage.toFixed(0)}%</p>
                                    <p className="text-xs text-gray-500">Kehadiran</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">{report.summary.present_count}</p>
                                    <p className="text-xs text-gray-500">Hadir</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {report.summary.current_average_grade?.toFixed(1) || '-'}
                                    </p>
                                    <p className="text-xs text-gray-500">Rata-rata Nilai</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-600">{report.summary.graded_sessions}</p>
                                    <p className="text-xs text-gray-500">Dinilai</p>
                                </div>
                            </div>
                        </div>

                        {/* Sessions */}
                        <div className="bg-white rounded-xl border overflow-hidden">
                            <h2 className="font-semibold text-gray-800 p-5 border-b">📅 Pertemuan</h2>
                            <div className="divide-y">
                                {report.sessions.map((session) => (
                                    <div key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600">
                                                {session.session_number}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{session.topic}</p>
                                                <p className="text-xs text-gray-500">
                                                    {session.type === 'EXAM' ? '📝 Responsi' : 'Pertemuan'}
                                                    {session.grade !== null && ` • Nilai: ${session.grade}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {session.status ? (
                                                <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[session.status] || 'bg-gray-100'}`}>
                                                    {STATUS_LABELS[session.status] || session.status}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleSubmitAttendance(session.id)}
                                                    disabled={submitting === session.id}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                                >
                                                    {submitting === session.id ? '...' : 'Absen'}
                                                </button>
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
