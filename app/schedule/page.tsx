'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassItem, TimeSlot } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CombinedSchedule {
    timeSlots: TimeSlot[];
    dayNames: Record<string, string>;
    // schedule[day][slot_number] = { student: ClassItem | null, teaching: ClassItem | null }
    schedule: Record<number, Record<number, { student: ClassItem | null; teaching: ClassItem | null }>>;
}

export default function SchedulePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [combined, setCombined] = useState<CombinedSchedule | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.push('/');
    }, [loading, user, router]);

    useEffect(() => {
        if (user) {
            Promise.all([
                api.getMySchedule().catch(() => null),
                api.getTeachingSchedule().catch(() => ({ data: [] }))
            ]).then(([studentRes, teachingRes]) => {
                // Build combined schedule
                const timeSlots = studentRes?.data?.timeSlots || [];
                const dayNames = studentRes?.data?.dayNames || { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat' };
                const studentSchedule = studentRes?.data?.schedule || {};
                const teachingClasses = teachingRes?.data || [];

                // Initialize combined grid
                const schedule: CombinedSchedule['schedule'] = {};
                for (let day = 1; day <= 5; day++) {
                    schedule[day] = {};
                    for (const slot of timeSlots) {
                        schedule[day][slot.slot_number] = {
                            student: studentSchedule[day]?.[slot.slot_number] || null,
                            teaching: null
                        };
                    }
                }

                // Add teaching classes
                for (const cls of teachingClasses) {
                    const day = cls.day_of_week;
                    const slotNum = cls.time_slot?.slot_number;
                    if (day && slotNum && schedule[day]?.[slotNum]) {
                        schedule[day][slotNum].teaching = cls;
                    }
                }

                setCombined({ timeSlots, dayNames, schedule });
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

    const days = [1, 2, 3, 4, 5];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                            ← Kembali
                        </Link>
                        <h1 className="text-xl font-bold text-gray-800">Jadwal Saya</h1>
                    </div>
                    <div className="flex gap-4 text-xs">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-blue-500"></span> Praktikan
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded bg-green-500"></span> Mengajar
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {loadingData ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : !combined || combined.timeSlots.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">Tidak ada jadwal</div>
                ) : (
                    <div className="bg-white rounded-xl border overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-32">Waktu</th>
                                    {days.map(day => (
                                        <th key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                                            {combined.dayNames[day]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {combined.timeSlots.map((slot: TimeSlot) => (
                                    <tr key={slot.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            <div className="font-medium">{slot.start_time}</div>
                                            <div className="text-xs text-gray-400">{slot.end_time}</div>
                                        </td>
                                        {days.map(day => {
                                            const cell = combined.schedule[day]?.[slot.slot_number];
                                            const studentCls = cell?.student;
                                            const teachingCls = cell?.teaching;

                                            return (
                                                <td key={day} className="px-2 py-2">
                                                    <div className="space-y-1">
                                                        {/* Teaching Class */}
                                                        {teachingCls && (
                                                            <Link
                                                                href={`/teaching/class/${teachingCls.id}`}
                                                                className="block bg-green-50 border border-green-300 rounded-lg p-2 hover:bg-green-100 transition"
                                                            >
                                                                <p className="font-medium text-green-800 text-xs">{teachingCls.course?.code}</p>
                                                                <p className="text-xs text-green-600">{teachingCls.name}</p>
                                                                <p className="text-xs text-gray-500">👨‍🏫 Mengajar • {teachingCls.room?.code}</p>
                                                            </Link>
                                                        )}
                                                        {/* Student Class */}
                                                        {studentCls && (
                                                            <Link
                                                                href={`/student/class/${studentCls.id}`}
                                                                className="block bg-blue-50 border border-blue-200 rounded-lg p-2 hover:bg-blue-100 transition"
                                                            >
                                                                <p className="font-medium text-blue-800 text-xs">{studentCls.course?.code}</p>
                                                                <p className="text-xs text-blue-600">{studentCls.name}</p>
                                                                <p className="text-xs text-gray-500">📚 Praktikan • {studentCls.room?.code}</p>
                                                            </Link>
                                                        )}
                                                        {/* Empty */}
                                                        {!teachingCls && !studentCls && (
                                                            <div className="h-12"></div>
                                                        )}
                                                    </div>
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
