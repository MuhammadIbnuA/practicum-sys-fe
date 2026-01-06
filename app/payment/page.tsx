'use client';

import { useAuth } from '@/lib/auth';
import { api, ClassItem, Payment } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Alert, EmptyState, LoadingInline, Modal } from '@/components/ui';

const PAYMENT_AMOUNT = 5000;

export default function PaymentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');
  const [theoryClassMap, setTheoryClassMap] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.getOpenClasses().catch(() => ({ data: [] })),
        api.getMyPayments().catch(() => ({ data: { data: [] } }))
      ]).then(([classRes, paymentRes]) => {
        const classData = classRes.data || [];
        setClasses(classData);
        
        const paymentData = Array.isArray(paymentRes.data) ? paymentRes.data : (paymentRes.data?.data || []);
        setAllPayments(paymentData);
        
        // Filter payments to only show those for classes in the active semester
        const activeClassIds = new Set(classData.map((c: ClassItem) => c.id));
        const filteredPayments = paymentData.filter((p: Payment) => activeClassIds.has(p.class_id));
        setPayments(filteredPayments);
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

  const handleToggleClass = (classId: number) => {
    setSelectedClasses(prev => {
      const newSelected = prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId];
      
      // Initialize theory class for newly selected class
      if (!prev.includes(classId)) {
        setTheoryClassMap(prevMap => ({
          ...prevMap,
          [classId]: ''
        }));
      }
      
      // Check for schedule conflicts
      if (!prev.includes(classId)) {
        const conflicts = checkScheduleConflicts([...newSelected], classes);
        if (conflicts.length > 0) {
          setMessage({
            type: 'error',
            text: `⚠️ Konflik jadwal terdeteksi: ${conflicts.map(c => `${c[0]} vs ${c[1]}`).join(', ')}`
          });
        }
      }
      
      return newSelected;
    });
  };

  const checkScheduleConflicts = (selectedIds: number[], allClasses: ClassItem[]) => {
    const conflicts: [string, string][] = [];
    
    for (let i = 0; i < selectedIds.length; i++) {
      for (let j = i + 1; j < selectedIds.length; j++) {
        const class1 = allClasses.find(c => c.id === selectedIds[i]);
        const class2 = allClasses.find(c => c.id === selectedIds[j]);
        
        if (class1 && class2 &&
            class1.day_of_week === class2.day_of_week &&
            class1.time_slot?.id === class2.time_slot?.id) {
          conflicts.push([
            `${class1.course.code}-${class1.name}`,
            `${class2.course.code}-${class2.name}`
          ]);
        }
      }
    }
    
    return conflicts;
  };

  const handleSubmitPayment = async () => {
    // Validate theory classes
    const missingTheoryClasses = selectedClasses.filter(
      classId => !theoryClassMap[classId] || theoryClassMap[classId].trim() === ''
    );
    
    if (selectedClasses.length === 0 || !fileName || !fileData) {
      setMessage({ type: 'error', text: 'Silakan pilih kelas dan upload bukti transfer' });
      return;
    }
    
    if (missingTheoryClasses.length > 0) {
      setMessage({ type: 'error', text: 'Silakan isi kelas teori untuk semua kelas yang dipilih' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    
    const results = {
      success: [] as { classId: number; className: string }[],
      failed: [] as { classId: number; className: string; error: string }[]
    };

    try {
      // Submit payment for each selected class
      for (const classId of selectedClasses) {
        const cls = classes.find(c => c.id === classId);
        const className = cls ? `${cls.course.code} - ${cls.name}` : `Class ${classId}`;
        
        try {
          await api.submitPayment(classId, theoryClassMap[classId], fileName, fileData);
          results.success.push({ classId, className });
        } catch (err) {
          results.failed.push({
            classId,
            className,
            error: err instanceof Error ? err.message : 'Gagal mengirim'
          });
        }
      }

      // Show detailed results
      if (results.success.length > 0 && results.failed.length === 0) {
        setMessage({ 
          type: 'success', 
          text: `✓ Berhasil mengirim ${results.success.length} pembayaran. Menunggu verifikasi admin.`
        });
      } else if (results.success.length > 0 && results.failed.length > 0) {
        setMessage({ 
          type: 'error', 
          text: `✓ ${results.success.length} berhasil, ✗ ${results.failed.length} gagal: ${results.failed.map(f => f.className).join(', ')}`
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `✗ Semua pembayaran gagal: ${results.failed.map(f => `${f.className} (${f.error})`).join(', ')}`
        });
      }

      setShowPaymentModal(false);
      setFileName('');
      setFileData('');
      setTheoryClassMap({});
      setSelectedClasses([]);
      setBulkMode(false);
      
      // Refresh payments
      const res = await api.getMyPayments();
      const paymentData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAllPayments(paymentData);
      
      // Filter to active semester
      const activeClassIds = new Set(classes.map((c: ClassItem) => c.id));
      const filteredPayments = paymentData.filter((p: Payment) => activeClassIds.has(p.class_id));
      setPayments(filteredPayments);
    } catch (err) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat mengirim pembayaran' });
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
            <div className="flex gap-2">
              <Button 
                variant={bulkMode ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setSelectedClasses([]);
                }}
              >
                {bulkMode ? '✓ Mode Bulk' : 'Mode Bulk'}
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">← Kembali</Button>
              </Link>
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
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Available Classes */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Kelas Tersedia</h2>
                {bulkMode && selectedClasses.length > 0 && (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    variant="primary"
                    size="sm"
                  >
                    Bayar {selectedClasses.length} Kelas (IDR {(PAYMENT_AMOUNT * selectedClasses.length).toLocaleString()})
                  </Button>
                )}
              </div>
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
                    const isSelected = selectedClasses.includes(cls.id);
                    const canSelect = !isVerified && cls.is_available;
                    
                    return (
                      <Card 
                        key={cls.id} 
                        padding="sm" 
                        className={`${isVerified ? 'opacity-60' : ''} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                      >
                        <div 
                          className={`flex items-start justify-between gap-4 ${bulkMode && canSelect ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (bulkMode && canSelect) {
                              handleToggleClass(cls.id);
                            }
                          }}
                        >
                          {bulkMode && canSelect && (
                            <div className="flex items-center pt-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleClass(cls.id)}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
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
                          {!bulkMode && (
                            <Button
                              onClick={() => {
                                setSelectedClasses([cls.id]);
                                setShowPaymentModal(true);
                              }}
                              disabled={isVerified || !cls.is_available}
                              variant={isVerified ? 'secondary' : 'primary'}
                              size="sm"
                            >
                              {isVerified ? 'Terdaftar' : payment ? 'Kirim Ulang' : 'Bayar'}
                            </Button>
                          )}
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

        {/* Previous Semester Payments */}
        {!loadingData && allPayments.length > payments.length && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Pembayaran Semester Lalu</h2>
            <div className="space-y-3">
              {allPayments
                .filter(p => !payments.find(ap => ap.id === p.id))
                .map((payment) => (
                  <Card key={payment.id} padding="sm" className="opacity-75">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{payment.class?.course?.name || 'Kelas'}</h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-sm text-gray-500">{payment.class?.course?.code || ''} • {payment.class?.name || ''}</p>
                      </div>
                    </div>
                  </Card>
                ))}
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
          setTheoryClassMap({});
          if (!bulkMode) setSelectedClasses([]);
        }}
        title="Upload Bukti Transfer"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            {selectedClasses.length === 1 ? (
              <>
                {(() => {
                  const cls = classes.find(c => c.id === selectedClasses[0]);
                  return cls ? (
                    <>
                      <p className="text-sm text-gray-600">
                        <strong>{cls.course.name}</strong> - {cls.name}
                      </p>
                      <p className="text-lg font-bold text-indigo-600 mt-1">
                        IDR {PAYMENT_AMOUNT.toLocaleString()}
                      </p>
                    </>
                  ) : null;
                })()}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{selectedClasses.length} Kelas Dipilih:</strong>
                </p>
                <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
                  {selectedClasses.map(classId => {
                    const cls = classes.find(c => c.id === classId);
                    return cls ? (
                      <p key={classId} className="text-xs text-gray-600">
                        • {cls.course.name} - {cls.name}
                      </p>
                    ) : null;
                  })}
                </div>
                <p className="text-lg font-bold text-indigo-600">
                  Total: IDR {(PAYMENT_AMOUNT * selectedClasses.length).toLocaleString()}
                </p>
              </>
            )}
          </div>

          {/* Theory Class Inputs - One per selected class */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">
              Kelas Teori untuk Setiap Kelas *
            </label>
            {selectedClasses.map(classId => {
              const cls = classes.find(c => c.id === classId);
              return cls ? (
                <div key={classId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {cls.course.code} - {cls.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cls.day_name} • {cls.time_slot?.start_time}
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder="A, B, C..."
                    value={theoryClassMap[classId] || ''}
                    onChange={(e) => setTheoryClassMap({
                      ...theoryClassMap,
                      [classId]: e.target.value.toUpperCase()
                    })}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-medium"
                    maxLength={10}
                    required
                  />
                </div>
              ) : null;
            })}
            <p className="text-xs text-gray-500">
              Masukkan kelas teori untuk setiap kelas praktikum (bisa berbeda)
            </p>
          </div>

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

          {selectedClasses.length > 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Catatan:</strong> Bukti transfer yang sama akan digunakan untuk semua kelas. Admin akan memverifikasi setiap kelas secara terpisah.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowPaymentModal(false);
                setFileName('');
                setFileData('');
                setTheoryClassMap({});
                if (!bulkMode) setSelectedClasses([]);
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
              {submitting ? 'Mengirim...' : `Kirim Bukti (${selectedClasses.length} Kelas)`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
