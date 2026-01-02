'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, EmptyState, LoadingInline, Avatar } from '@/components/ui';

interface AssistantLog {
  id: number;
  check_in_time: string;
  status: string;
  user: { id: number; name: string; email: string };
  session: {
    session_number: number;
    class: {
      name: string;
      course: { code: string; name: string };
    };
  };
}

export default function AssistantLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AssistantLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/'); return; }
    if (!authLoading && user && !user.is_admin) { router.push('/dashboard'); return; }
    if (user?.is_admin) {
      api.request<AssistantLog[]>('/api/admin/assistants/log')
        .then(res => setLogs(res.data || []))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <LoadingInline className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Log Kehadiran Asisten</h1>
              <p className="text-gray-500 mt-1">Riwayat check-in asisten praktikum</p>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm">← Admin</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {logs.length === 0 ? (
          <Card>
            <EmptyState icon="📒" title="Belum ada log" description="Belum ada log kehadiran asisten" />
          </Card>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Asisten</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pertemuan</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={log.user.name} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{log.user.name}</p>
                            <p className="text-xs text-gray-500">{log.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-900">{log.session.class.course.code}</p>
                        <p className="text-xs text-gray-500">{log.session.class.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="primary" size="sm">P{log.session.session_number}</Badge>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {new Date(log.check_in_time).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={log.status === 'HADIR' ? 'success' : 'warning'} size="sm">
                          {log.status}
                        </Badge>
                      </td>
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
