'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassItem, SessionItem } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, EmptyState, LoadingInline } from '@/components/ui';

export default function TeachingClassPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classId = parseInt(params.id as string);

  const [currentClass, setCurrentClass] = useState<ClassItem | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      api.getTeachingSchedule()
        .then(res => {
          // Handle paginated response
          const classes = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          const found = classes.find(c => c.id === classId);
          setCurrentClass(found || null);
        })
        .finally(() => setLoadingData(false));
    }
  }, [user, classId]);

  if (loading || !user) {
    return <LoadingInline className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {currentClass?.course?.name || 'Loading...'}
              </h1>
              <p className="text-sm text-gray-500">
                {currentClass?.name} • {currentClass?.student_count || 0} mahasiswa
              </p>
            </div>
            <Link href={`/recap/${classId}`}>
              <Button variant="primary" size="sm">Rekap Absensi</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loadingData ? (
          <LoadingInline />
        ) : !currentClass ? (
          <Card>
            <EmptyState
              icon="📚"
              title="Kelas tidak ditemukan"
              description="Anda tidak memiliki akses ke kelas ini"
            />
          </Card>
        ) : (
          <>
            {/* Class Info */}
            <Card className="mb-6">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  {currentClass.day_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  {currentClass.time_slot?.label}
                </span>
                <span className="flex items-center gap-1.5">
                  <LocationIcon className="w-4 h-4 text-gray-400" />
                  {currentClass.room?.code}
                </span>
              </div>
            </Card>

            {/* Sessions */}
            <Card padding="none">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Sesi Praktikum</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {currentClass.sessions?.map((session: SessionItem) => (
                  <Link
                    key={session.id}
                    href={`/teaching/session/${session.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-sm">
                        {session.session_number}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{session.topic}</p>
                        <p className="text-xs text-gray-500">
                          {session.type === 'EXAM' ? 'Responsi' : 'Pertemuan Reguler'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {session.pending_count !== undefined && session.pending_count > 0 && (
                        <Badge variant="warning" size="sm">
                          {session.pending_count} pending
                        </Badge>
                      )}
                      {session.is_finalized && (
                        <Badge variant="success" size="sm">Selesai</Badge>
                      )}
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
