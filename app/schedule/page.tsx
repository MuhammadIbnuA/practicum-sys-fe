'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassItem, TimeSlot } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, EmptyState, LoadingInline } from '@/components/ui';

interface CombinedSchedule {
  timeSlots: TimeSlot[];
  dayNames: Record<string, string>;
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
        api.getTeachingSchedule().catch(() => ({ data: { data: [] } }))
      ]).then(([studentRes, teachingRes]) => {
        const timeSlots = studentRes?.data?.timeSlots || [];
        const dayNames = studentRes?.data?.dayNames || { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat' };
        const studentSchedule = studentRes?.data?.schedule || {};
        // Handle paginated response from getTeachingSchedule
        const teachingClasses = Array.isArray(teachingRes?.data) ? teachingRes.data : (teachingRes?.data?.data || []);

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
    return <LoadingInline className="min-h-screen" />;
  }

  const days = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Jadwal Saya</h1>
              <p className="text-gray-500 mt-1">Kelas praktikan dan mengajar</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Kembali</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-sm text-gray-600">Praktikan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-600">Mengajar</span>
          </div>
        </div>

        {loadingData ? (
          <LoadingInline />
        ) : !combined || combined.timeSlots.length === 0 ? (
          <Card>
            <EmptyState
              icon="📅"
              title="Tidak ada jadwal"
              description="Anda belum mendaftar kelas apapun"
              action={{ label: 'Daftar Kelas', onClick: () => router.push('/enroll') }}
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                      Waktu
                    </th>
                    {days.map(day => (
                      <th key={day} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {combined.dayNames[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {combined.timeSlots.map((slot: TimeSlot) => (
                    <tr key={slot.id}>
                      <td className="px-4 py-3 align-top">
                        <div className="text-sm font-medium text-gray-900">{slot.start_time}</div>
                        <div className="text-xs text-gray-400">{slot.end_time}</div>
                      </td>
                      {days.map(day => {
                        const cell = combined.schedule[day]?.[slot.slot_number];
                        const studentCls = cell?.student;
                        const teachingCls = cell?.teaching;

                        return (
                          <td key={day} className="px-2 py-2 align-top">
                            <div className="space-y-2 min-h-[60px]">
                              {teachingCls && (
                                <Link href={`/teaching/class/${teachingCls.id}`}>
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 hover:bg-emerald-100 transition-colors cursor-pointer">
                                    <p className="font-medium text-emerald-900 text-xs truncate">{teachingCls.course?.code}</p>
                                    <p className="text-xs text-emerald-600 truncate">{teachingCls.name}</p>
                                    <Badge variant="success" size="sm" className="mt-1.5">Mengajar</Badge>
                                  </div>
                                </Link>
                              )}
                              {studentCls && (
                                <Link href={`/student/class/${studentCls.id}`}>
                                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 hover:bg-indigo-100 transition-colors cursor-pointer">
                                    <p className="font-medium text-indigo-900 text-xs truncate">{studentCls.course?.code}</p>
                                    <p className="text-xs text-indigo-600 truncate">{studentCls.name}</p>
                                    <Badge variant="primary" size="sm" className="mt-1.5">Praktikan</Badge>
                                  </div>
                                </Link>
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
          </Card>
        )}
      </main>
    </div>
  );
}
