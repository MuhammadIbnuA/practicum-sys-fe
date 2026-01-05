'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import EnhancedFilePreview from '@/components/EnhancedFilePreview';

export default function AdminInhalPage() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  useEffect(() => {
    loadData();
  }, [selectedStatus, pagination.page]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [paymentsRes, statsRes] = await Promise.all([
        api.getAllInhalPayments(pagination.page, pagination.limit, selectedStatus),
        api.getInhalStats()
      ]);

      if (paymentsRes.success) {
        setPayments(paymentsRes.data.data || []);
        setPagination(paymentsRes.data.pagination);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: number) => {
    if (!confirm('Verifikasi pembayaran INHAL ini?')) return;

    try {
      setProcessing(true);
      await api.verifyInhalPayment(paymentId);
      setSuccess('Pembayaran INHAL berhasil diverifikasi!');
      setShowModal(false);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (paymentId: number) => {
    if (!confirm('Tolak pembayaran INHAL ini?')) return;

    try {
      setProcessing(true);
      await api.rejectInhalPayment(paymentId);
      setSuccess('Pembayaran INHAL ditolak');
      setShowModal(false);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menolak pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const viewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: 'warning', label: 'Menunggu' },
      VERIFIED: { variant: 'success', label: 'Terverifikasi' },
      REJECTED: { variant: 'danger', label: 'Ditolak' },
    };
    return variants[status] || { variant: 'secondary', label: status };
  };

  if (loading && !payments.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Verifikasi INHAL</h1>
          <p className="text-gray-600 mt-1">Kelola pembayaran repraktikum mahasiswa</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && <Alert type="error" className="mb-4" dismissible onDismiss={() => setError('')}>{error}</Alert>}
        {success && <Alert type="success" className="mb-4" dismissible onDismiss={() => setSuccess('')}>{success}</Alert>}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <Card className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600 mt-1">Total</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-gray-600 mt-1">Pending</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.verified}</div>
              <div className="text-sm text-gray-600 mt-1">Terverifikasi</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600 mt-1">Ditolak</div>
            </Card>
            <Card className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                Rp {(stats.totalRevenue / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Revenue</div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">Filter Status:</label>
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === '' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedStatus('')}
              >
                Semua
              </Button>
              <Button
                variant={selectedStatus === 'PENDING' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedStatus('PENDING')}
              >
                Pending
              </Button>
              <Button
                variant={selectedStatus === 'VERIFIED' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedStatus('VERIFIED')}
              >
                Terverifikasi
              </Button>
              <Button
                variant={selectedStatus === 'REJECTED' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedStatus('REJECTED')}
              >
                Ditolak
              </Button>
            </div>
          </div>
        </Card>

        {/* Payments List */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Mahasiswa</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Kelas & Sesi</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Jumlah</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Tanggal</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      Tidak ada pembayaran INHAL
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{payment.student.name}</div>
                        <div className="text-xs text-gray-500">{payment.student.nim}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {payment.session?.class?.course?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.session?.class?.name} - P{payment.session?.session_number}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-gray-900">
                          Rp {payment.amount.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge {...getStatusBadge(payment.status)} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => viewDetails(payment)}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Halaman {pagination.page} dari {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  ← Prev
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Detail Pembayaran INHAL"
      >
        {selectedPayment && (
          <div className="space-y-4">
            {/* Student Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Mahasiswa:</div>
                  <div className="font-medium text-gray-900">{selectedPayment.student.name}</div>
                </div>
                <div>
                  <div className="text-gray-600">NIM:</div>
                  <div className="font-medium text-gray-900">{selectedPayment.student.nim}</div>
                </div>
                <div>
                  <div className="text-gray-600">Kelas:</div>
                  <div className="font-medium text-gray-900">
                    {selectedPayment.session?.class?.course?.name}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Sesi:</div>
                  <div className="font-medium text-gray-900">
                    Pertemuan {selectedPayment.session?.session_number}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Jumlah:</div>
                  <div className="font-semibold text-gray-900">
                    Rp {selectedPayment.amount.toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Status:</div>
                  <Badge {...getStatusBadge(selectedPayment.status)} size="sm" />
                </div>
              </div>
            </div>

            {/* Proof Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bukti Transfer:
              </label>
              <div className="relative">
                <img
                  src={selectedPayment.proof_file_url}
                  alt={selectedPayment.proof_file_name}
                  className="w-full h-auto max-h-64 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewFile({
                    url: selectedPayment.proof_file_url,
                    name: selectedPayment.proof_file_name
                  })}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => setPreviewFile({
                    url: selectedPayment.proof_file_url,
                    name: selectedPayment.proof_file_name
                  })}
                >
                  Lihat Fullscreen
                </Button>
              </div>
            </div>

            {/* Verification Info */}
            {selectedPayment.verified_at && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <div className="text-blue-900">
                  {selectedPayment.status === 'VERIFIED' ? 'Diverifikasi' : 'Ditolak'} oleh{' '}
                  <strong>{selectedPayment.verified_by?.name}</strong> pada{' '}
                  {new Date(selectedPayment.verified_at).toLocaleString('id-ID')}
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedPayment.status === 'PENDING' && (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleReject(selectedPayment.id)}
                  variant="secondary"
                  disabled={processing}
                  fullWidth
                >
                  Tolak
                </Button>
                <Button
                  onClick={() => handleVerify(selectedPayment.id)}
                  disabled={processing}
                  loading={processing}
                  fullWidth
                >
                  Verifikasi
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Enhanced File Preview */}
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
