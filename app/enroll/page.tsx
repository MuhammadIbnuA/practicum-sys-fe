'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassItem } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Alert, EmptyState, LoadingInline } from '@/components/ui';

export default function EnrollPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      api.getOpenClasses()
        .then(res => setClasses(res.data))
        .finally(() => setLoadingData(false));
    }
  }, [user]);

  const handleEnroll = async (classId: number) => {
    setEnrolling(classId);
    setMessage(null);
    try {
      await api.enrollClass(classId);
      setMessage({ type: 'success', text: 'Berhasil mendaftar kelas!' });
      const res = await api.getOpenClasses();
      setClasses(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mendaftar' });
    } finally {
      setEnrolling(null);
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Daftar Kelas</h1>
              <p className="text-gray-500 mt-1">Pilih kelas praktikum yang ingin diikuti</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Kembali</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {message && (
          <Alert type={message.type} className="mb-6" dismissible onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {loadingData ? (
          <LoadingInline />
        ) : classes.length === 0 ? (
          <Card>
            <EmptyState
              icon="📚"
              title="Tidak ada kelas tersedia"
              description="Hubungi administrator untuk menambah kelas"
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <Card key={cls.id} padding="none" className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Info */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <BookIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{cls.course.name}</h3>
                        <p className="text-sm text-gray-500">{cls.course.code} • {cls.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Hari</p>
                        <p className="font-medium text-gray-900">{cls.day_name || 'Senin'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Waktu</p>
                        <p className="font-medium text-gray-900">{cls.time_slot?.start_time || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Ruang</p>
                        <p className="font-medium text-gray-900">{cls.room?.code || '-'}</p>
                      </div>
                    </div>

                    {cls.assistants && cls.assistants.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 mb-2">Asisten</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cls.assistants.map((a) => (
                            <Badge key={a.user.id} variant="secondary" size="sm">
                              {a.user.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="md:w-48 p-5 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col items-center justify-center">
                    <div className="text-center mb-4">
                      <p className="text-xs text-gray-400 mb-1">Kuota</p>
                      <p className={`text-2xl font-bold ${cls.is_available ? 'text-emerald-600' : 'text-red-500'}`}>
                        {cls.available_quota}
                        <span className="text-gray-400 text-base font-normal">/{cls.quota}</span>
                      </p>
                    </div>
                    <Button
                      onClick={() => handleEnroll(cls.id)}
                      disabled={!cls.is_available || enrolling === cls.id}
                      variant={cls.is_available ? 'primary' : 'secondary'}
                      size="sm"
                      fullWidth
                      loading={enrolling === cls.id}
                    >
                      {cls.is_available ? 'Daftar' : 'Penuh'}
                    </Button>
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

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
