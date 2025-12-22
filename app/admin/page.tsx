'use client';

import { useAuth } from '@/lib/auth';
import { api, Semester, Course, ClassItem, TimeSlot, Room, MasterScheduleData } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Tab = 'schedule' | 'semesters' | 'courses' | 'classes';

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('schedule');
    const [loadingData, setLoadingData] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Data states
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [schedule, setSchedule] = useState<MasterScheduleData | null>(null);
    const [activeSemesterId, setActiveSemesterId] = useState<number>(1);

    // Form states
    const [newSemester, setNewSemester] = useState('');
    const [newCourse, setNewCourse] = useState({ code: '', name: '' });
    const [newClass, setNewClass] = useState({
        course_id: 0,
        semester_id: 0,
        name: '',
        quota: 30,
        day_of_week: 1,
        time_slot_id: 0,
        room_id: 0,
    });
    const [assignAssistant, setAssignAssistant] = useState({ classId: 0, email: '' });
    const [submitting, setSubmitting] = useState(false);

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
            setSemesters(semRes.data);
            setCourses(courseRes.data);
            setTimeSlots(tsRes.data);
            setRooms(roomRes.data);

            // Set defaults
            if (semRes.data.length > 0) {
                const active = semRes.data.find(s => s.is_active) || semRes.data[0];
                setActiveSemesterId(active.id);
                setNewClass(c => ({ ...c, semester_id: active.id }));
            }
            if (courseRes.data.length > 0) setNewClass(c => ({ ...c, course_id: courseRes.data[0].id }));
            if (tsRes.data.length > 0) setNewClass(c => ({ ...c, time_slot_id: tsRes.data[0].id }));
            if (roomRes.data.length > 0) setNewClass(c => ({ ...c, room_id: roomRes.data[0].id }));
        } catch (e) {
            console.error(e);
        }
        setLoadingData(false);
    };

    const loadSchedule = async () => {
        if (activeSemesterId) {
            const res = await api.getMasterSchedule(activeSemesterId).catch(() => null);
            setSchedule(res?.data || null);
        }
    };

    const loadClasses = async () => {
        const res = await api.getAllClasses().catch(() => ({ data: [] }));
        setClasses(res.data);
    };

    useEffect(() => {
        if (user?.is_admin) {
            loadData();
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'schedule') loadSchedule();
        if (activeTab === 'classes') loadClasses();
    }, [activeTab, activeSemesterId]);

    // Handlers
    const handleCreateSemester = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSemester.trim()) return;
        setSubmitting(true);
        try {
            await api.request('/api/admin/semesters', {
                method: 'POST',
                body: JSON.stringify({ name: newSemester }),
            });
            setMessage({ type: 'success', text: 'Semester created!' });
            setNewSemester('');
            loadData();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
        }
        setSubmitting(false);
    };

    const handleActivateSemester = async (id: number) => {
        setSubmitting(true);
        try {
            await api.request(`/api/admin/semesters/${id}/activate`, { method: 'PUT' });
            setMessage({ type: 'success', text: 'Semester activated!' });
            loadData();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
        }
        setSubmitting(false);
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourse.code || !newCourse.name) return;
        setSubmitting(true);
        try {
            await api.request('/api/admin/courses', {
                method: 'POST',
                body: JSON.stringify(newCourse),
            });
            setMessage({ type: 'success', text: 'Course created!' });
            setNewCourse({ code: '', name: '' });
            loadData();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
        }
        setSubmitting(false);
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.request('/api/admin/classes', {
                method: 'POST',
                body: JSON.stringify(newClass),
            });
            setMessage({ type: 'success', text: 'Class created with 11 sessions!' });
            loadClasses();
            loadSchedule();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
        }
        setSubmitting(false);
    };

    const handleAssignAssistant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignAssistant.classId || !assignAssistant.email) return;
        setSubmitting(true);
        try {
            await api.request(`/api/admin/classes/${assignAssistant.classId}/assistants`, {
                method: 'POST',
                body: JSON.stringify({ email: assignAssistant.email }),
            });
            setMessage({ type: 'success', text: 'Assistant assigned!' });
            loadClasses();
            setAssignAssistant({ classId: 0, email: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed' });
        }
        setSubmitting(false);
    };

    if (loading || !user || !user.is_admin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const days = [1, 2, 3, 4, 5];
    const dayNames: Record<number, string> = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat' };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-purple-600 text-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-purple-200 hover:text-white">
                            ← Dashboard
                        </Link>
                        <h1 className="text-xl font-bold">Admin Panel</h1>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex gap-6">
                        {[
                            { key: 'schedule', label: '📅 Master Schedule' },
                            { key: 'semesters', label: '📆 Semesters' },
                            { key: 'courses', label: '📚 Courses' },
                            { key: 'classes', label: '🏫 Classes' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as Tab)}
                                className={`py-4 px-2 border-b-2 text-sm font-medium transition ${activeTab === tab.key
                                        ? 'border-purple-600 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {message && (
                    <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                        <button onClick={() => setMessage(null)} className="ml-4 text-sm underline">Dismiss</button>
                    </div>
                )}

                {loadingData ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <>
                        {/* SEMESTERS TAB */}
                        {activeTab === 'semesters' && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 border">
                                    <h2 className="font-semibold text-gray-800 mb-4">➕ Create Semester</h2>
                                    <form onSubmit={handleCreateSemester} className="flex gap-4">
                                        <input
                                            type="text"
                                            value={newSemester}
                                            onChange={e => setNewSemester(e.target.value)}
                                            placeholder="e.g. Genap 2024/2025"
                                            className="flex-1 px-4 py-2 border rounded-lg"
                                        />
                                        <button disabled={submitting} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                                            Create
                                        </button>
                                    </form>
                                </div>
                                <div className="bg-white rounded-xl border overflow-hidden">
                                    <h2 className="font-semibold text-gray-800 p-5 border-b">📆 All Semesters</h2>
                                    <div className="divide-y">
                                        {semesters.map(s => (
                                            <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                                <div>
                                                    <span className={`font-medium ${s.is_active ? 'text-green-600' : 'text-gray-800'}`}>
                                                        {s.name}
                                                    </span>
                                                    {s.is_active && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>}
                                                </div>
                                                {!s.is_active && (
                                                    <button
                                                        onClick={() => handleActivateSemester(s.id)}
                                                        disabled={submitting}
                                                        className="text-sm text-purple-600 hover:underline"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* COURSES TAB */}
                        {activeTab === 'courses' && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 border">
                                    <h2 className="font-semibold text-gray-800 mb-4">➕ Create Course</h2>
                                    <form onSubmit={handleCreateCourse} className="flex gap-4">
                                        <input
                                            type="text"
                                            value={newCourse.code}
                                            onChange={e => setNewCourse(c => ({ ...c, code: e.target.value }))}
                                            placeholder="Code (IF101)"
                                            className="w-32 px-4 py-2 border rounded-lg"
                                        />
                                        <input
                                            type="text"
                                            value={newCourse.name}
                                            onChange={e => setNewCourse(c => ({ ...c, name: e.target.value }))}
                                            placeholder="Course Name"
                                            className="flex-1 px-4 py-2 border rounded-lg"
                                        />
                                        <button disabled={submitting} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                                            Create
                                        </button>
                                    </form>
                                </div>
                                <div className="bg-white rounded-xl border overflow-hidden">
                                    <h2 className="font-semibold text-gray-800 p-5 border-b">📚 All Courses</h2>
                                    <div className="divide-y">
                                        {courses.map(c => (
                                            <div key={c.id} className="p-4 hover:bg-gray-50">
                                                <span className="font-mono text-purple-600">{c.code}</span>
                                                <span className="ml-3 text-gray-800">{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CLASSES TAB */}
                        {activeTab === 'classes' && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 border">
                                    <h2 className="font-semibold text-gray-800 mb-4">➕ Create Class</h2>
                                    <form onSubmit={handleCreateClass} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <select value={newClass.course_id} onChange={e => setNewClass(c => ({ ...c, course_id: +e.target.value }))} className="px-3 py-2 border rounded-lg">
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                        </select>
                                        <select value={newClass.semester_id} onChange={e => setNewClass(c => ({ ...c, semester_id: +e.target.value }))} className="px-3 py-2 border rounded-lg">
                                            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <input value={newClass.name} onChange={e => setNewClass(c => ({ ...c, name: e.target.value }))} placeholder="Class Name (A)" className="px-3 py-2 border rounded-lg" />
                                        <input type="number" value={newClass.quota} onChange={e => setNewClass(c => ({ ...c, quota: +e.target.value }))} placeholder="Quota" className="px-3 py-2 border rounded-lg" />
                                        <select value={newClass.day_of_week} onChange={e => setNewClass(c => ({ ...c, day_of_week: +e.target.value }))} className="px-3 py-2 border rounded-lg">
                                            {days.map(d => <option key={d} value={d}>{dayNames[d]}</option>)}
                                        </select>
                                        <select value={newClass.time_slot_id} onChange={e => setNewClass(c => ({ ...c, time_slot_id: +e.target.value }))} className="px-3 py-2 border rounded-lg">
                                            {timeSlots.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <select value={newClass.room_id} onChange={e => setNewClass(c => ({ ...c, room_id: +e.target.value }))} className="px-3 py-2 border rounded-lg">
                                            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                        <button disabled={submitting} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                                            Create Class
                                        </button>
                                    </form>
                                </div>

                                <div className="bg-white rounded-xl p-6 border">
                                    <h2 className="font-semibold text-gray-800 mb-4">👨‍🏫 Assign Assistant</h2>
                                    <form onSubmit={handleAssignAssistant} className="flex gap-4">
                                        <select value={assignAssistant.classId} onChange={e => setAssignAssistant(a => ({ ...a, classId: +e.target.value }))} className="flex-1 px-3 py-2 border rounded-lg">
                                            <option value={0}>Select Class</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.course?.code} - {c.name}</option>)}
                                        </select>
                                        <input
                                            type="email"
                                            value={assignAssistant.email}
                                            onChange={e => setAssignAssistant(a => ({ ...a, email: e.target.value }))}
                                            placeholder="Assistant Email"
                                            className="flex-1 px-3 py-2 border rounded-lg"
                                        />
                                        <button disabled={submitting} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                                            Assign
                                        </button>
                                    </form>
                                </div>

                                <div className="bg-white rounded-xl border overflow-hidden">
                                    <h2 className="font-semibold text-gray-800 p-5 border-b">🏫 All Classes</h2>
                                    <div className="divide-y">
                                        {classes.map(c => (
                                            <div key={c.id} className="p-4 hover:bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-mono text-purple-600">{c.course?.code}</span>
                                                        <span className="ml-2 font-medium text-gray-800">{c.name}</span>
                                                        <span className="ml-3 text-sm text-gray-500">
                                                            {dayNames[c.day_of_week || 1]} • {c.time_slot?.label} • {c.room?.code}
                                                        </span>
                                                    </div>
                                                    <Link href={`/recap/${c.id}`} className="text-sm text-indigo-600 hover:underline">
                                                        📊 Rekap
                                                    </Link>
                                                </div>
                                                {c.assistants && c.assistants.length > 0 && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Asisten: {c.assistants.map(a => a.user?.name || 'Unknown').join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SCHEDULE TAB */}
                        {activeTab === 'schedule' && (
                            <>
                                <div className="bg-white rounded-xl p-5 border mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="font-semibold text-gray-800">📅 Master Schedule</h2>
                                        <p className="text-sm text-gray-500">Semester: {schedule?.semester?.name || 'None'}</p>
                                    </div>
                                    <select
                                        value={activeSemesterId}
                                        onChange={e => setActiveSemesterId(+e.target.value)}
                                        className="px-3 py-2 border rounded-lg"
                                    >
                                        {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                {schedule && schedule.rooms.map((room: Room) => (
                                    <div key={room.id} className="mb-8">
                                        <h3 className="font-semibold text-gray-800 mb-3">🏠 {room.name} ({room.code})</h3>
                                        <div className="bg-white rounded-xl border overflow-x-auto">
                                            <table className="w-full min-w-[800px]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b">
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-32">Waktu</th>
                                                        {days.map(day => (
                                                            <th key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                                                                {dayNames[day]}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {timeSlots.map((slot: TimeSlot) => (
                                                        <tr key={slot.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                <div className="font-medium">{slot.start_time}</div>
                                                                <div className="text-xs text-gray-400">{slot.end_time}</div>
                                                            </td>
                                                            {days.map(day => {
                                                                const cls = schedule.schedule?.[day]?.[slot.slot_number]?.[room.code];
                                                                return (
                                                                    <td key={day} className="px-2 py-2">
                                                                        {cls ? (
                                                                            <Link href={`/recap/${cls.id}`} className="block bg-purple-50 border border-purple-200 rounded-lg p-2 hover:bg-purple-100 transition">
                                                                                <p className="font-medium text-purple-800 text-sm">{cls.course?.code}</p>
                                                                                <p className="text-xs text-purple-600">{cls.name}</p>
                                                                                <p className="text-xs text-gray-500 mt-1">{cls.enrolled_count || 0}/{cls.quota}</p>
                                                                            </Link>
                                                                        ) : (
                                                                            <div className="h-16 bg-gray-50 rounded-lg border border-dashed border-gray-200"></div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
