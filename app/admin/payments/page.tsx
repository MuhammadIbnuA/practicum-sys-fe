'use client';

import { useAuth } from '@/lib/auth';
import { api, Payment } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Alert, EmptyState, LoadingInline, Tabs } from '@/components/ui';
import EnhancedFilePreview from '@/components/EnhancedFilePreview';

const PAYMENT_AMOUNT = 5000;

export default function AdminPaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [previewFile, setPreviewFile] = useState<{url: string, name: string} | null>(null);
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
      setPreviewFile(null);
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
      setPreviewFile(null);
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

  // Group payments by student and proof file
  const groupedPayments = payments.reduce((acc, payment) => {
    const key = `${payment.student_id}-${payment.proof_file_url}`;
    if (!acc[key]) {
      acc[key] = {
        student: payment.student,
        proofFile: payment.proof_file_url,
        proofFileName: payment.proof_file_name,
        payments: []
      };
    }
    acc[key].payments.push(payment);
    return acc;
  }, {} as Record<string, { student: any; proofFile: string; proofFileName: string; payments: Payment[] }>);

  const handleVerifyGroup = async (groupPayments: Payment[]) => {
    if (!confirm(`Verifikasi ${groupPayments.length} pembayaran sekaligus?`)) return;
    
    setVerifying(true);
    setMessage(null);
    
    const results = {
      success: 0,
      failed: 0
    };
    
    try {
      for (const payment of groupPayments) {
        try {
          await api.verifyPayment(payment.id);
          results.success++;
        } catch (err) {
          results.failed++;
        }
      }
      
      if (results.success > 0) {
        setMessage({ 
          type: results.failed === 0 ? 'success' : 'error',
          text: `✓ ${results.success} pembayaran terverifikasi${results.failed > 0 ? `, ${results.failed} gagal` : ''}`
        });
      }
      
      await loadPayments();
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectGroup = async (groupPayments: Payment[]) => {
    if (!confirm(`Tolak ${groupPayments.length} pembayaran sekaligus?`)) return;
    
    setVerifying(true);
    setMessage(null);
    
    const results = {
      success: 0,
      failed: 0
    };
    
    try {
      for (const payment of groupPayments) {
        try {
          await api.rejectPayment(payment.id);
          results.success++;
        } catch (err) {
          results.failed++;
        }
      }
      
      if (results.success > 0) {
        setMessage({ 
          type: results.failed === 0 ? 'success' : 'error',
          text: `✓ ${results.success} pembayaran ditolak${results.failed > 0 ? `, ${results.failed} gagal` : ''}`
        });
      }
      
      await loadPayments();
    } finally {
      setVerifying(false);
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
        <div className="mb-4">
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

        {/* View Mode Toggle */}
        {activeTab === 'PENDING' && payments.length > 0 && (
          <Card className="mb-4" padding="sm">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tampilan:</span>
              <Button
                size="sm"
                variant={viewMode === 'grouped' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('grouped')}
              >
                Dikelompokkan
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'individual' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('individual')}
              >
                Individual
              </Button>
            </div>
          </Card>
        )}

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
        ) : viewMode === 'grouped' && activeTab === 'PENDING' ? (
          /* Grouped View */
          <div className="space-y-4">
            {Object.values(groupedPayments).map((group, idx) => (
              <Card key={idx} padding="sm">
                <div className="space-y-3">
                  {/* Student Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.student?.name}</h3>
                      <p className="text-sm text-gray-500">
                        {group.student?.email} {group.student?.nim && `• NIM: ${group.student.nim}`}
                      </p>
                    </div>
                    <Button
                      onClick={() => setPreviewFile({
                        url: group.proofFile,
                        name: group.proofFileName
                      })}
                      variant="outline"
                      size="sm"
                    >
                      Lihat Bukti
                    </Button>
                  </div>

                  {/* Payment List */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 uppercase">
                      {group.payments.length} Kelas Terdaftar
                    </p>
                    {group.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">
                            {payment.class?.course.code} - {payment.class?.name}
                          </span>
                          {payment.theory_class && (
                            <span className="ml-2 text-indigo-600 text-xs">
                              Teori: {payment.theory_class}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-600">
                          IDR {payment.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>IDR {group.payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVerifyGroup(group.payments)}
                      loading={verifying}
                      size="sm"
                      fullWidth
                    >
                      Verifikasi Semua ({group.payments.length})
                    </Button>
                    <Button
                      onClick={() => handleRejectGroup(group.payments)}
                      variant="danger"
                      size="sm"
                      fullWidth
                    >
                      Tolak Semua
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Individual View */
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
                        setPreviewFile({
                          url: payment.proof_file_url,
                          name: payment.proof_file_name
                        });
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

      {/* File Preview */}
      {previewFile && (
        <EnhancedFilePreview
          fileUrl={previewFile.url}
          fileName={previewFile.name}
          isOpen={!!previewFile}
          onClose={() => {
            setPreviewFile(null);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
}
