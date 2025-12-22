'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassItem } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EnrollPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [enrolling, setEnrolling] = useState<number | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [loading, user, router]);

    useEffect(() => {
        if (user) {
            api.getOpenClasses()
                .then(res => setClasses(res.data))
                .finally(() => setLoadingData(false));
        }
    }, [user]);

    const handleEnroll = async (classId: number) => {
        setEnrolling(classId);
        setMessage(null);
        try {
            await api.enrollClass(classId);
            setMessage({ type: 'success', text: 'Berhasil mendaftar!' });
            // Refresh list
            const res = await api.getOpenClasses();
            setClasses(res.data);
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mendaftar' });
        } finally {
            setEnrolling(null);
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
                        <h1 className="text-xl font-bold text-gray-800">Daftar Kelas</h1>
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
                ) : classes.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">Tidak ada kelas tersedia</div>
                ) : (
                    <div className="space-y-4">
                        {classes.map((cls) => (
                            <div key={cls.id} className="bg-white rounded-xl p-5 border">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-800">{cls.course.name}</h3>
                                        <p className="text-sm text-gray-500">{cls.course.code} • {cls.name}</p>
                                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                            <span>📅 {cls.day_name}</span>
                                            <span>🕐 {cls.time_slot?.label}</span>
                                            <span>🏠 {cls.room?.code}</span>
                                        </div>
                                        {cls.assistants && cls.assistants.length > 0 && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Asisten: {cls.assistants.map(a => a.user.name).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-medium ${cls.is_available ? 'text-green-600' : 'text-red-600'}`}>
                                            {cls.available_quota}/{cls.quota} tersedia
                                        </p>
                                        <button
                                            onClick={() => handleEnroll(cls.id)}
                                            disabled={!cls.is_available || enrolling === cls.id}
                                            className={`mt-2 px-4 py-2 rounded-lg text-sm transition ${cls.is_available
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            {enrolling === cls.id ? 'Mendaftar...' : cls.is_available ? 'Daftar' : 'Penuh'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
