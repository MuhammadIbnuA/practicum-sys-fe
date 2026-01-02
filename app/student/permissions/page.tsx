'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, EmptyState, LoadingInline } from '@/components/ui';

interface Permission {
  id: number;
  reason: string;
  status: string;
  file_name: string;
  created_at: string;
  session: {
    session_number: number;
    class: {
      name: string;
      course: { code: string; name: string };
    };
  };
}

export default function MyPermissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      api.request<Permission[]>('/api/student/permissions')
        .then(res => setPermissions(res.data || []))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <LoadingInline className="min-h-screen" />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success" dot>Disetujui</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" dot>Ditolak</Badge>;
      default:
        return <Badge variant="warning" dot>Menunggu</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Permohonan Izin</h1>
              <p className="text-gray-500 mt-1">Riwayat permohonan izin Anda</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Kembali</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {permissions.length === 0 ? (
          <Card>
            <EmptyState
              icon="📋"
              title="Belum ada permohonan"
              description="Anda belum mengajukan permohonan izin"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {permissions.map(perm => (
              <Card key={perm.id}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {perm.session.class.course.code} - {perm.session.class.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Pertemuan {perm.session.session_number}
                    </p>
                  </div>
                  {getStatusBadge(perm.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Alasan</p>
                    <p className="text-gray-900">{perm.reason}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">File</p>
                    <p className="text-indigo-600">{perm.file_name}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  Diajukan {new Date(perm.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
