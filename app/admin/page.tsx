'use client';

import { useAuth } from '@/lib/auth';
import { api, Semester, Course, ClassItem, TimeSlot, Room, MasterScheduleData } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Button, Input, Select, Alert, Tabs, LoadingInline, Modal } from '@/components/ui';

type Tab = 'schedule' | 'semesters' | 'courses' | 'classes';

const tabs = [
  { id: 'schedule', label: 'Jadwal Besar' },
  { id: 'semesters', label: 'Semester' },
  { id: 'courses', label: 'Mata Kuliah' },
  { id: 'classes', label: 'Kelas' },
];

const dayNames: Record<number, string> = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat' };

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedule, setSchedule] = useState<MasterScheduleData | null>(null);
  const [activeSemesterId, setActiveSemesterId] = useState<number | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [newSemester, setNewSemester] = useState('');
  const [newCourse, setNewCourse] = useState({ code: '', name: '' });
  const [newClass, setNewClass] = useState({
    course_id: 0, semester_id: 0, name: '', quota: 30,
    day_of_week: 1, time_slot_id: 0, room_id: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Assistant management
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [assigningAssistant, setAssigningAssistant] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (!loading && user && !user.is_admin) router.push('/dashboard');
  }, [loading, user, router]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [semRes, courseRes, tsRes, roomRes] = await Promise.all([
        api.getSemesters().catch(() => ({ data: [] })),
        api.request<Course[]>('/api/admin/courses').catch(() => ({ data: [] })),
        api.getTimeSlots().catch(() => ({ data: [] })),
        api.getRooms().catch(() => ({ data: [] })),
      ]);
      
      // Handle paginated responses (data.data) or direct arrays (data)
      const semData = Array.isArray(semRes.data) ? semRes.data : (semRes.data as { data?: Semester[] })?.data || [];
      const courseData = Array.isArray(courseRes.data) ? courseRes.data : (courseRes.data as { data?: Course[] })?.data || [];
      const tsData = Array.isArray(tsRes.data) ? tsRes.data : (tsRes.data as { data?: TimeSlot[] })?.data || [];
      const roomData = Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data as { data?: Room[] })?.data || [];
      
      setSemesters(semData);
      setCourses(courseData);
      setTimeSlots(tsData);
      setRooms(roomData);

      if (semData.length > 0) {
        const active = semData.find((s: Semester) => s.is_active) || semData[0];
        setActiveSemesterId(active.id);
        setNewClass(c => ({ ...c, semester_id: active.id }));
      }
      if (courseData.length > 0) setNewClass(c => ({ ...c, course_id: courseData[0].id }));
      if (tsData.length > 0) setNewClass(c => ({ ...c, time_slot_id: tsData[0].id }));
      if (roomData.length > 0) setNewClass(c => ({ ...c, room_id: roomData[0].id }));
    } catch (e) { console.error(e); }
    setLoadingData(false);
  };

  const loadSchedule = async () => {
    if (activeSemesterId) {
      setScheduleLoading(true);
      const res = await api.getMasterSchedule(activeSemesterId).catch(() => null);
      setSchedule(res?.data || null);
      setScheduleLoading(false);
    }
  };

  const loadClasses = async () => {
    const res = await api.getAllClasses().catch(() => ({ data: [] }));
    setClasses(res.data);
  };

  useEffect(() => { if (user?.is_admin) loadData(); }, [user]);
  useEffect(() => {
    if (activeTab === 'schedule' && activeSemesterId) loadSchedule();
    if (activeTab === 'classes') loadClasses();
  }, [activeTab, activeSemesterId]);

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemester.trim()) return;
    setSubmitting(true);
    try {
      await api.request('/api/admin/semesters', { method: 'POST', body: JSON.stringify({ name: newSemester }) });
      setMessage({ type: 'success', text: 'Semester berhasil dibuat!' });
      setNewSemester('');
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal' });
    }
    setSubmitting(false);
  };

  const handleActivateSemester = async (id: number) => {
    setSubmitting(true);
    try {
      await api.request(`/api/admin/semesters/${id}/activate`, { method: 'PUT' });
      setMessage({ type: 'success', text: 'Semester diaktifkan!' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal' });
    }
    setSubmitting(false);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.code || !newCourse.name) return;
    setSubmitting(true);
    try {
      await api.request('/api/admin/courses', { method: 'POST', body: JSON.stringify(newCourse) });
      setMessage({ type: 'success', text: 'Mata kuliah berhasil dibuat!' });
      setNewCourse({ code: '', name: '' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal' });
    }
    setSubmitting(false);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.request('/api/admin/classes', { method: 'POST', body: JSON.stringify(newClass) });
      setMessage({ type: 'success', text: 'Kelas berhasil dibuat dengan 11 sesi!' });
      loadClasses();
      loadSchedule();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal' });
    }
    setSubmitting(false);
  };

  const handleOpenAssistantModal = async (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setShowAssistantModal(true);
    // Load available users (students who can be assistants)
    try {
      const res = await api.getStudents(1, 100, '');
      setAvailableUsers(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setSelectedUserId(res.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleAssignAssistant = async () => {
    if (!selectedClass || !selectedUserId) return;
    setAssigningAssistant(true);
    try {
      await api.assignAssistant(selectedClass.id, selectedUserId);
      setMessage({ type: 'success', text: 'Asisten berhasil ditambahkan!' });
      setShowAssistantModal(false);
      loadClasses();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menambahkan asisten' });
    } finally {
      setAssigningAssistant(false);
    }
  };

  const handleRemoveAssistant = async (classId: number, userId: number) => {
    if (!confirm('Hapus asisten dari kelas ini?')) return;
    try {
      await api.removeAssistant(classId, userId);
      setMessage({ type: 'success', text: 'Asisten berhasil dihapus!' });
      loadClasses();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Gagal menghapus asisten' });
    }
  };

  if (loading || !user || !user.is_admin) {
    return <LoadingInline className="min-h-screen" />;
  }

  const days = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-500 mt-1">Kelola sistem praktikum</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={(t) => setActiveTab(t as Tab)} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {message && (
          <Alert type={message.type} className="mb-6" dismissible onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {loadingData ? (
          <LoadingInline />
        ) : (
          <>
            {/* SEMESTERS */}
            {activeTab === 'semesters' && (
              <div className="space-y-6">
                <Card>
                  <h2 className="font-semibold text-gray-900 mb-4">Buat Semester</h2>
                  <form onSubmit={handleCreateSemester} className="flex gap-3">
                    <Input
                      value={newSemester}
                      onChange={e => setNewSemester(e.target.value)}
                      placeholder="Contoh: Genap 2024/2025"
                      className="flex-1"
                    />
                    <Button type="submit" loading={submitting}>Buat</Button>
                  </form>
                </Card>

                <Card padding="none">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Daftar Semester</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {semesters.map(s => (
                      <div key={s.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{s.name}</span>
                          {s.is_active && <Badge variant="success" size="sm">Aktif</Badge>}
                        </div>
                        {!s.is_active && (
                          <Button variant="ghost" size="xs" onClick={() => handleActivateSemester(s.id)} disabled={submitting}>
                            Aktifkan
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* COURSES */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
                <Card>
                  <h2 className="font-semibold text-gray-900 mb-4">Buat Mata Kuliah</h2>
                  <form onSubmit={handleCreateCourse} className="flex gap-3">
                    <Input
                      value={newCourse.code}
                      onChange={e => setNewCourse(c => ({ ...c, code: e.target.value }))}
                      placeholder="Kode (IF101)"
                      className="w-32"
                    />
                    <Input
                      value={newCourse.name}
                      onChange={e => setNewCourse(c => ({ ...c, name: e.target.value }))}
                      placeholder="Nama Mata Kuliah"
                      className="flex-1"
                    />
                    <Button type="submit" loading={submitting}>Buat</Button>
                  </form>
                </Card>

                <Card padding="none">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Daftar Mata Kuliah</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {courses.map(c => (
                      <div key={c.id} className="px-5 py-4 hover:bg-gray-50">
                        <span className="font-mono text-indigo-600 text-sm">{c.code}</span>
                        <span className="ml-3 text-gray-900">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* CLASSES */}
            {activeTab === 'classes' && (
              <div className="space-y-6">
                <Card>
                  <h2 className="font-semibold text-gray-900 mb-4">Buat Kelas</h2>
                  <form onSubmit={handleCreateClass} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Select
                      value={String(newClass.course_id)}
                      onChange={e => setNewClass(c => ({ ...c, course_id: +e.target.value }))}
                      options={courses.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
                    />
                    <Select
                      value={String(newClass.semester_id)}
                      onChange={e => setNewClass(c => ({ ...c, semester_id: +e.target.value }))}
                      options={semesters.map(s => ({ value: s.id, label: s.name }))}
                    />
                    <Input
                      value={newClass.name}
                      onChange={e => setNewClass(c => ({ ...c, name: e.target.value }))}
                      placeholder="Nama Kelas (A)"
                    />
                    <Input
                      type="number"
                      value={newClass.quota}
                      onChange={e => setNewClass(c => ({ ...c, quota: +e.target.value }))}
                      placeholder="Kuota"
                    />
                    <Select
                      value={String(newClass.day_of_week)}
                      onChange={e => setNewClass(c => ({ ...c, day_of_week: +e.target.value }))}
                      options={days.map(d => ({ value: d, label: dayNames[d] }))}
                    />
                    <Select
                      value={String(newClass.time_slot_id)}
                      onChange={e => setNewClass(c => ({ ...c, time_slot_id: +e.target.value }))}
                      options={timeSlots.map(t => ({ value: t.id, label: t.label }))}
                    />
                    <Select
                      value={String(newClass.room_id)}
                      onChange={e => setNewClass(c => ({ ...c, room_id: +e.target.value }))}
                      options={rooms.map(r => ({ value: r.id, label: r.name }))}
                    />
                    <Button type="submit" loading={submitting}>Buat Kelas</Button>
                  </form>
                </Card>

                <Card padding="none">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Daftar Kelas</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {classes.map(c => (
                      <div key={c.id} className="px-5 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-indigo-600 text-sm">{c.course?.code}</span>
                              <span className="font-medium text-gray-900">{c.name}</span>
                              <span className="text-sm text-gray-500">
                                {dayNames[c.day_of_week || 1]} • {c.time_slot?.label} • {c.room?.code}
                              </span>
                            </div>
                            {c.assistants && c.assistants.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {c.assistants.map(a => (
                                  <div key={a.user?.id} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs">
                                    <span>{a.user?.name}</span>
                                    <button
                                      onClick={() => handleRemoveAssistant(c.id, a.user?.id || 0)}
                                      className="ml-1 hover:text-indigo-900"
                                      title="Hapus asisten"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1">Belum ada asisten</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="secondary" 
                              size="xs"
                              onClick={() => handleOpenAssistantModal(c)}
                            >
                              + Asisten
                            </Button>
                            <Link href={`/recap/${c.id}`}>
                              <Button variant="ghost" size="xs">Rekap</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* SCHEDULE */}
            {activeTab === 'schedule' && (
              <>
                <Card className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">Jadwal Besar</h2>
                      <p className="text-sm text-gray-500">Semester: {schedule?.semester?.name || '-'}</p>
                    </div>
                    <Select
                      value={activeSemesterId ? String(activeSemesterId) : ''}
                      onChange={e => setActiveSemesterId(+e.target.value)}
                      options={semesters.map(s => ({ value: s.id, label: s.name }))}
                      className="w-48"
                    />
                  </div>
                </Card>

                {scheduleLoading ? (
                  <LoadingInline />
                ) : !schedule || !schedule.rooms || schedule.rooms.length === 0 ? (
                  <Card className="text-center py-12">
                    <p className="text-gray-500">
                      {!activeSemesterId ? 'Pilih semester untuk melihat jadwal' : 'Tidak ada data jadwal untuk semester ini'}
                    </p>
                  </Card>
                ) : schedule.rooms.map((room: Room) => (
                  <div key={room.id} className="mb-8">
                    <h3 className="font-semibold text-gray-900 mb-3">{room.name} ({room.code})</h3>
                    <Card padding="none" className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-24">Waktu</th>
                              {days.map(day => (
                                <th key={day} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                                  {dayNames[day]}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {timeSlots.map((slot: TimeSlot) => (
                              <tr key={slot.id}>
                                <td className="px-4 py-3 text-sm">
                                  <div className="font-medium text-gray-900">{slot.start_time}</div>
                                  <div className="text-xs text-gray-400">{slot.end_time}</div>
                                </td>
                                {days.map(day => {
                                  const cls = schedule.schedule?.[day]?.[slot.slot_number]?.[room.code];
                                  return (
                                    <td key={day} className="px-2 py-2">
                                      {cls ? (
                                        <Link href={`/recap/${cls.id}`}>
                                          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 hover:bg-indigo-100 transition-colors">
                                            <p className="font-medium text-indigo-900 text-xs">{cls.course?.code}</p>
                                            <p className="text-xs text-indigo-600">{cls.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{(cls as { enrolled?: number }).enrolled || cls.enrolled_count || 0}/{cls.quota}</p>
                                          </div>
                                        </Link>
                                      ) : (
                                        <div className="h-16 bg-gray-50 rounded-lg border border-dashed border-gray-200" />
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </main>

      {/* Assistant Assignment Modal */}
      <Modal
        isOpen={showAssistantModal}
        onClose={() => setShowAssistantModal(false)}
        title="Tambah Asisten"
      >
        <div className="space-y-4">
          {selectedClass && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                {selectedClass.course?.code} - {selectedClass.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {dayNames[selectedClass.day_of_week || 1]} • {selectedClass.time_slot?.label}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Pengguna sebagai Asisten
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) {user.nim ? `- NIM: ${user.nim}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Pilih mahasiswa atau pengguna yang akan menjadi asisten untuk kelas ini
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowAssistantModal(false)}
              variant="secondary"
              fullWidth
            >
              Batal
            </Button>
            <Button
              onClick={handleAssignAssistant}
              loading={assigningAssistant}
              disabled={!selectedUserId}
              fullWidth
            >
              Tambah Asisten
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
