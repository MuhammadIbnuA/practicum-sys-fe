'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, EmptyState, LoadingInline } from '@/components/ui';

interface AssistantSession {
  session_number: number;
  checked_in: boolean;
  check_in_time: string | null;
}

interface AssistantRecap {
  assistant_id: number;
  assistant_name: string;
  assistant_email: string;
  sessions: AssistantSession[];
  stats: {
    present_count: number;
    total_sessions: number;
    attendance_percentage: number;
  };
}

interface ClassRecap {
  class_id: number;
  class_name: string;
  course: { code: string; name: string };
  total_sessions: number;
  assistants: AssistantRecap[];
}

export default function AssistantRecapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [recap, setRecap] = useState<ClassRecap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/'); return; }
    if (!authLoading && user && !user.is_admin) { router.push('/dashboard'); return; }
    if (user?.is_admin) {
      api.request<ClassRecap[]>('/api/admin/assistant-recap')
        .then(res => setRecap(res.data || []))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <LoadingInline className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rekap Kehadiran Asisten</h1>
              <p className="text-gray-500 mt-1">Monitoring check-in asisten per kelas</p>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm">← Admin</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {recap.length === 0 ? (
          <Card>
            <EmptyState icon="👥" title="Belum ada data" description="Belum ada data kehadiran asisten" />
          </Card>
        ) : (
          <div className="space-y-6">
            {recap.map(cls => (
              <Card key={cls.class_id} padding="none" className="overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
                  <h2 className="font-semibold text-white">{cls.course.code} - {cls.class_name}</h2>
                  <p className="text-amber-100 text-sm">{cls.course.name}</p>
                </div>

                <div className="p-5 overflow-x-auto">
                  {cls.assistants.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Belum ada asisten</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3 pr-4">Asisten</th>
                          {Array.from({ length: cls.total_sessions }, (_, i) => (
                            <th key={i} className="text-center text-xs font-semibold text-gray-500 pb-3 px-1">P{i + 1}</th>
                          ))}
                          <th className="text-center text-xs font-semibold text-gray-500 uppercase pb-3 pl-4">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cls.assistants.map(asst => (
                          <tr key={asst.assistant_id}>
                            <td className="py-3 pr-4">
                              <p className="font-medium text-gray-900 text-sm">{asst.assistant_name}</p>
                              <p className="text-xs text-gray-500">{asst.assistant_email}</p>
                            </td>
                            {asst.sessions.map((session, idx) => (
                              <td key={idx} className="py-3 px-1 text-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                                    session.checked_in
                                      ? 'bg-emerald-100 text-emerald-600'
                                      : 'bg-gray-100 text-gray-400'
                                  }`}
                                  title={session.check_in_time || 'Belum check-in'}
                                >
                                  {session.checked_in ? '✓' : '−'}
                                </div>
                              </td>
                            ))}
                            <td className="py-3 pl-4 text-center">
                              <Badge
                                variant={
                                  asst.stats.attendance_percentage >= 80 ? 'success' :
                                  asst.stats.attendance_percentage >= 50 ? 'warning' : 'danger'
                                }
                                size="sm"
                              >
                                {asst.stats.attendance_percentage}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
