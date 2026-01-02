'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassReport } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Alert, LoadingInline } from '@/components/ui';

export default function StudentClassPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classId = parseInt(params.id as string);

  const [report, setReport] = useState<ClassReport | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (user && classId) {
      api.getClassReport(classId)
        .then(res => setReport(res.data))
        .catch(err => setMessage({ type: 'error', text: err.message }))
        .finally(() => setLoadingData(false));
    }
  }, [user, classId]);

  const handleSubmitAttendance = async (sessionId: number) => {
    setSubmitting(sessionId);
    setMessage(null);
    try {
      await api.submitAttendance(sessionId);
      setMessage({ type: 'success', text: 'Absensi terkirim! Menunggu persetujuan asisten.' });
      const res = await api.getClassReport(classId);
      setReport(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mengirim' });
    } finally {
      setSubmitting(null);
    }
  };

  if (loading || !user) {
    return <LoadingInline className="min-h-screen" />;
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    const config: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
      HADIR: { variant: 'success', label: 'Hadir' },
      PENDING: { variant: 'warning', label: 'Menunggu' },
      ALPHA: { variant: 'danger', label: 'Alpha' },
      REJECTED: { variant: 'danger', label: 'Ditolak' },
      IZIN_SAKIT: { variant: 'info', label: 'Sakit' },
      IZIN_LAIN: { variant: 'info', label: 'Izin' },
      IZIN_KAMPUS: { variant: 'info', label: 'Izin Kampus' },
    };
    const c = config[status] || { variant: 'default' as const, label: status };
    return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
  };

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
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {report?.class.course.name || 'Loading...'}
              </h1>
              <p className="text-sm text-gray-500">{report?.class.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {message && (
          <Alert type={message.type} className="mb-6" dismissible onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {loadingData ? (
          <LoadingInline />
        ) : report ? (
          <>
            {/* Summary */}
            <Card className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Ringkasan</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600">{report.summary.attendance_percentage.toFixed(0)}%</p>
                  <p className="text-xs text-gray-500">Kehadiran</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{report.summary.present_count}</p>
                  <p className="text-xs text-gray-500">Hadir</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">
                    {report.summary.current_average_grade?.toFixed(1) || '-'}
                  </p>
                  <p className="text-xs text-gray-500">Rata-rata</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{report.summary.graded_sessions}</p>
                  <p className="text-xs text-gray-500">Dinilai</p>
                </div>
              </div>
            </Card>

            {/* Sessions */}
            <Card padding="none">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Pertemuan</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {report.sessions.map((session) => (
                  <div key={session.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-sm">
                        {session.session_number}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{session.topic}</p>
                        <p className="text-xs text-gray-500">
                          {session.type === 'EXAM' ? 'Responsi' : 'Pertemuan'}
                          {session.grade !== null && ` • Nilai: ${session.grade}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {session.status ? (
                        getStatusBadge(session.status)
                      ) : (
                        <Button
                          onClick={() => handleSubmitAttendance(session.id)}
                          disabled={submitting === session.id}
                          size="sm"
                          loading={submitting === session.id}
                        >
                          Absen
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card className="text-center py-12">
            <p className="text-gray-500">Gagal memuat data</p>
          </Card>
        )}
      </main>
    </div>
  );
}
