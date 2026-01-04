'use client';

import { useAuth } from '@/lib/auth';
import { api, Payment } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Alert, EmptyState, LoadingInline, Modal, Tabs } from '@/components/ui';

const PAYMENT_AMOUNT = 5000;

export default function AdminPaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      router.push('/');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.is_admin) {
      loadPayments();
    }
  }, [user, activeTab]);

  const loadPayments = async () => {
    setLoadingData(true);
    try {
      const res = await api.getPendingPayments(1, 100, activeTab);
      // res.data has structure: { data: [...], pagination: {...} }
      const paymentData = res.data?.data || [];
      setPayments(paymentData);
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal memuat pembayaran' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleVerify = async (paymentId: number) => {
    setVerifying(true);
    setMessage(null);
    try {
      await api.verifyPayment(paymentId);
      setMessage({ type: 'success', text: 'Pembayaran terverifikasi. Siswa berhasil terdaftar.' });
      setShowProofModal(false);
      setSelectedPayment(null);
      await loadPayments();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal verifikasi pembayaran' });
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async (paymentId: number) => {
    setVerifying(true);
    setMessage(null);
    try {
      await api.rejectPayment(paymentId);
      setMessage({ type: 'success', text: 'Pembayaran ditolak.' });
      setShowProofModal(false);
      setSelectedPayment(null);
      await loadPayments();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menolak pembayaran' });
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'VERIFIED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (loading || !user?.is_admin) {
    return <LoadingInline className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verifikasi Pembayaran</h1>
              <p className="text-gray-500 mt-1">Kelola pembayaran pendaftaran kelas siswa</p>
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

        {/* Tabs */}
        <div className="mb-6">
          <Tabs
            tabs={[
              { id: 'PENDING', label: 'Menunggu Verifikasi' },
              { id: 'VERIFIED', label: 'Terverifikasi' },
              { id: 'REJECTED', label: 'Ditolak' }
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {loadingData ? (
          <LoadingInline />
        ) : payments.length === 0 ? (
          <Card>
            <EmptyState
              icon="💳"
              title="Tidak ada pembayaran"
              description={`Tidak ada pembayaran dengan status ${activeTab.toLowerCase()}`}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card key={payment.id} padding="sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {payment.student?.name}
                      </h3>
                      <Badge variant={getStatusColor(payment.status)} size="sm">
                        {payment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {payment.student?.email} {payment.student?.nim && `• NIM: ${payment.student.nim}`}
                    </p>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Kelas</p>
                        <p className="font-medium text-gray-900">{payment.class?.course.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Jumlah</p>
                        <p className="font-medium text-gray-900">IDR {payment.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">File</p>
                        <p className="font-medium text-gray-900 truncate">{payment.proof_file_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Tanggal</p>
                        <p className="font-medium text-gray-900">
                          {new Date(payment.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowProofModal(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Lihat Bukti
                    </Button>
                    {payment.status === 'PENDING' && (
                      <>
                        <Button
                          onClick={() => handleVerify(payment.id)}
                          loading={verifying}
                          size="sm"
                        >
                          Verifikasi
                        </Button>
                        <Button
                          onClick={() => handleReject(payment.id)}
                          variant="danger"
                          size="sm"
                        >
                          Tolak
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Proof Modal */}
      <Modal
        isOpen={showProofModal}
        onClose={() => {
          setShowProofModal(false);
          setSelectedPayment(null);
        }}
        title="Bukti Transfer"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>{selectedPayment.student?.name}</strong> - {selectedPayment.class?.course.name}
              </p>
              <p className="text-lg font-bold text-indigo-600 mt-1">
                IDR {selectedPayment.amount.toLocaleString()}
              </p>
            </div>

            {selectedPayment.proof_file_url && (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {selectedPayment.proof_file_url.startsWith('data:image') ? (
                  <img
                    src={selectedPayment.proof_file_url}
                    alt="Bukti transfer"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-600">File PDF tidak dapat ditampilkan di sini</p>
                    <a
                      href={selectedPayment.proof_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 font-medium mt-2 inline-block"
                    >
                      Buka File
                    </a>
                  </div>
                )}
              </div>
            )}

            {selectedPayment.status === 'PENDING' && (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleReject(selectedPayment.id)}
                  variant="danger"
                  fullWidth
                  loading={verifying}
                >
                  Tolak
                </Button>
                <Button
                  onClick={() => handleVerify(selectedPayment.id)}
                  fullWidth
                  loading={verifying}
                >
                  Verifikasi
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
