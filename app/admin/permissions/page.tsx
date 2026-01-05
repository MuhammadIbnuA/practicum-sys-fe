'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Alert, EmptyState, LoadingInline, Avatar, Tabs } from '@/components/ui';
import EnhancedFilePreview from '@/components/EnhancedFilePreview';

interface Permission {
  id: number;
  reason: string;
  status: string;
  file_name: string;
  file_data: string;
  created_at: string;
  student: { id: number; name: string; email: string };
  session: {
    session_number: number;
    class: {
      name: string;
      course: { code: string; name: string };
    };
  };
}

const tabs = [
  { id: 'PENDING', label: 'Menunggu' },
  { id: 'APPROVED', label: 'Disetujui' },
  { id: 'REJECTED', label: 'Ditolak' },
];

export default function AdminPermissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [processing, setProcessing] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/'); return; }
    if (!authLoading && user && !user.is_admin) { router.push('/dashboard'); return; }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.is_admin) {
      setLoading(true);
      api.request<Permission[]>(`/api/admin/permissions?status=${filter}`)
        .then(res => setPermissions(res.data || []))
        .finally(() => setLoading(false));
    }
  }, [user, filter]);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      await api.request(`/api/admin/permissions/${id}/approve`, { method: 'PUT' });
      setMessage({ type: 'success', text: 'Permohonan disetujui!' });
      setPermissions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menyetujui' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      await api.request(`/api/admin/permissions/${id}/reject`, { method: 'PUT' });
      setMessage({ type: 'success', text: 'Permohonan ditolak' });
      setPermissions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menolak' });
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading) {
    return <LoadingInline className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Perizinan</h1>
              <p className="text-gray-500 mt-1">Kelola permohonan izin mahasiswa</p>
            </div>
            <Link href="/admin">
              <Button variant="outline" size="sm">← Admin</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <Tabs tabs={tabs} activeTab={filter} onChange={setFilter} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {message && (
          <Alert type={message.type} className="mb-6" dismissible onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {loading ? (
          <LoadingInline />
        ) : permissions.length === 0 ? (
          <Card>
            <EmptyState icon="📋" title="Tidak ada permohonan" description={`Tidak ada permohonan dengan status ${filter.toLowerCase()}`} />
          </Card>
        ) : (
          <div className="space-y-4">
            {permissions.map(perm => (
              <Card key={perm.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar name={perm.student.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{perm.student.name}</h3>
                        <Badge variant="primary" size="sm">P{perm.session.session_number}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{perm.student.email}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">Kelas</p>
                          <p className="text-gray-900">{perm.session.class.course.code} - {perm.session.class.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-0.5">Alasan</p>
                          <p className="text-gray-900">{perm.reason}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <button
                          onClick={() => setPreviewFile({
                            url: perm.file_data,
                            name: perm.file_name
                          })}
                          className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {perm.file_name}
                        </button>
                        <span className="text-gray-400">
                          {new Date(perm.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {filter === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(perm.id)}
                        disabled={processing === perm.id}
                      >
                        Setujui
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(perm.id)}
                        disabled={processing === perm.id}
                      >
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* File Preview */}
      {previewFile && (
        <EnhancedFilePreview
          fileUrl={previewFile.url}
          fileName={previewFile.name}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
