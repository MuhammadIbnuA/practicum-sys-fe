'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { api } from '@/lib/api';

import { exportGradesToExcel, GradeExportData, SessionInfo } from '@/lib/exportUtils';

export default function AdminClassGradesPage() {
  const params = useParams();
  const router = useRouter();
  const classId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState<any>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [theoryClassFilter, setTheoryClassFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'nim' | 'theory'>('name');

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getClassGrades(classId);
      if (res.success) {
        setData(res.data);
        
        // Initialize grades state
        const initialGrades: Record<string, number> = {};
        res.data.students.forEach((student: any) => {
          res.data.sessions.forEach((session: any) => {
            const key = `${student.id}-${session.id}`;
            const gradeData = student.grades[session.id];
            if (gradeData?.grade !== null && gradeData?.grade !== undefined) {
              initialGrades[key] = gradeData.grade;
            }
          });
        });
        setGrades(initialGrades);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId: number, sessionId: number, value: string) => {
    const key = `${studentId}-${sessionId}`;
    const numValue = parseFloat(value);
    
    if (value === '' || (numValue >= 0 && numValue <= 100)) {
      setGrades(prev => ({
        ...prev,
        [key]: value === '' ? 0 : numValue
      }));
    }
  };

  const saveGrade = async (studentId: number, sessionId: number) => {
    const key = `${studentId}-${sessionId}`;
    const grade = grades[key];

    if (grade === undefined || grade < 0 || grade > 100) {
      setError('Nilai harus antara 0-100');
      return;
    }

    try {
      setSaving(true);
      await api.updateGrade(studentId, sessionId, grade);
      setSuccess('Nilai berhasil disimpan');
      setEditMode(prev => ({ ...prev, [key]: false }));
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  const toggleEdit = (studentId: number, sessionId: number) => {
    const key = `${studentId}-${sessionId}`;
    setEditMode(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = () => {
    if (!data) return;
    
    // Prepare export data
    const exportData: GradeExportData[] = data.students
      .filter((student: any) => {
        // Apply same filters as display
        if (theoryClassFilter) {
          const studentTheoryClass = student.theory_class || '';
          return studentTheoryClass.toUpperCase().includes(theoryClassFilter);
        }
        return true;
      })
      .sort((a: any, b: any) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'nim') {
          return (a.nim || '').localeCompare(b.nim || '');
        } else if (sortBy === 'theory') {
          return (a.theory_class || '').localeCompare(b.theory_class || '');
        }
        return 0;
      })
      .map((student: any) => {
        const studentGrades: Record<string, number | null> = {};
        let gradeSum = 0;
        let gradeCount = 0;
        
        data.sessions.forEach((session: any) => {
          const key = `${student.id}-${session.id}`;
          const grade = grades[key];
          studentGrades[session.id] = grade !== undefined && grade !== null ? grade : null;
          
          if (grade !== undefined && grade !== null) {
            gradeSum += grade;
            gradeCount++;
          }
        });
        
        const average = gradeCount > 0 ? gradeSum / gradeCount : 0;
        
        return {
          name: student.name,
          nim: student.nim,
          theory_class: student.theory_class || '-',
          practicum_class: data.class.name,
          grades: studentGrades,
          average
        };
      });
    
    const sessions: SessionInfo[] = data.sessions.map((s: any) => ({
      id: s.id,
      session_number: s.session_number,
      topic: s.topic,
      type: s.type
    }));
    
    exportGradesToExcel(
      exportData,
      sessions,
      data.class.name,
      data.class.course.name
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert type="error">Data tidak ditemukan</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => router.push('/admin/grades')}
            className="mb-4"
          >
            ← Kembali ke Daftar Kelas
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900">Input Nilai - Admin</h1>
          <p className="text-gray-600 mt-1">
            {data.class.course.name} - {data.class.name}
          </p>
        </div>

        {error && <Alert type="error" className="mb-4" dismissible onDismiss={() => setError('')}>{error}</Alert>}
        {success && <Alert type="success" className="mb-4" dismissible onDismiss={() => setSuccess('')}>{success}</Alert>}

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Kelas Teori
              </label>
              <Input
                type="text"
                placeholder="Contoh: A, B, C, D"
                value={theoryClassFilter}
                onChange={(e) => setTheoryClassFilter(e.target.value.toUpperCase())}
                className="max-w-xs"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutkan Berdasarkan
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Nama</option>
                <option value="nim">NIM</option>
                <option value="theory">Kelas Teori</option>
              </select>
            </div>
            <div className="flex gap-2 mt-6">
              {theoryClassFilter && (
                <Button
                  variant="secondary"
                  onClick={() => setTheoryClassFilter('')}
                >
                  Reset Filter
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleExport}
              >
                📥 Export Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600">{data.totalStudents}</div>
            <div className="text-sm text-gray-600 mt-1">Total Mahasiswa</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{data.totalSessions}</div>
            <div className="text-sm text-gray-600 mt-1">Total Pertemuan</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {Math.round((Object.keys(grades).length / (data.totalStudents * data.totalSessions)) * 100)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Nilai Terinput</div>
          </Card>
        </div>

        {/* Grading Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="sticky left-0 bg-white px-4 py-3 text-left font-semibold text-gray-900 border-r border-gray-200 z-10">
                    Mahasiswa
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 min-w-[100px]">
                    Kelas Teori
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 min-w-[120px]">
                    Kelas Praktikum
                  </th>
                  {data.sessions.map((session: any) => (
                    <th key={session.id} className="px-4 py-3 text-center font-semibold text-gray-900 min-w-[120px]">
                      <div>P{session.session_number}</div>
                      <div className="text-xs font-normal text-gray-500 mt-1">
                        {session.type === 'EXAM' ? 'Responsi' : session.topic || 'Tugas'}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-gray-900 min-w-[100px]">
                    Rata-rata
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.students
                  .filter((student: any) => {
                    // Filter by theory class
                    if (theoryClassFilter) {
                      const studentTheoryClass = student.theory_class || '';
                      return studentTheoryClass.toUpperCase().includes(theoryClassFilter);
                    }
                    return true;
                  })
                  .sort((a: any, b: any) => {
                    // Sort by selected field
                    if (sortBy === 'name') {
                      return a.name.localeCompare(b.name);
                    } else if (sortBy === 'nim') {
                      return (a.nim || '').localeCompare(b.nim || '');
                    } else if (sortBy === 'theory') {
                      return (a.theory_class || '').localeCompare(b.theory_class || '');
                    }
                    return 0;
                  })
                  .map((student: any) => {
                  const studentGrades = data.sessions
                    .map((s: any) => grades[`${student.id}-${s.id}`])
                    .filter((g: number) => g !== undefined && g !== null);
                  
                  const average = studentGrades.length > 0
                    ? studentGrades.reduce((sum: number, g: number) => sum + g, 0) / studentGrades.length
                    : 0;

                  return (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-4 py-3 border-r border-gray-200 z-10">
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.nim}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="primary" size="sm">
                          {student.theory_class || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-700">
                          {data.class.name}
                        </span>
                      </td>
                      {data.sessions.map((session: any) => {
                        const key = `${student.id}-${session.id}`;
                        const gradeData = student.grades[session.id];
                        const canEdit = gradeData?.canEdit || false;
                        const isEditing = editMode[key] || false;
                        const currentGrade = grades[key];

                        return (
                          <td key={session.id} className="px-4 py-3 text-center">
                            {!canEdit ? (
                              <Badge variant="secondary" size="sm">-</Badge>
                            ) : isEditing ? (
                              <div className="flex items-center gap-2 justify-center">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={currentGrade || ''}
                                  onChange={(e) => handleGradeChange(student.id, session.id, e.target.value)}
                                  className="w-20 text-center"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => saveGrade(student.id, session.id)}
                                  disabled={saving}
                                >
                                  ✓
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => toggleEdit(student.id, session.id)}
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleEdit(student.id, session.id)}
                                className="px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                              >
                                {currentGrade !== undefined && currentGrade !== null ? (
                                  <span className="font-medium text-gray-900">{currentGrade.toFixed(1)}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${average >= 75 ? 'text-green-600' : average >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {average > 0 ? average.toFixed(1) : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Tidak hadir (tidak bisa input nilai)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span>Hadir (klik untuk input nilai)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
