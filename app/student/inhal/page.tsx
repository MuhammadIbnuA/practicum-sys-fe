'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { api } from '@/lib/api';

const INHAL_AMOUNT = 30000;

export default function StudentInhalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [inhalPayments, setInhalPayments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get my recap (contains all classes with sessions and attendance status)
      const recapRes = await api.request('/api/student/my-recap');
      console.log('My recap response:', recapRes);
      
      if (recapRes.success && Array.isArray(recapRes.data)) {
        // Get full session details for each class to get session IDs
        const classesWithSessions = await Promise.all(
          recapRes.data.map(async (item: any) => {
            try {
              // Get class report to get actual session IDs
              const reportRes = await api.getClassReport(item.class_id);
              
              if (reportRes.success && reportRes.data?.sessions) {
                // Merge recap data (with status) with report data (with IDs)
                const sessionsWithIds = reportRes.data.sessions.map((reportSession: any) => {
                  const recapSession = item.sessions.find((s: any) => s.session_number === reportSession.session_number);
                  return {
                    ...reportSession,
                    ...recapSession, // Override with recap data (has correct status)
                  };
                });
                
                return {
                  id: item.class_id,
                  name: item.class_name,
                  course: item.course,
                  semester: item.semester,
                  sessions: sessionsWithIds
                };
              }
              
              return {
                id: item.class_id,
                name: item.class_name,
                course: item.course,
                semester: item.semester,
                sessions: []
              };
            } catch (err) {
              console.error(`Error loading class ${item.class_id}:`, err);
              return {
                id: item.class_id,
                name: item.class_name,
                course: item.course,
                semester: item.semester,
                sessions: []
              };
            }
          })
        );
        
        console.log('Classes with sessions:', classesWithSessions);
        setMyClasses(classesWithSessions);
      }

      // Get my INHAL payments
      const paymentsRes = await api.getMyInhalPayments();
      console.log('INHAL payments:', paymentsRes);
      if (paymentsRes.success) {
        setInhalPayments(paymentsRes.data.data || []);
      }
    } catch (err: any) {
      console.error('Load data error:', err);
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }
      
      setProofFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSession || !proofFile) {
      setError('Pilih sesi dan upload bukti pembayaran');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          
          await api.submitInhalPayment(
            selectedSession.id,
            proofFile.name,
            base64
          );

          setSuccess('Pembayaran INHAL berhasil diajukan!');
          setShowModal(false);
          setSelectedSession(null);
          setProofFile(null);
          setProofPreview('');
          
          // Reload data
          await loadData();
          
          setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
          setError(err.message || 'Gagal mengajukan pembayaran');
        } finally {
          setSubmitting(false);
        }
      };
      reader.readAsDataURL(proofFile);
    } catch (err: any) {
      setError(err.message || 'Gagal mengajukan pembayaran');
      setSubmitting(false);
    }
  };

  const openModal = (session: any, classInfo: any) => {
    setSelectedSession({ ...session, class: classInfo });
    setShowModal(true);
    setError('');
    setProofFile(null);
    setProofPreview('');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: 'warning', label: 'Menunggu' },
      VERIFIED: { variant: 'success', label: 'Terverifikasi' },
      REJECTED: { variant: 'danger', label: 'Ditolak' },
    };
    return variants[status] || { variant: 'secondary', label: status };
  };

  const getAttendanceStatusBadge = (status: string | null) => {
    if (!status) {
      // No attendance record yet - treat as not eligible
      return { variant: 'secondary' as const, label: 'Belum Ada Data', canApply: false };
    }
    
    const variants: Record<string, any> = {
      ALPHA: { variant: 'danger', label: 'Alpha', canApply: true },
      IZIN_SAKIT: { variant: 'warning', label: 'Izin Sakit', canApply: false },
      IZIN_LAIN: { variant: 'warning', label: 'Izin Lain', canApply: false },
      IZIN_KAMPUS: { variant: 'warning', label: 'Izin Kampus', canApply: false },
      HADIR: { variant: 'success', label: 'Hadir', canApply: false },
      INHAL: { variant: 'primary', label: 'INHAL', canApply: false },
      PENDING: { variant: 'warning', label: 'Pending', canApply: false },
    };
    return variants[status] || { variant: 'secondary', label: status, canApply: false };
  };

  // Get eligible sessions (ALPHA only)
  const eligibleSessions = myClasses.flatMap(cls => {
    const sessions = Array.isArray(cls.sessions) ? cls.sessions : [];
    
    if (sessions.length === 0) {
      console.log(`Class ${cls.course?.name || cls.id}: No sessions found`);
      return [];
    }
    
    console.log(`Class ${cls.course?.name}:`, sessions.length, 'sessions');
    
    return sessions
      .filter((s: any) => {
        if (!s || !s.status) {
          console.log(`Session ${s?.session_number || 'unknown'}: No status`);
          return false;
        }
        
        const statusInfo = getAttendanceStatusBadge(s.status);
        const hasPayment = inhalPayments.some(p => p.session_id === s.id);
        const isEligible = statusInfo.canApply && !hasPayment;
        
        if (s.status === 'ALPHA') {
          console.log(`Session ${s.session_number}: status=${s.status}, canApply=${statusInfo.canApply}, hasPayment=${hasPayment}, eligible=${isEligible}`);
        }
        
        return isEligible;
      })
      .map((s: any) => ({ ...s, class: cls }));
  });

  console.log('Total eligible sessions:', eligibleSessions.length);

  if (loading) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">INHAL (Izin Hadir Lanjut)</h1>
              <p className="text-gray-600 mt-1">Repraktikum untuk sesi yang tidak dihadiri</p>
            </div>
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              ← Kembali
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && <Alert type="error" className="mb-4" dismissible onDismiss={() => setError('')}>{error}</Alert>}
        {success && <Alert type="success" className="mb-4" dismissible onDismiss={() => setSuccess('')}>{success}</Alert>}

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">ℹ️</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Tentang INHAL</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• INHAL adalah program repraktikum untuk sesi yang tidak dihadiri (ALPHA)</li>
                <li>• Biaya: <strong>Rp {INHAL_AMOUNT.toLocaleString('id-ID')}</strong> per sesi</li>
                <li>• Hanya sesi dengan status <strong>ALPHA</strong> yang dapat diajukan INHAL</li>
                <li>• Setelah pembayaran diverifikasi, status kehadiran berubah menjadi INHAL</li>
                <li>• Status INHAL dapat diinput nilai oleh asisten</li>
                <li>• Upload bukti transfer untuk verifikasi admin</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-orange-600">{eligibleSessions.length}</div>
            <div className="text-sm text-gray-600 mt-1">Sesi Eligible</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600">{inhalPayments.filter(p => p.status === 'PENDING').length}</div>
            <div className="text-sm text-gray-600 mt-1">Menunggu Verifikasi</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600">{inhalPayments.filter(p => p.status === 'VERIFIED').length}</div>
            <div className="text-sm text-gray-600 mt-1">Terverifikasi</div>
          </Card>
        </div>

        {/* Eligible Sessions */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sesi yang Dapat Diajukan INHAL</h2>
          
          {eligibleSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">✓ Tidak ada sesi yang perlu INHAL</p>
              <p className="text-sm">Semua sesi sudah hadir atau sudah diajukan INHAL</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eligibleSessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{session.class.course.name}</div>
                    <div className="text-sm text-gray-600">
                      Pertemuan {session.session_number} - {session.topic || 'No topic'}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge {...getAttendanceStatusBadge(session.status)} size="sm" />
                      <span className="text-xs text-gray-500">{session.class.name}</span>
                    </div>
                  </div>
                  <Button onClick={() => openModal(session, session.class)}>
                    Ajukan INHAL
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Payment History */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Pembayaran INHAL</h2>
          
          {inhalPayments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Belum ada pembayaran INHAL
            </div>
          ) : (
            <div className="space-y-3">
              {inhalPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {payment.session?.class?.course?.name || 'Unknown Course'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Pertemuan {payment.session?.session_number} - {payment.session?.class?.name}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>Rp {payment.amount.toLocaleString('id-ID')}</span>
                      <span>•</span>
                      <span>{new Date(payment.created_at).toLocaleDateString('id-ID')}</span>
                      {payment.verified_at && (
                        <>
                          <span>•</span>
                          <span>Diverifikasi: {new Date(payment.verified_at).toLocaleDateString('id-ID')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge {...getStatusBadge(payment.status)} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      {/* Submit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Ajukan Pembayaran INHAL"
      >
        <div className="space-y-4">
          {selectedSession && (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{selectedSession.class.course.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedSession.class.name} - Pertemuan {selectedSession.session_number}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedSession.topic || 'No topic'}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Biaya INHAL:</span>
                    <span className="font-semibold text-gray-900">Rp {INHAL_AMOUNT.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Bukti Transfer *
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG (Max 5MB)</p>
              </div>

              {proofPreview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview:</label>
                  <img src={proofPreview} alt="Preview" className="w-full h-48 object-contain bg-gray-100 rounded-lg" />
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setShowModal(false)} variant="secondary" fullWidth>
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!proofFile || submitting}
                  loading={submitting}
                  fullWidth
                >
                  Submit Pembayaran
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
