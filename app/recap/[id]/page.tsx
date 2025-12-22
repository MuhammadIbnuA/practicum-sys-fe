'use client';

import { useAuth } from '@/lib/auth';
import { api, RecapData, RecapStudent, SessionItem } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const STATUSES = ['HADIR', 'ALPHA', 'PENDING', 'IZIN_SAKIT', 'IZIN_LAIN', 'IZIN_KAMPUS', 'REJECTED'] as const;

const STATUS_SHORT: Record<string, string> = {
    HADIR: 'H',
    PENDING: 'P',
    ALPHA: 'A',
    REJECTED: 'X',
    IZIN_SAKIT: 'S',
    IZIN_LAIN: 'I',
    IZIN_KAMPUS: 'K',
};

const STATUS_COLORS: Record<string, string> = {
    HADIR: 'bg-green-500 text-white',
    PENDING: 'bg-yellow-400 text-black',
    ALPHA: 'bg-red-500 text-white',
    REJECTED: 'bg-red-300 text-white',
    IZIN_SAKIT: 'bg-blue-400 text-white',
    IZIN_LAIN: 'bg-blue-300 text-white',
    IZIN_KAMPUS: 'bg-purple-400 text-white',
};

const STATUS_LABELS: Record<string, string> = {
    HADIR: 'Hadir',
    PENDING: 'Pending',
    ALPHA: 'Alpha',
    REJECTED: 'Ditolak',
    IZIN_SAKIT: 'Izin Sakit',
    IZIN_LAIN: 'Izin Lain',
    IZIN_KAMPUS: 'Izin Kampus',
};

interface AttendanceChange {
    sessionId: number;
    studentId: number;
    status: string;
}

export default function RecapPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const classId = parseInt(params.id as string);

    const [recap, setRecap] = useState<RecapData | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [changes, setChanges] = useState<AttendanceChange[]>([]);
    const [editingCell, setEditingCell] = useState<{ studentId: number; sessionNum: number } | null>(null);

    const isAdmin = user?.is_admin || false;

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [loading, user, router]);

    const loadRecap = () => {
        if (user && classId) {
            setLoadingData(true);
            api.getAttendanceRecap(classId)
                .then(res => setRecap(res.data))
                .catch(err => setError(err.message))
                .finally(() => setLoadingData(false));
        }
    };

    useEffect(() => {
        loadRecap();
    }, [user, classId]);

    const handleStatusChange = (studentId: number, sessionId: number, sessionNum: number, newStatus: string) => {
        // Update local state immediately
        if (recap) {
            const updatedStudents = recap.students.map(student => {
                if (student.id === studentId) {
                    return {
                        ...student,
                        attendances: {
                            ...student.attendances,
                            [sessionNum]: { status: newStatus, grade: student.attendances[sessionNum]?.grade || null }
                        }
                    };
                }
                return student;
            });
            setRecap({ ...recap, students: updatedStudents });
        }

        // Track change
        setChanges(prev => {
            const existing = prev.findIndex(c => c.sessionId === sessionId && c.studentId === studentId);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = { sessionId, studentId, status: newStatus };
                return updated;
            }
            return [...prev, { sessionId, studentId, status: newStatus }];
        });
        setEditingCell(null);
    };

    const saveChanges = async () => {
        if (changes.length === 0) return;
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            // Group changes by session
            const bySession: Record<number, { studentId: number; status: string }[]> = {};
            changes.forEach(c => {
                if (!bySession[c.sessionId]) bySession[c.sessionId] = [];
                bySession[c.sessionId].push({ studentId: c.studentId, status: c.status });
            });

            // Save each session's changes using admin endpoint
            for (const [sessionId, updates] of Object.entries(bySession)) {
                await api.adminUpdateAttendance(parseInt(sessionId), updates);
            }

            setSuccess(`${changes.length} perubahan berhasil disimpan!`);
            setChanges([]);
            loadRecap();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menyimpan');
        }
        setSaving(false);
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <span>←</span>
                            <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                📊 Rekap Absensi
                            </h1>
                            {recap && (
                                <p className="text-sm text-indigo-200">
                                    {recap.class.course?.name} - {recap.class.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAdmin && changes.length > 0 && (
                            <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                ) : (
                                    <span>💾</span>
                                )}
                                Simpan ({changes.length})
                            </button>
                        )}
                        <div className="text-sm">
                            <span className="px-3 py-1 rounded-full bg-white/20">
                                {recap?.total_students || 0} Mahasiswa
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Messages */}
                {error && (
                    <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-3">
                        <span className="text-xl">✅</span>
                        <span>{success}</span>
                        <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">✕</button>
                    </div>
                )}

                {loadingData ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                ) : !recap ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-500">Tidak ada data</p>
                    </div>
                ) : (
                    <>
                        {/* Legend & Info */}
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-700">Keterangan:</span>
                                </div>
                                {Object.entries(STATUS_SHORT).map(([status, short]) => (
                                    <div key={status} className="flex items-center gap-2">
                                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${STATUS_COLORS[status]}`}>
                                            {short}
                                        </span>
                                        <span className="text-xs text-gray-600">{STATUS_LABELS[status]}</span>
                                    </div>
                                ))}
                            </div>
                            {isAdmin && (
                                <p className="mt-3 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                                    💡 <strong>Admin Mode:</strong> Klik sel untuk mengubah status absensi
                                </p>
                            )}
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                                            <th className="px-4 py-4 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 w-12">
                                                #
                                            </th>
                                            <th className="px-4 py-4 text-left font-semibold text-gray-700 sticky left-12 bg-gray-50 z-10 min-w-[200px]">
                                                Nama Mahasiswa
                                            </th>
                                            {recap.sessions.map((s: SessionItem) => (
                                                <th key={s.id} className="px-2 py-4 text-center font-semibold text-gray-700 min-w-[50px]">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs text-gray-500">P{s.session_number}</span>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-4 py-4 text-center font-semibold text-gray-700">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {recap.students.map((student: RecapStudent, idx: number) => {
                                            let hadirCount = 0;
                                            let totalChecked = 0;
                                            recap.sessions.forEach(s => {
                                                const att = student.attendances[s.session_number];
                                                if (att && att.status !== 'PENDING') {
                                                    totalChecked++;
                                                    if (att.status === 'HADIR') hadirCount++;
                                                }
                                            });
                                            const percentage = totalChecked > 0 ? Math.round(hadirCount / totalChecked * 100) : null;

                                            return (
                                                <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-4 py-3 text-gray-500 font-medium sticky left-0 bg-white">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-3 sticky left-12 bg-white">
                                                        <div className="font-semibold text-gray-800">{student.name}</div>
                                                        <div className="text-xs text-gray-400">{student.email}</div>
                                                    </td>
                                                    {recap.sessions.map((s: SessionItem) => {
                                                        const att = student.attendances[s.session_number];
                                                        const isEditing = editingCell?.studentId === student.id && editingCell?.sessionNum === s.session_number;

                                                        return (
                                                            <td key={s.id} className="px-1 py-2 text-center relative">
                                                                {isAdmin ? (
                                                                    isEditing ? (
                                                                        <select
                                                                            autoFocus
                                                                            className="absolute inset-0 w-full h-full bg-white border-2 border-indigo-500 rounded-lg text-xs z-20 cursor-pointer"
                                                                            value={att?.status || ''}
                                                                            onChange={(e) => handleStatusChange(student.id, s.id, s.session_number, e.target.value)}
                                                                            onBlur={() => setEditingCell(null)}
                                                                        >
                                                                            <option value="">-</option>
                                                                            {STATUSES.map(st => (
                                                                                <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                                                                            ))}
                                                                        </select>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => setEditingCell({ studentId: student.id, sessionNum: s.session_number })}
                                                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all hover:scale-110 hover:shadow-md ${att ? STATUS_COLORS[att.status] : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                                                                                }`}
                                                                            title={att ? `${STATUS_LABELS[att.status]}${att.grade ? ` (${att.grade})` : ''} - Klik untuk edit` : 'Klik untuk set status'}
                                                                        >
                                                                            {att ? STATUS_SHORT[att.status] : '-'}
                                                                        </button>
                                                                    )
                                                                ) : (
                                                                    <span
                                                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${att ? STATUS_COLORS[att.status] : 'bg-gray-100 text-gray-400'
                                                                            }`}
                                                                        title={att ? `${STATUS_LABELS[att.status]}${att.grade ? ` (${att.grade})` : ''}` : 'Belum ada data'}
                                                                    >
                                                                        {att ? STATUS_SHORT[att.status] : '-'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-bold ${percentage === null ? 'bg-gray-100 text-gray-400' :
                                                            percentage >= 80 ? 'bg-green-100 text-green-700' :
                                                                percentage >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {percentage !== null ? `${percentage}%` : '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2">
                                            <td colSpan={2} className="px-4 py-4 font-bold text-gray-700 sticky left-0 bg-gray-50">
                                                📊 Total Hadir
                                            </td>
                                            {recap.stats.map((stat) => (
                                                <td key={stat.session_number} className="px-1 py-4 text-center">
                                                    <span className="text-xs font-semibold text-gray-600">
                                                        {stat.hadir}/{recap.total_students}
                                                    </span>
                                                </td>
                                            ))}
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
