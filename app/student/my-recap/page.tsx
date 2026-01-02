'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, EmptyState, LoadingInline } from '@/components/ui';

interface SessionRecap {
  session_number: number;
  topic: string;
  type: string;
  status: string | null;
  grade: number | null;
}

interface ClassRecap {
  class_id: number;
  class_name: string;
  course: { code: string; name: string };
  semester: { name: string };
  sessions: SessionRecap[];
  stats: {
    present_count: number;
    total_sessions: number;
    attendance_percentage: number;
    average_grade: number | null;
  };
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  HADIR: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: '✓' },
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-600', icon: '⏳' },
  ALPHA: { bg: 'bg-red-100', text: 'text-red-600', icon: '✗' },
  IZIN_SAKIT: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'S' },
  IZIN_LAIN: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'I' },
  IZIN_KAMPUS: { bg: 'bg-cyan-100', text: 'text-cyan-600', icon: 'K' },
  REJECTED: { bg: 'bg-gray-100', text: 'text-gray-500', icon: '−' },
};

export default function MyRecapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [recaps, setRecaps] = useState<ClassRecap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      api.request<ClassRecap[]>('/api/student/my-recap')
        .then(res => setRecaps(res.data || []))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <LoadingInline className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rekap Kehadiran</h1>
              <p className="text-gray-500 mt-1">Monitoring kehadiran di semua kelas</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Kembali</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {recaps.length === 0 ? (
          <Card>
            <EmptyState
              icon="📊"
              title="Belum ada data"
              description="Anda belum terdaftar di kelas manapun"
              action={{ label: 'Daftar Kelas', onClick: () => router.push('/enroll') }}
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {recaps.map(cls => (
              <Card key={cls.class_id} padding="none" className="overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-white">{cls.course.name}</h2>
                      <p className="text-indigo-200 text-sm">{cls.course.code} • {cls.class_name}</p>
                    </div>
                    <Badge variant="default" className="bg-white/20 text-white">
                      {cls.semester.name}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{cls.stats.present_count}</p>
                    <p className="text-xs text-gray-500">Hadir</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{cls.stats.attendance_percentage}%</p>
                    <p className="text-xs text-gray-500">Kehadiran</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{cls.stats.average_grade || '-'}</p>
                    <p className="text-xs text-gray-500">Rata-rata</p>
                  </div>
                </div>

                {/* Sessions Grid */}
                <div className="p-5">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {cls.sessions.map((session) => {
                      const config = session.status ? STATUS_CONFIG[session.status] : null;
                      return (
                        <div key={session.session_number} className="flex flex-col items-center min-w-[48px]">
                          <span className="text-xs text-gray-400 mb-1.5">P{session.session_number}</span>
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium ${
                              config ? `${config.bg} ${config.text}` : 'bg-gray-50 text-gray-300'
                            }`}
                            title={session.topic}
                          >
                            {config?.icon || '−'}
                          </div>
                          {session.grade !== null && (
                            <span className="text-xs text-gray-500 mt-1">{session.grade}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                      <span className="text-gray-500">Hadir</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                      <span className="text-gray-500">Pending</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-red-500" />
                      <span className="text-gray-500">Alpha</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                      <span className="text-gray-500">Izin</span>
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
