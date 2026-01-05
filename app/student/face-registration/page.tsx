'use client';

import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Card, Button, Alert, LoadingInline, Modal } from '@/components/ui';

const MIN_IMAGES = 5;
const MAX_IMAGES = 10;

export default function FaceRegistrationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [faceStatus, setFaceStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        console.log('Face detection models loaded');
      } catch (error) {
        console.error('Error loading models:', error);
        setMessage({ type: 'error', text: 'Gagal memuat model face detection. Refresh halaman.' });
      }
    };
    loadModels();
  }, []);

  // Check face registration status
  useEffect(() => {
    if (user) {
      api.getFaceStatus()
        .then(res => {
          setFaceStatus(res.data);
          setLoadingStatus(false);
        })
        .catch(() => setLoadingStatus(false));
    }
  }, [user]);

  // Continuous face detection
  useEffect(() => {
    if (!modelsLoaded || !isCapturing) return;

    const detectFace = async () => {
      if (webcamRef.current?.video?.readyState === 4) {
        const video = webcamRef.current.video;
        const detection = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions()
        );
        setFaceDetected(!!detection);
      }
    };

    const interval = setInterval(detectFace, 500);
    return () => clearInterval(interval);
  }, [modelsLoaded, isCapturing]);

  const captureImage = async () => {
    if (!webcamRef.current || capturedImages.length >= MAX_IMAGES) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    // Validate face in captured image
    const img = await faceapi.fetchImage(imageSrc);
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setMessage({ type: 'error', text: 'Wajah tidak terdeteksi. Coba lagi.' });
      return;
    }

    setCapturedImages(prev => [...prev, imageSrc]);
    setMessage({ type: 'success', text: `Foto ${capturedImages.length + 1}/${MIN_IMAGES} berhasil!` });

    if (capturedImages.length + 1 >= MIN_IMAGES) {
      setMessage({ type: 'info', text: `${capturedImages.length + 1} foto terkumpul. Anda bisa submit atau tambah lebih banyak.` });
    }
  };

  const deleteImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (capturedImages.length < MIN_IMAGES) {
      setMessage({ type: 'error', text: `Minimal ${MIN_IMAGES} foto diperlukan.` });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // Step 1: Upload images
      await api.uploadFaceImages(capturedImages);

      // Step 2: Generate face descriptors
      setMessage({ type: 'info', text: 'Memproses wajah...' });
      const descriptors = [];

      for (const imgSrc of capturedImages) {
        const img = await faceapi.fetchImage(imgSrc);
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptors.push(Array.from(detection.descriptor));
        }
      }

      if (descriptors.length === 0) {
        throw new Error('Tidak ada wajah yang terdeteksi');
      }

      // Step 3: Save descriptors
      await api.saveFaceDescriptors(descriptors);

      setMessage({ type: 'success', text: 'Wajah berhasil didaftarkan! Face recognition aktif.' });
      setCapturedImages([]);
      setIsCapturing(false);

      // Refresh status
      const statusRes = await api.getFaceStatus();
      setFaceStatus(statusRes.data);
    } catch (error) {
      console.error('Submit error:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Gagal mendaftar wajah' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteFaceData();
      setMessage({ type: 'success', text: 'Data wajah berhasil dihapus.' });
      setFaceStatus(null);
      setShowDeleteModal(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus data wajah' });
    }
  };

  if (loading || !user || loadingStatus) {
    return <LoadingInline className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Daftar Wajah</h1>
              <p className="text-gray-500 mt-1">Upload foto wajah untuk face recognition</p>
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

        {/* Status Card */}
        {faceStatus?.registered && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-green-900 mb-1">✓ Wajah Terdaftar</h3>
                <p className="text-sm text-green-700">
                  {faceStatus.sample_count} foto • Terdaftar pada {new Date(faceStatus.trained_at).toLocaleDateString('id-ID')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(true)}>
                Hapus & Daftar Ulang
              </Button>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Camera Section */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Kamera</h2>

              {!modelsLoaded ? (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <LoadingInline />
                  <p className="text-sm text-gray-500 ml-3">Memuat model...</p>
                </div>
              ) : !isCapturing ? (
                <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-4">
                  <CameraIcon className="w-16 h-16 text-gray-400" />
                  <Button onClick={() => setIsCapturing(true)}>
                    Aktifkan Kamera
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full rounded-lg"
                    videoConstraints={{
                      width: 1280,
                      height: 720,
                      facingMode: 'user'
                    }}
                  />
                  {faceDetected && (
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Wajah Terdeteksi
                    </div>
                  )}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <Button
                      onClick={captureImage}
                      disabled={!faceDetected || capturedImages.length >= MAX_IMAGES}
                      variant="primary"
                    >
                      📸 Ambil Foto ({capturedImages.length}/{MAX_IMAGES})
                    </Button>
                    <Button onClick={() => setIsCapturing(false)} variant="outline">
                      Tutup Kamera
                    </Button>
                  </div>
                </div>
              )}

              {/* Captured Images */}
              {capturedImages.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Foto Terkumpul ({capturedImages.length})</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {capturedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt={`Capture ${idx + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                        <button
                          onClick={() => deleteImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={capturedImages.length < MIN_IMAGES || submitting}
                      loading={submitting}
                      fullWidth
                    >
                      Submit {capturedImages.length} Foto
                    </Button>
                    <Button onClick={() => setCapturedImages([])} variant="outline">
                      Hapus Semua
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Instructions */}
          <div>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Panduan</h2>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600 flex-shrink-0">1.</span>
                  <span>Aktifkan kamera dan izinkan akses</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600 flex-shrink-0">2.</span>
                  <span>Pastikan wajah terdeteksi (indikator hijau)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600 flex-shrink-0">3.</span>
                  <span>Ambil minimal {MIN_IMAGES} foto dari berbagai sudut</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600 flex-shrink-0">4.</span>
                  <span>Variasi: frontal, kiri, kanan, senyum, netral</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600 flex-shrink-0">5.</span>
                  <span>Submit untuk memproses</span>
                </li>
              </ol>

              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  <strong>Tips:</strong> Pastikan pencahayaan cukup, wajah terlihat jelas, dan tidak ada orang lain dalam frame.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Data Wajah?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Anda yakin ingin menghapus data wajah? Anda perlu mendaftar ulang untuk menggunakan face recognition.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setShowDeleteModal(false)} variant="outline" fullWidth>
              Batal
            </Button>
            <Button onClick={handleDelete} variant="primary" fullWidth>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
