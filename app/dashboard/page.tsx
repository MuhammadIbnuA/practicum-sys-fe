'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassItem } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
    const [teachingClasses, setTeachingClasses] = useState<ClassItem[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (user) {
            Promise.all([
                api.getMyClasses().catch(() => ({ data: [] })),
                api.getTeachingSchedule().catch(() => ({ data: [] }))
            ]).then(([studentRes, teachingRes]) => {
                setMyClasses(studentRes.data);
                setTeachingClasses(teachingRes.data);
                setLoadingData(false);
            });
        }
    }, [user]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
                        <p className="text-sm text-gray-500">{user.name} ({user.email})</p>
                    </div>
                    <div className="flex gap-3">
                        {user.is_admin && (
                            <Link href="/admin" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
                                Admin Panel
                            </Link>
                        )}
                        <button onClick={logout} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {loadingData ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Student Classes */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">📚 Kelas Saya (Praktikan)</h2>
                                <Link href="/enroll" className="text-blue-600 text-sm hover:underline">
                                    + Daftar Kelas
                                </Link>
                            </div>

                            {myClasses.length === 0 ? (
                                <div className="bg-white rounded-xl p-6 text-center text-gray-500 border">
                                    Belum ada kelas terdaftar
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myClasses.map((cls) => (
                                        <Link
                                            key={cls.id}
                                            href={`/student/class/${cls.id}`}
                                            className="block bg-white rounded-xl p-4 border hover:shadow-md transition"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-800">{cls.course.name}</h3>
                                                    <p className="text-sm text-gray-500">{cls.name}</p>
                                                </div>
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                    {cls.day_name || 'Senin'} • {cls.time_slot?.label || ''}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Ruang: {cls.room?.code || '-'}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Teaching Classes */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">👨‍🏫 Mengajar (Asisten)</h2>
                            </div>

                            {teachingClasses.length === 0 ? (
                                <div className="bg-white rounded-xl p-6 text-center text-gray-500 border">
                                    Tidak ada kelas yang diajar
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {teachingClasses.map((cls) => (
                                        <Link
                                            key={cls.id}
                                            href={`/teaching/class/${cls.id}`}
                                            className="block bg-white rounded-xl p-4 border hover:shadow-md transition"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-800">{cls.course.name}</h3>
                                                    <p className="text-sm text-gray-500">{cls.name}</p>
                                                </div>
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                    {cls.student_count || 0} mahasiswa
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {cls.day_name} • {cls.time_slot?.label || ''} • {cls.room?.code || ''}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* Quick Actions */}
                <section className="mt-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">⚡ Aksi Cepat</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/schedule" className="bg-white rounded-xl p-4 border hover:shadow-md transition text-center">
                            <span className="text-2xl">📅</span>
                            <p className="text-sm mt-2 text-gray-700">Jadwal Saya</p>
                        </Link>
                        <Link href="/enroll" className="bg-white rounded-xl p-4 border hover:shadow-md transition text-center">
                            <span className="text-2xl">📝</span>
                            <p className="text-sm mt-2 text-gray-700">Daftar Kelas</p>
                        </Link>
                        {teachingClasses.length > 0 && (
                            <Link href={`/teaching/class/${teachingClasses[0]?.id}`} className="bg-white rounded-xl p-4 border hover:shadow-md transition text-center">
                                <span className="text-2xl">✅</span>
                                <p className="text-sm mt-2 text-gray-700">Kelola Absensi</p>
                            </Link>
                        )}
                        {user.is_admin && (
                            <Link href="/admin" className="bg-white rounded-xl p-4 border hover:shadow-md transition text-center">
                                <span className="text-2xl">⚙️</span>
                                <p className="text-sm mt-2 text-gray-700">Admin Panel</p>
                            </Link>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
