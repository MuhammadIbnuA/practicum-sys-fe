'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { api } from '@/lib/api';

export default function AdminGradesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [semesters, setSemesters] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get semesters
      const semestersRes = await api.getSemesters();
      if (semestersRes.success) {
        const semesterData = Array.isArray(semestersRes.data) ? semestersRes.data : [];
        setSemesters(semesterData);
        const active = semesterData.find((s: any) => s.is_active);
        if (active) {
          setSelectedSemester(active.id);
        }
      }

      // Get all classes
      const classesRes = await api.getAllClasses();
      if (classesRes.success) {
        const classData = Array.isArray(classesRes.data) ? classesRes.data : [];
        setClasses(classData);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = selectedSemester
    ? classes.filter(c => c.semester?.id === selectedSemester)
    : classes;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Nilai</h1>
          <p className="text-gray-600 mt-1">Input dan kelola nilai mahasiswa per kelas</p>
        </div>

        {error && <Alert type="error" className="mb-4" dismissible onDismiss={() => setError('')}>{error}</Alert>}

        {/* Semester Filter */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">Filter Semester:</label>
            <div className="flex gap-2">
              <Button
                variant={selectedSemester === null ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedSemester(null)}
              >
                Semua
              </Button>
              {Array.isArray(semesters) && semesters.map((semester) => (
                <Button
                  key={semester.id}
                  variant={selectedSemester === semester.id ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedSemester(semester.id)}
                >
                  {semester.name}
                  {semester.is_active && ' ⭐'}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Classes List */}
        <div className="grid gap-4">
          {filteredClasses.length === 0 ? (
            <Card>
              <div className="text-center py-12 text-gray-500">
                Tidak ada kelas ditemukan
              </div>
            </Card>
          ) : (
            filteredClasses.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {classItem.course.name} - {classItem.name}
                      </h3>
                      {classItem.semester?.is_active && (
                        <Badge variant="success" size="sm">Aktif</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>📚 {classItem.course.code}</span>
                      <span>👥 {classItem.student_count || 0} mahasiswa</span>
                      <span>📝 {classItem.sessions?.length || 0} pertemuan</span>
                      {classItem.semester && (
                        <span>📅 {classItem.semester.name}</span>
                      )}
                    </div>
                    {classItem.assistants && classItem.assistants.length > 0 && (
                      <div className="mt-2 text-sm text-gray-500">
                        Asisten: {classItem.assistants.map((a: any) => a.user.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/admin/grades/${classItem.id}`)}
                    >
                      Input Nilai
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
