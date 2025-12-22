'use client';

import { useAuth } from '@/lib/auth';
import { api, RecapData, RecapStudent } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

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

export default function RecapPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const classId = parseInt(params.id as string);

    const [recap, setRecap] = useState<RecapData | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [loading, user, router]);

    useEffect(() => {
        if (user && classId) {
            api.getAttendanceRecap(classId)
                .then(res => setRecap(res.data))
                .catch(err => setError(err.message))
                .finally(() => setLoadingData(false));
        }
    }, [user, classId]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-indigo-600 text-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-indigo-200 hover:text-white">
                            ← Dashboard
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Rekap Absensi</h1>
                            {recap && (
                                <p className="text-sm text-indigo-200">
                                    {recap.class.course?.name} - {recap.class.name}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-sm text-indigo-200">
                        {recap?.total_students || 0} Mahasiswa
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700">{error}</div>
                )}

                {loadingData ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : !recap ? (
                    <div className="text-center text-gray-500 py-12">Tidak ada data</div>
                ) : (
                    <>
                        {/* Legend */}
                        <div className="bg-white rounded-xl p-4 border mb-6 flex flex-wrap gap-4">
                            <span className="text-sm text-gray-600 font-medium">Keterangan:</span>
                            {Object.entries(STATUS_SHORT).map(([status, short]) => (
                                <span key={status} className="flex items-center gap-1 text-xs">
                                    <span className={`w-6 h-6 rounded flex items-center justify-center ${STATUS_COLORS[status] || 'bg-gray-200'}`}>
                                        {short}
                                    </span>
                                    <span className="text-gray-600">{status.replace('_', ' ')}</span>
                                </span>
                            ))}
                        </div>

                        {/* Recap Grid */}
                        <div className="bg-white rounded-xl border overflow-x-auto">
                            <table className="w-full min-w-[800px] text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="px-4 py-3 text-left font-medium text-gray-600 sticky left-0 bg-gray-50 z-10">
                                            No
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-600 sticky left-12 bg-gray-50 z-10 min-w-[200px]">
                                            Nama
                                        </th>
                                        {recap.sessions.map((s) => (
                                            <th key={s.id} className="px-2 py-3 text-center font-medium text-gray-600 min-w-[40px]">
                                                <span title={s.topic}>P{s.session_number}</span>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-center font-medium text-gray-600">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {recap.students.map((student: RecapStudent, idx: number) => {
                                        // Calculate attendance percentage
                                        let hadirCount = 0;
                                        let totalChecked = 0;
                                        recap.sessions.forEach(s => {
                                            const att = student.attendances[s.session_number];
                                            if (att) {
                                                totalChecked++;
                                                if (att.status === 'HADIR') hadirCount++;
                                            }
                                        });
                                        const percentage = totalChecked > 0 ? (hadirCount / totalChecked * 100).toFixed(0) : '-';

                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-gray-600 sticky left-0 bg-white">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-2 sticky left-12 bg-white">
                                                    <div className="font-medium text-gray-800">{student.name}</div>
                                                    <div className="text-xs text-gray-400">{student.email}</div>
                                                </td>
                                                {recap.sessions.map((s) => {
                                                    const att = student.attendances[s.session_number];
                                                    return (
                                                        <td key={s.id} className="px-1 py-2 text-center">
                                                            {att ? (
                                                                <span
                                                                    className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${STATUS_COLORS[att.status] || 'bg-gray-200'}`}
                                                                    title={`${att.status}${att.grade ? ` (${att.grade})` : ''}`}
                                                                >
                                                                    {STATUS_SHORT[att.status] || '?'}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded text-xs bg-gray-100 text-gray-400">
                                                                    -
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`font-bold ${percentage === '-' ? 'text-gray-400' :
                                                            parseInt(percentage) >= 80 ? 'text-green-600' :
                                                                parseInt(percentage) >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                        {percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Stats Footer */}
                                <tfoot className="bg-gray-50 border-t">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 font-medium text-gray-600 sticky left-0 bg-gray-50">
                                            Total Hadir
                                        </td>
                                        {recap.stats.map((stat) => (
                                            <td key={stat.session_number} className="px-1 py-3 text-center text-xs font-medium text-gray-600">
                                                {stat.hadir}/{recap.total_students}
                                            </td>
                                        ))}
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
