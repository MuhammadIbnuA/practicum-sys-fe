'use client';

import { useAuth } from '@/lib/auth';
import { api, RecapData, RecapStudent, SessionItem } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Alert, LoadingInline } from '@/components/ui';

const STATUSES = ['HADIR', 'ALPHA', 'PENDING', 'IZIN_SAKIT', 'IZIN_LAIN', 'IZIN_KAMPUS', 'REJECTED'] as const;

const STATUS_CONFIG: Record<string, { short: string; bg: string; label: string }> = {
  HADIR: { short: 'H', bg: 'bg-emerald-500 text-white', label: 'Hadir' },
  PENDING: { short: 'P', bg: 'bg-amber-400 text-amber-900', label: 'Pending' },
  ALPHA: { short: 'A', bg: 'bg-red-500 text-white', label: 'Alpha' },
  REJECTED: { short: 'X', bg: 'bg-red-300 text-white', label: 'Ditolak' },
  IZIN_SAKIT: { short: 'S', bg: 'bg-blue-400 text-white', label: 'Sakit' },
  IZIN_LAIN: { short: 'I', bg: 'bg-blue-300 text-white', label: 'Izin' },
  IZIN_KAMPUS: { short: 'K', bg: 'bg-purple-400 text-white', label: 'Izin Kampus' },
};

interface AttendanceChange {
  sessionId: number;
  studentId: number;
  status: string;
}

export default function RecapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classId = parseInt(params.id as string);

  const [recap, setRecap] = useState<RecapData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<AttendanceChange[]>([]);
  const [editingCell, setEditingCell] = useState<{ studentId: number; sessionNum: number } | null>(null);

  const isAdmin = user?.is_admin || false;

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  const loadRecap = () => {
    if (user && classId) {
      setLoadingData(true);
      api.getAttendanceRecap(classId)
        .then(res => setRecap(res.data))
        .catch(err => setMessage({ type: 'error', text: err.message }))
        .finally(() => setLoadingData(false));
    }
  };

  useEffect(() => { loadRecap(); }, [user, classId]);

  const handleStatusChange = (studentId: number, sessionId: number, sessionNum: number, newStatus: string) => {
    if (recap) {
      const updatedStudents = recap.students.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            attendances: {
              ...student.attendances,
              [sessionNum]: { status: newStatus, grade: student.attendances[sessionNum]?.grade || null }
            }
          };
        }
        return student;
      });
      setRecap({ ...recap, students: updatedStudents });
    }

    setChanges(prev => {
      const existing = prev.findIndex(c => c.sessionId === sessionId && c.studentId === studentId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { sessionId, studentId, status: newStatus };
        return updated;
      }
      return [...prev, { sessionId, studentId, status: newStatus }];
    });
    setEditingCell(null);
  };

  const saveChanges = async () => {
    if (changes.length === 0) return;
    setSaving(true);
    setMessage(null);

    try {
      const bySession: Record<number, { studentId: number; status: string }[]> = {};
      changes.forEach(c => {
        if (!bySession[c.sessionId]) bySession[c.sessionId] = [];
        bySession[c.sessionId].push({ studentId: c.studentId, status: c.status });
      });

      for (const [sessionId, updates] of Object.entries(bySession)) {
        await api.adminUpdateAttendance(parseInt(sessionId), updates);
      }

      setMessage({ type: 'success', text: `${changes.length} perubahan berhasil disimpan!` });
      setChanges([]);
      loadRecap();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menyimpan' });
    }
    setSaving(false);
  };

  if (loading || !user) {
    return <LoadingInline className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Rekap Absensi</h1>
                {recap && (
                  <p className="text-sm text-gray-500">
                    {recap.class.course?.name} - {recap.class.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && changes.length > 0 && (
                <Button onClick={saveChanges} loading={saving}>
                  Simpan ({changes.length})
                </Button>
              )}
              <Badge variant="secondary">{recap?.total_students || 0} Mahasiswa</Badge>
            </div>
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
        ) : !recap ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">Tidak ada data</p>
          </Card>
        ) : (
          <>
            {/* Legend */}
            <Card className="mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Keterangan:</span>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${config.bg}`}>
                      {config.short}
                    </span>
                    <span className="text-xs text-gray-600">{config.label}</span>
                  </div>
                ))}
              </div>
              {isAdmin && (
                <p className="mt-3 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                  Admin Mode: Klik sel untuk mengubah status absensi
                </p>
              )}
            </Card>

            {/* Table */}
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50 w-12">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase sticky left-12 bg-gray-50 min-w-[180px]">Nama</th>
                      {recap.sessions.map((s: SessionItem) => (
                        <th key={s.id} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 min-w-[44px]">
                          P{s.session_number}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recap.students.map((student: RecapStudent, idx: number) => {
                      let hadirCount = 0;
                      let totalChecked = 0;
                      recap.sessions.forEach(s => {
                        const att = student.attendances[s.session_number];
                        if (att && att.status !== 'PENDING') {
                          totalChecked++;
                          if (att.status === 'HADIR') hadirCount++;
                        }
                      });
                      const percentage = totalChecked > 0 ? Math.round(hadirCount / totalChecked * 100) : null;

                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500 sticky left-0 bg-white">{idx + 1}</td>
                          <td className="px-4 py-3 sticky left-12 bg-white">
                            <div className="font-medium text-gray-900 text-sm">{student.name}</div>
                            <div className="text-xs text-gray-400">{student.email}</div>
                          </td>
                          {recap.sessions.map((s: SessionItem) => {
                            const att = student.attendances[s.session_number];
                            const config = att ? STATUS_CONFIG[att.status] : null;
                            const isEditing = editingCell?.studentId === student.id && editingCell?.sessionNum === s.session_number;

                            return (
                              <td key={s.id} className="px-1 py-2 text-center relative">
                                {isAdmin ? (
                                  isEditing ? (
                                    <select
                                      autoFocus
                                      className="absolute inset-0 w-full h-full bg-white border-2 border-indigo-500 rounded text-xs z-20"
                                      value={att?.status || ''}
                                      onChange={(e) => handleStatusChange(student.id, s.id, s.session_number, e.target.value)}
                                      onBlur={() => setEditingCell(null)}
                                    >
                                      <option value="">-</option>
                                      {STATUSES.map(st => (
                                        <option key={st} value={st}>{STATUS_CONFIG[st].label}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <button
                                      onClick={() => setEditingCell({ studentId: student.id, sessionNum: s.session_number })}
                                      className={`w-7 h-7 rounded text-xs font-bold transition-transform hover:scale-110 ${
                                        config ? config.bg : 'bg-gray-100 text-gray-400 border border-dashed border-gray-300'
                                      }`}
                                      title={config ? `${config.label} - Klik untuk edit` : 'Klik untuk set'}
                                    >
                                      {config?.short || '-'}
                                    </button>
                                  )
                                ) : (
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${
                                    config ? config.bg : 'bg-gray-100 text-gray-400'
                                  }`}>
                                    {config?.short || '-'}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold ${
                              percentage === null ? 'bg-gray-100 text-gray-400' :
                              percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                              percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {percentage !== null ? `${percentage}%` : '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={2} className="px-4 py-3 font-semibold text-gray-700 text-sm sticky left-0 bg-gray-50">
                        Total Hadir
                      </td>
                      {recap.stats.map((stat) => (
                        <td key={stat.session_number} className="px-1 py-3 text-center">
                          <span className="text-xs font-medium text-gray-600">
                            {stat.hadir}/{recap.total_students}
                          </span>
                        </td>
                      ))}
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
