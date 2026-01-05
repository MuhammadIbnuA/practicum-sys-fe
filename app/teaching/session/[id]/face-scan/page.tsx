'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/lib/api';

const CONFIDENCE_THRESHOLD = 0.6;
const DETECTION_INTERVAL = 500;
const AUTO_MARK_DELAY = 2000;

export default function FaceScanPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.id as string);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [faceMatcher, setFaceMatcher] = useState<any>(null);
  const [currentRecognition, setCurrentRecognition] = useState<any>(null);
  const [recentRecognitions, setRecentRecognitions] = useState<any[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<number, boolean>>({});

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
        console.log('✓ Face detection models loaded');
      } catch (err) {
        console.error('Model loading error:', err);
        setError('Gagal memuat model face detection');
      }
    };
    loadModels();
  }, []);

  // Load session data and enrolled students
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get session roster
        const rosterRes = await api.getSessionRoster(sessionId);
        if (rosterRes.success) {
          setSessionInfo({
            ...rosterRes.data.session,
            class: rosterRes.data.class
          });
          
          // Build attendance status map
          const statusMap: Record<number, boolean> = {};
          rosterRes.data.roster.forEach((student: any) => {
            if (student.attendance && student.attendance.status === 'HADIR') {
              statusMap[student.student_id] = true;
            }
          });
          setAttendanceStatus(statusMap);
        }

        // Get students with face descriptors
        const studentsRes = await api.getSessionFaceDescriptors(sessionId);
        if (studentsRes.success && studentsRes.data.faceDescriptors) {
          setEnrolledStudents(studentsRes.data.faceDescriptors);
          
          // Create face matcher
          if (studentsRes.data.faceDescriptors.length > 0) {
            const labeledDescriptors = studentsRes.data.faceDescriptors.map((student: any) => {
              const descriptors = student.descriptors.map((d: number[]) => new Float32Array(d));
              return new faceapi.LabeledFaceDescriptors(
                String(student.userId),
                descriptors
              );
            });
            const matcher = new faceapi.FaceMatcher(labeledDescriptors, CONFIDENCE_THRESHOLD);
            setFaceMatcher(matcher);
            console.log(`✓ Face matcher created with ${studentsRes.data.faceDescriptors.length} students`);
          }
        }
      } catch (err: any) {
        console.error('Load data error:', err);
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId && modelsLoaded) {
      loadData();
    }
  }, [sessionId, modelsLoaded]);

  // Face detection loop
  useEffect(() => {
    if (!isScanning || !faceMatcher || !webcamRef.current?.video) return;

    const detectFaces = async () => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || video.readyState !== 4) return;

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (resizedDetections.length > 0) {
          resizedDetections.forEach((detection) => {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            const box = detection.detection.box;
            const confidence = 1 - bestMatch.distance;
            
            if (bestMatch.label !== 'unknown' && confidence >= CONFIDENCE_THRESHOLD) {
              const studentId = parseInt(bestMatch.label);
              const student = enrolledStudents.find(s => s.userId === studentId);
              
              if (student) {
                // Draw green box
                if (ctx) {
                  ctx.strokeStyle = '#10b981';
                  ctx.lineWidth = 3;
                  ctx.strokeRect(box.x, box.y, box.width, box.height);
                  
                  // Draw label
                  ctx.fillStyle = '#10b981';
                  ctx.fillRect(box.x, box.y - 30, box.width, 30);
                  ctx.fillStyle = '#ffffff';
                  ctx.font = '16px sans-serif';
                  ctx.fillText(
                    `${student.name} (${Math.round(confidence * 100)}%)`,
                    box.x + 5,
                    box.y - 10
                  );
                }
                
                // Set current recognition
                setCurrentRecognition({
                  studentId,
                  name: student.name,
                  nim: student.nim,
                  confidence,
                  alreadyMarked: attendanceStatus[studentId] || false
                });
                
                // Auto-mark after delay
                if (!attendanceStatus[studentId] && !recognitionTimerRef.current) {
                  recognitionTimerRef.current = setTimeout(() => {
                    markAttendance(studentId, student.name, confidence);
                    recognitionTimerRef.current = null;
                  }, AUTO_MARK_DELAY);
                }
              }
            } else {
              // Draw red box for unknown
              if (ctx) {
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 3;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(box.x, box.y - 30, box.width, 30);
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px sans-serif';
                ctx.fillText('Tidak dikenali', box.x + 5, box.y - 10);
              }
              
              setCurrentRecognition(null);
              if (recognitionTimerRef.current) {
                clearTimeout(recognitionTimerRef.current);
                recognitionTimerRef.current = null;
              }
            }
          });
        } else {
          setCurrentRecognition(null);
          if (recognitionTimerRef.current) {
            clearTimeout(recognitionTimerRef.current);
            recognitionTimerRef.current = null;
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
      }
    };

    detectionIntervalRef.current = setInterval(detectFaces, DETECTION_INTERVAL);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (recognitionTimerRef.current) {
        clearTimeout(recognitionTimerRef.current);
      }
    };
  }, [isScanning, faceMatcher, enrolledStudents, attendanceStatus]);

  const markAttendance = async (studentId: number, studentName: string, confidence: number) => {
    try {
      // Capture frame
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        setError('Gagal mengambil foto');
        return;
      }

      // Mark attendance
      const res = await api.markFaceAttendance(
        sessionId,
        studentId,
        confidence,
        imageSrc,
        navigator.userAgent
      );

      if (res.success) {
        setSuccess(`✓ ${studentName} berhasil diabsen!`);
        setAttendanceStatus(prev => ({ ...prev, [studentId]: true }));
        setRecentRecognitions(prev => [
          { studentId, name: studentName, confidence, time: new Date() },
          ...prev.slice(0, 9)
        ]);
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      console.error('Mark attendance error:', err);
      setError(err.message || 'Gagal menandai kehadiran');
      setTimeout(() => setError(''), 3000);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setError('');
    setSuccess('');
  };

  const stopScanning = () => {
    setIsScanning(false);
    setCurrentRecognition(null);
    if (recognitionTimerRef.current) {
      clearTimeout(recognitionTimerRef.current);
      recognitionTimerRef.current = null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = {
    total: enrolledStudents.length,
    present: Object.keys(attendanceStatus).length,
    absent: enrolledStudents.length - Object.keys(attendanceStatus).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="secondary"
                onClick={() => router.push(`/teaching/session/${sessionId}`)}
                className="mb-3"
              >
                ← Kembali ke Sesi
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Scan Wajah - Absensi</h1>
              {sessionInfo && (
                <p className="text-gray-600 mt-1">
                  {sessionInfo.class?.course?.name} - {sessionInfo.class?.name} - Pertemuan {sessionInfo.session_number}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && <Alert type="error" className="mb-4" dismissible onDismiss={() => setError('')}>{error}</Alert>}
        {success && <Alert type="success" className="mb-4" dismissible onDismiss={() => setSuccess('')}>{success}</Alert>}

        {!modelsLoaded && (
          <Alert type="info" className="mb-4">
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span>Memuat model face detection...</span>
            </div>
          </Alert>
        )}

        {modelsLoaded && enrolledStudents.length === 0 && (
          <Alert type="warning" className="mb-4">
            Tidak ada mahasiswa yang terdaftar dengan data wajah. Mahasiswa harus mendaftar wajah terlebih dahulu.
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Camera Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600 mt-1">Terdaftar</div>
              </Card>
              <Card className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.present}</div>
                <div className="text-sm text-gray-600 mt-1">Hadir</div>
              </Card>
              <Card className="text-center">
                <div className="text-3xl font-bold text-gray-600">{stats.absent}</div>
                <div className="text-sm text-gray-600 mt-1">Belum Hadir</div>
              </Card>
            </div>

            {/* Camera */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Kamera Scanner</h2>
                {isScanning && (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Scanning...</span>
                  </div>
                )}
              </div>

              {!isScanning ? (
                <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <Button
                    onClick={startScanning}
                    disabled={!modelsLoaded || !faceMatcher}
                  >
                    Mulai Scan
                  </Button>
                  {!faceMatcher && modelsLoaded && (
                    <p className="text-sm text-gray-500">Tidak ada data wajah tersedia</p>
                  )}
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
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <Button onClick={stopScanning} variant="secondary">
                      Stop Scan
                    </Button>
                  </div>
                </div>
              )}

              {/* Current Recognition */}
              {currentRecognition && (
                <div className={`mt-4 p-4 rounded-lg ${currentRecognition.alreadyMarked ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{currentRecognition.name}</div>
                      <div className="text-sm text-gray-600">
                        NIM: {currentRecognition.nim} • Confidence: {Math.round(currentRecognition.confidence * 100)}%
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${currentRecognition.alreadyMarked ? 'text-yellow-700' : 'text-green-700'}`}>
                      {currentRecognition.alreadyMarked ? '✓ Sudah Absen' : '⏳ Menandai...'}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Recognitions */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Terakhir Dikenali</h3>
              {recentRecognitions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Belum ada yang dikenali</p>
              ) : (
                <div className="space-y-2">
                  {recentRecognitions.map((rec, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{rec.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(rec.time).toLocaleTimeString('id-ID')}
                        </div>
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        {Math.round(rec.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Student List */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Daftar Mahasiswa</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {enrolledStudents.map((student) => (
                  <div
                    key={student.userId}
                    className={`flex items-center justify-between text-sm p-2 rounded ${
                      attendanceStatus[student.userId]
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.nim}</div>
                    </div>
                    {attendanceStatus[student.userId] && (
                      <div className="text-green-600 font-medium">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Instructions */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Panduan</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600">1.</span>
                  <span>Klik "Mulai Scan" untuk mengaktifkan kamera</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600">2.</span>
                  <span>Mahasiswa berdiri di depan kamera</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600">3.</span>
                  <span>Sistem akan mendeteksi dan mengenali wajah</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-indigo-600">4.</span>
                  <span>Absensi otomatis setelah 2 detik</span>
                </li>
              </ol>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
