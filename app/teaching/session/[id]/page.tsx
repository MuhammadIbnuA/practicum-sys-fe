'use client';

import { useAuth } from '@/lib/auth';
import { api, RosterData, RosterStudent } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Alert, Modal, LoadingInline, Avatar } from '@/components/ui';

export default function SessionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = parseInt(params.id as string);

  const [roster, setRoster] = useState<RosterData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  const loadRoster = async () => {
    try {
      const res = await api.getSessionRoster(sessionId);
      setRoster(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal memuat' });
    }
  };

  useEffect(() => {
    if (user && sessionId) {
      loadRoster().finally(() => setLoadingData(false));
    }
  }, [user, sessionId]);

  const handleApprove = async (attendanceId: number) => {
    setProcessing(attendanceId);
    try {
      await api.approveAttendance(attendanceId);
      setMessage({ type: 'success', text: 'Berhasil disetujui!' });
      await loadRoster();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (attendanceId: number) => {
    setProcessing(attendanceId);
    try {
      await api.rejectAttendance(attendanceId);
      setMessage({ type: 'success', text: 'Ditolak' });
      await loadRoster();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal' });
    } finally {
      setProcessing(null);
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.checkIn(sessionId);
      setMessage({ type: 'success', text: 'Check-in berhasil!' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal check-in' });
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setShowConfirm(false);
    try {
      const res = await api.finalizeSession(sessionId);
      setMessage({
        type: 'success',
        text: `Rekap selesai! ${res.data.markedAlpha} mahasiswa ditandai ALPHA.`
      });
      await loadRoster();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal finalisasi' });
    } finally {
      setFinalizing(false);
    }
  };

  if (loading || !user) {
    return <LoadingInline className="min-h-screen" />;
  }

  const isFinalized = roster?.session?.is_finalized;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary'; label: string }> = {
      HADIR: { variant: 'success', label: 'Hadir' },
      PENDING: { variant: 'warning', label: 'Pending' },
      ALPHA: { variant: 'danger', label: 'Alpha' },
      REJECTED: { variant: 'danger', label: 'Ditolak' },
      IZIN_SAKIT: { variant: 'info', label: 'Sakit' },
      IZIN_LAIN: { variant: 'info', label: 'Izin' },
      IZIN_KAMPUS: { variant: 'info', label: 'Izin Kampus' },
    };
    const c = config[status] || { variant: 'secondary', label: status };
    return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={roster?.class?.id ? `/teaching/class/${roster.class.id}` : '/dashboard'}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    Pertemuan {roster?.session?.session_number || '?'}
                  </h1>
                  {isFinalized && <Badge variant="success" size="sm">Selesai</Badge>}
                </div>
                <p className="text-sm text-gray-500">
                  {roster?.class?.course?.name} • {roster?.class?.name}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCheckIn}>
              Check-in
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {message && (
          <Alert type={message.type} className="mb-6" dismissible onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {loadingData ? (
          <LoadingInline />
        ) : roster ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Pending" value={roster.status_counts.pending} color="amber" />
              <StatCard label="Hadir" value={roster.status_counts.hadir} color="emerald" />
              <StatCard label="Alpha" value={roster.status_counts.alpha} color="red" />
              <StatCard label="Total" value={roster.student_count} color="gray" />
            </div>

            {/* Finalize */}
            {!isFinalized && (
              <Card className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Rekap Sesi</h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Finalisasi dan tandai yang belum absen sebagai ALPHA
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowConfirm(true)}
                    loading={finalizing}
                  >
                    Rekap Sekarang
                  </Button>
                </div>
              </Card>
            )}

            {/* Confirm Modal */}
            <Modal
              isOpen={showConfirm}
              onClose={() => setShowConfirm(false)}
              title="Konfirmasi Rekap"
              size="sm"
            >
              <p className="text-gray-600 mb-6">
                {roster.status_counts.alpha} mahasiswa yang belum absen akan ditandai sebagai <span className="font-semibold text-red-600">ALPHA</span>. Aksi ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" fullWidth onClick={() => setShowConfirm(false)}>
                  Batal
                </Button>
                <Button variant="danger" fullWidth onClick={handleFinalize}>
                  Ya, Rekap
                </Button>
              </div>
            </Modal>

            {/* Roster */}
            <Card padding="none">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Daftar Mahasiswa</h2>
                <span className="text-sm text-gray-500">{roster.student_count} mahasiswa</span>
              </div>
              <div className="divide-y divide-gray-100">
                {roster.roster.map((student: RosterStudent) => (
                  <div key={student.student_id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.student_name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{student.student_name}</p>
                        <p className="text-xs text-gray-500">{student.student_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {student.attendance?.status === 'PENDING' && student.attendance.id ? (
                        <>
                          <Button
                            variant="success"
                            size="xs"
                            onClick={() => handleApprove(student.attendance!.id!)}
                            disabled={processing === student.attendance.id}
                          >
                            Setuju
                          </Button>
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => handleReject(student.attendance!.id!)}
                            disabled={processing === student.attendance.id}
                          >
                            Tolak
                          </Button>
                        </>
                      ) : student.attendance?.status ? (
                        <div className="flex items-center gap-2">
                          {getStatusBadge(student.attendance.status)}
                          {student.attendance.grade !== null && (
                            <span className="text-sm text-gray-500">({student.attendance.grade})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 px-3 py-1.5 bg-gray-50 rounded-full border border-dashed border-gray-200">
                          Belum absen
                        </span>
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

function StatCard({ label, value, color }: { label: string; value: number; color: 'amber' | 'emerald' | 'red' | 'gray' }) {
  const colors = {
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
  };

  return (
    <Card padding="sm">
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </Card>
  );
}
