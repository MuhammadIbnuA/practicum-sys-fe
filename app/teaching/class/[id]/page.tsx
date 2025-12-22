'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassItem, SessionItem } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function TeachingClassPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const classId = parseInt(params.id as string);

    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [currentClass, setCurrentClass] = useState<ClassItem | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [loading, user, router]);

    useEffect(() => {
        if (user) {
            api.getTeachingSchedule()
                .then(res => {
                    setClasses(res.data);
                    const found = res.data.find(c => c.id === classId);
                    setCurrentClass(found || null);
                })
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
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                        ← Kembali
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            {currentClass?.course?.name || 'Loading...'}
                        </h1>
                        <p className="text-sm text-gray-500">{currentClass?.name} • {currentClass?.student_count} mahasiswa</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {loadingData ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : !currentClass ? (
                    <div className="text-center text-gray-500 py-12">Kelas tidak ditemukan</div>
                ) : (
                    <>
                        {/* Class Info */}
                        <div className="bg-white rounded-xl p-5 border mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        📅 {currentClass.day_name} • 🕐 {currentClass.time_slot?.label} • 🏠 {currentClass.room?.code}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sessions */}
                        <div className="bg-white rounded-xl border overflow-hidden">
                            <h2 className="font-semibold text-gray-800 p-5 border-b">📅 Sesi Praktikum</h2>
                            <div className="divide-y">
                                {currentClass.sessions?.map((session: SessionItem) => (
                                    <Link
                                        key={session.id}
                                        href={`/teaching/session/${session.id}`}
                                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600">
                                                {session.session_number}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{session.topic}</p>
                                                <p className="text-xs text-gray-500">
                                                    {session.type === 'EXAM' ? '📝 Responsi' : 'Pertemuan Reguler'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {session.pending_count !== undefined && session.pending_count > 0 && (
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                                    {session.pending_count} pending
                                                </span>
                                            )}
                                            <span className="text-gray-400">→</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
