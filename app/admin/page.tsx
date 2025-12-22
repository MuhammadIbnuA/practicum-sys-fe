'use client';

import { useAuth } from '@/lib/auth';
import { api, MasterScheduleData, TimeSlot, Room } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [schedule, setSchedule] = useState<MasterScheduleData | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.push('/');
        if (!loading && user && !user.is_admin) router.push('/dashboard');
    }, [loading, user, router]);

    useEffect(() => {
        if (user?.is_admin) {
            api.getMasterSchedule(1)  // Default to semester 1
                .then(res => setSchedule(res.data))
                .catch(() => { })
                .finally(() => setLoadingData(false));
        }
    }, [user]);

    if (loading || !user || !user.is_admin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const days = [1, 2, 3, 4, 5];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-purple-600 text-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-purple-200 hover:text-white">
                            ← Dashboard
                        </Link>
                        <h1 className="text-xl font-bold">Admin Panel</h1>
                    </div>
                    <p className="text-sm text-purple-200">Jadwal Besar (Master Schedule)</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {loadingData ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : !schedule ? (
                    <div className="text-center text-gray-500 py-12">Tidak ada jadwal</div>
                ) : (
                    <>
                        {/* Info */}
                        <div className="bg-white rounded-xl p-5 border mb-6">
                            <h2 className="font-semibold text-gray-800 mb-2">📅 {schedule.semester.name}</h2>
                            <div className="flex gap-6 text-sm text-gray-600">
                                <span>🏠 Ruang: {schedule.rooms.map(r => r.code).join(', ')}</span>
                                <span>🕐 {schedule.timeSlots.length} slot waktu</span>
                            </div>
                        </div>

                        {/* Schedule Grid */}
                        {schedule.rooms.map((room: Room) => (
                            <div key={room.id} className="mb-8">
                                <h3 className="font-semibold text-gray-800 mb-3">🏠 {room.name} ({room.code})</h3>
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
                                                        const cls = schedule.schedule[day]?.[slot.slot_number]?.[room.code];
                                                        return (
                                                            <td key={day} className="px-2 py-2">
                                                                {cls ? (
                                                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                                                                        <p className="font-medium text-purple-800 text-sm">{cls.course?.code}</p>
                                                                        <p className="text-xs text-purple-600">{cls.name}</p>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {cls.enrolled_count || 0}/{cls.quota} • {cls.assistants?.map(a => a.user.name).join(', ') || 'No asst'}
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-16 bg-gray-50 rounded-lg border border-dashed border-gray-200"></div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </main>
        </div>
    );
}
