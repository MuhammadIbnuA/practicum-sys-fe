'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassItem } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, EmptyState, LoadingInline } from '@/components/ui';

export default function DashboardPage() {
  const { user, loading } = useAuth();
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
    return <LoadingInline className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 mt-1">Selamat datang, {user.name}</p>
            </div>
            {user.is_admin && (
              <Link href="/admin">
                <Button variant="primary" size="sm">
                  Admin Panel
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loadingData ? (
          <LoadingInline />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard 
                label="Kelas Saya" 
                value={myClasses.length} 
                icon={<BookIcon />}
                color="indigo"
              />
              <StatCard 
                label="Mengajar" 
                value={teachingClasses.length} 
                icon={<UsersIcon />}
                color="emerald"
              />
              <StatCard 
                label="Total Sesi" 
                value={myClasses.length * 11} 
                icon={<CalendarIcon />}
                color="amber"
              />
              <StatCard 
                label="Status" 
                value="Aktif" 
                icon={<CheckIcon />}
                color="blue"
                isText
              />
            </div>

            {/* Classes Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Student Classes */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Kelas Saya</h2>
                  <Link href="/enroll">
                    <Button variant="ghost" size="sm">+ Daftar</Button>
                  </Link>
                </div>

                {myClasses.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon="📚"
                      title="Belum Ada Kelas"
                      description="Daftar kelas untuk mulai melacak kehadiran"
                      action={{ label: 'Daftar Kelas', onClick: () => router.push('/enroll') }}
                    />
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {myClasses.slice(0, 5).map((cls) => (
                      <ClassCard key={cls.id} cls={cls} href={`/student/class/${cls.id}`} />
                    ))}
                    {myClasses.length > 5 && (
                      <Link href="/student/my-recap" className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2">
                        Lihat semua ({myClasses.length} kelas)
                      </Link>
                    )}
                  </div>
                )}
              </section>

              {/* Teaching Classes */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Mengajar</h2>
                </div>

                {teachingClasses.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon="👨‍🏫"
                      title="Tidak Ada Kelas"
                      description="Anda tidak ditugaskan sebagai asisten"
                    />
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {teachingClasses.slice(0, 5).map((cls) => (
                      <ClassCard 
                        key={cls.id} 
                        cls={cls} 
                        href={`/teaching/class/${cls.id}`}
                        showStudentCount
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Quick Actions */}
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickAction href="/schedule" icon={<CalendarIcon />} label="Jadwal" />
                <QuickAction href="/enroll" icon={<PlusIcon />} label="Enrollment" />
                <QuickAction href="/student/my-recap" icon={<ChartIcon />} label="Rekap" />
                {user.is_admin && (
                  <QuickAction href="/admin" icon={<CogIcon />} label="Admin" />
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

// Components
function StatCard({ label, value, icon, color, isText }: { 
  label: string; 
  value: number | string; 
  icon: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'blue';
  isText?: boolean;
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <Card padding="sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`font-bold text-gray-900 ${isText ? 'text-sm' : 'text-xl'}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}

function ClassCard({ cls, href, showStudentCount }: { 
  cls: ClassItem; 
  href: string;
  showStudentCount?: boolean;
}) {
  return (
    <Link href={href}>
      <Card hover padding="sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{cls.course.name}</h3>
            <p className="text-sm text-gray-500">{cls.name}</p>
          </div>
          <Badge variant={showStudentCount ? 'success' : 'primary'} size="sm">
            {showStudentCount ? `${cls.student_count || 0} siswa` : cls.day_name}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <LocationIcon className="w-3.5 h-3.5" />
            {cls.room?.code || '-'}
          </span>
          <span>{cls.time_slot?.label || ''}</span>
        </div>
      </Card>
    </Link>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href}>
      <Card hover padding="sm" className="text-center">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-600">
          {icon}
        </div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
      </Card>
    </Link>
  );
}

// Icons
function BookIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
}
function UsersIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
}
function CalendarIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function CheckIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}
function LocationIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function PlusIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>;
}
function ChartIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function CogIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
