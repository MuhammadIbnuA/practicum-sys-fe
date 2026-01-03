'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassItem, Payment } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Alert, EmptyState, LoadingInline, Modal, Input } from '@/components/ui';

const PAYMENT_AMOUNT = 5000;

export default function PaymentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.getOpenClasses().catch(() => ({ data: [] })),
        api.getMyPayments().catch(() => ({ data: { data: [] } }))
      ]).then(([classRes, paymentRes]) => {
        setClasses(classRes.data || []);
        const paymentData = Array.isArray(paymentRes.data) ? paymentRes.data : (paymentRes.data?.data || []);
        setPayments(paymentData);
        setLoadingData(false);
      });
    }
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFileData(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPayment = async () => {
    if (!selectedClass || !fileName || !fileData) {
      setMessage({ type: 'error', text: 'Silakan pilih file bukti transfer' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await api.submitPayment(selectedClass.id, fileName, fileData);
      setMessage({ type: 'success', text: 'Bukti transfer berhasil dikirim. Menunggu verifikasi admin.' });
      setShowPaymentModal(false);
      setFileName('');
      setFileData('');
      setSelectedClass(null);
      
      // Refresh payments
      const res = await api.getMyPayments();
      const paymentData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setPayments(paymentData);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal mengirim bukti transfer' });
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentStatus = (classId: number) => {
    return payments.find(p => p.class_id === classId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning" size="sm">Menunggu Verifikasi</Badge>;
      case 'VERIFIED':
        return <Badge variant="success" size="sm">Terverifikasi</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="sm">Ditolak</Badge>;
      default:
        return null;
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
              <h1 className="text-2xl font-bold text-gray-900">Pembayaran Kelas</h1>
              <p className="text-gray-500 mt-1">Bayar untuk mendaftar kelas praktikum (IDR {PAYMENT_AMOUNT.toLocaleString()})</p>
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
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Available Classes */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Kelas Tersedia</h2>
              {classes.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="📚"
                    title="Tidak ada kelas tersedia"
                    description="Hubungi administrator untuk menambah kelas"
                  />
                </Card>
              ) : (
                <div className="space-y-3">
                  {classes.map((cls) => {
                    const payment = getPaymentStatus(cls.id);
                    const isVerified = payment?.status === 'VERIFIED';
                    
                    return (
                      <Card key={cls.id} padding="sm" className={isVerified ? 'opacity-60' : ''}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{cls.course.name}</h3>
                              {payment && getStatusBadge(payment.status)}
                            </div>
                            <p className="text-sm text-gray-500 mb-3">{cls.course.code} • {cls.name}</p>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-gray-400 text-xs">Hari</p>
                                <p className="font-medium text-gray-900">{cls.day_name}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs">Waktu</p>
                                <p className="font-medium text-gray-900">{cls.time_slot?.start_time}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs">Kuota</p>
                                <p className="font-medium text-gray-900">{cls.available_quota}/{cls.quota}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedClass(cls);
                              setShowPaymentModal(true);
                            }}
                            disabled={isVerified || !cls.is_available}
                            variant={isVerified ? 'secondary' : 'primary'}
                            size="sm"
                          >
                            {isVerified ? 'Terdaftar' : payment ? 'Kirim Ulang' : 'Bayar'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Instructions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Instruksi Pembayaran</h2>
              <Card className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Biaya Pendaftaran</h3>
                  <p className="text-2xl font-bold text-indigo-600">IDR {PAYMENT_AMOUNT.toLocaleString()}</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Langkah-langkah:</h3>
                  <ol className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <span className="font-semibold text-indigo-600 flex-shrink-0">1.</span>
                      <span>Transfer ke rekening yang ditentukan</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-indigo-600 flex-shrink-0">2.</span>
                      <span>Upload bukti transfer di sini</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-indigo-600 flex-shrink-0">3.</span>
                      <span>Tunggu verifikasi dari admin</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-indigo-600 flex-shrink-0">4.</span>
                      <span>Setelah terverifikasi, Anda terdaftar di kelas</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-900">
                    <strong>Catatan:</strong> Pastikan nama pengirim sesuai dengan nama Anda di sistem untuk memudahkan verifikasi.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setFileName('');
          setFileData('');
        }}
        title="Upload Bukti Transfer"
      >
        <div className="space-y-4">
          {selectedClass && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>{selectedClass.course.name}</strong> - {selectedClass.name}
              </p>
              <p className="text-lg font-bold text-indigo-600 mt-1">
                IDR {PAYMENT_AMOUNT.toLocaleString()}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Bukti Transfer (PDF/JPG/PNG)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
            {fileName && (
              <p className="text-sm text-gray-600 mt-2">
                File dipilih: <strong>{fileName}</strong>
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowPaymentModal(false);
                setFileName('');
                setFileData('');
              }}
              variant="outline"
              fullWidth
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitPayment}
              loading={submitting}
              disabled={!fileName}
              fullWidth
            >
              Kirim Bukti
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
