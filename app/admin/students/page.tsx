'use client';

import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Badge, Button, Alert, Input, Modal, LoadingInline } from '@/components/ui';

export default function StudentsPage() {
  const { user, loading } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const limit = 20;

  useEffect(() => {
    if (!loading && !user?.is_admin) {
      window.location.href = '/dashboard';
    }
  }, [loading, user]);

  useEffect(() => {
    if (user?.is_admin) {
      loadStudents();
    }
  }, [user, page, search]);

  const loadStudents = async () => {
    try {
      setLoadingData(true);
      const res = await api.getStudents(page, limit, search);
      setStudents(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal memuat data' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setMessage({ type: 'error', text: 'Password baru harus diisi' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password minimal 8 karakter' });
      return;
    }

    setResetting(true);
    try {
      await api.resetStudentPassword(selectedStudent.id, newPassword);
      setMessage({ type: 'success', text: `Password ${selectedStudent.name} berhasil direset` });
      setShowResetModal(false);
      setNewPassword('');
      setSelectedStudent(null);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mereset password' });
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteStudent = async () => {
    setDeleting(true);
    try {
      await api.deleteStudent(selectedStudent.id);
      setMessage({ type: 'success', text: `Akun ${selectedStudent.name} berhasil dihapus` });
      setShowDeleteModal(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menghapus akun' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user?.is_admin) {
    return <LoadingInline className="min-h-screen" />;
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Akun Siswa</h1>
              <p className="text-gray-500 mt-1">Reset password dan kelola akun siswa</p>
            </div>
            <Link href="/admin">
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

        {/* Search */}
        <Card className="mb-6" padding="sm">
          <Input
            placeholder="Cari berdasarkan nama, email, atau NIM..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={<SearchIcon />}
          />
        </Card>

        {/* Students List */}
        {loadingData ? (
          <LoadingInline />
        ) : students.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500">Tidak ada siswa ditemukan</p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {students.map((student) => (
                <Card key={student.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.email}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        {student.nim && <span>NIM: {student.nim}</span>}
                        <span>{student._count.enrollments} kelas</span>
                        <span>Terdaftar: {new Date(student.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowResetModal(true);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Reset Password
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowDeleteModal(true);
                        }}
                        variant="secondary"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  ← Sebelumnya
                </Button>
                <span className="text-sm text-gray-600">
                  Halaman {page} dari {totalPages}
                </span>
                <Button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Selanjutnya →
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetModal}
        title="Reset Password"
        onClose={() => {
          setShowResetModal(false);
          setNewPassword('');
        }}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Reset password untuk <strong>{selectedStudent?.name}</strong>
          </p>
          <Input
            label="Password Baru"
            type="password"
            placeholder="Masukkan password baru (minimal 8 karakter)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setShowResetModal(false);
                setNewPassword('');
              }}
              variant="ghost"
            >
              Batal
            </Button>
            <Button
              onClick={handleResetPassword}
              variant="primary"
              loading={resetting}
            >
              Reset Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        title="Hapus Akun Siswa"
        onClose={() => setShowDeleteModal(false)}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Apakah Anda yakin ingin menghapus akun <strong>{selectedStudent?.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            ⚠️ Tindakan ini tidak dapat dibatalkan. Semua data siswa akan dihapus.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="ghost"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteStudent}
              variant="primary"
              loading={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Akun
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
