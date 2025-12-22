'use client';

import { useAuth } from '@/lib/auth';
import { api, ScheduleData, TimeSlot } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SchedulePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [schedule, setSchedule] = useState<ScheduleData | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [loading, user, router]);

    useEffect(() => {
        if (user) {
            api.getMySchedule()
                .then(res => setSchedule(res.data))
                .finally(() => setLoadingData(false));
        }
    }, [user]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const days = [1, 2, 3, 4, 5];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                        ← Kembali
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">Jadwal Saya</h1>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {loadingData ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : !schedule ? (
                    <div className="text-center text-gray-500 py-12">Tidak ada jadwal</div>
                ) : (
                    <div className="bg-white rounded-xl border overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-32">Waktu</th>
                                    {days.map(day => (
                                        <th key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                                            {schedule.dayNames[day]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {schedule.timeSlots.map((slot: TimeSlot) => (
                                    <tr key={slot.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            <div className="font-medium">{slot.start_time}</div>
                                            <div className="text-xs text-gray-400">{slot.end_time}</div>
                                        </td>
                                        {days.map(day => {
                                            const cls = schedule.schedule[day]?.[slot.slot_number];
                                            return (
                                                <td key={day} className="px-2 py-2">
                                                    {cls ? (
                                                        <Link
                                                            href={`/student/class/${cls.id}`}
                                                            className="block bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition"
                                                        >
                                                            <p className="font-medium text-blue-800 text-sm">{cls.course?.code}</p>
                                                            <p className="text-xs text-blue-600">{cls.name}</p>
                                                            <p className="text-xs text-gray-500 mt-1">📍 {cls.room?.code}</p>
                                                        </Link>
                                                    ) : (
                                                        <div className="h-16"></div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
