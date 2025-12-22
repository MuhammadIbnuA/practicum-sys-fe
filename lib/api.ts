const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://practicum-sys-be.vercel.app';

interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T;
}

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('token', token);
            } else {
                localStorage.removeItem('token');
            }
        }
    }

    getToken(): string | null {
        if (this.token) return this.token;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const token = this.getToken();
        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    }

    // Auth
    async login(email: string, password: string) {
        const res = await this.request<{ user: User; token: string }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(res.data.token);
        return res.data;
    }

    async register(email: string, password: string, name: string) {
        const res = await this.request<{ user: User; token: string }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
        this.setToken(res.data.token);
        return res.data;
    }

    async getProfile() {
        return this.request<User>('/api/auth/me');
    }

    logout() {
        this.setToken(null);
    }

    // Student
    async getOpenClasses() {
        return this.request<ClassItem[]>('/api/student/classes/open');
    }

    async enrollClass(classId: number) {
        return this.request('/api/student/enroll', {
            method: 'POST',
            body: JSON.stringify({ classId }),
        });
    }

    async getMyClasses() {
        return this.request<ClassItem[]>('/api/student/my-classes');
    }

    async getMySchedule() {
        return this.request<ScheduleData>('/api/student/schedule');
    }

    async getClassReport(classId: number) {
        return this.request<ClassReport>(`/api/student/my-classes/${classId}/report`);
    }

    async submitAttendance(sessionId: number) {
        return this.request('/api/student/attendance/submit', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId }),
        });
    }

    // Teaching
    async getTeachingSchedule() {
        return this.request<ClassItem[]>('/api/teaching/schedule');
    }

    async checkIn(sessionId: number) {
        return this.request('/api/teaching/check-in', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId }),
        });
    }

    async getSessionRoster(sessionId: number) {
        return this.request<RosterData>(`/api/teaching/sessions/${sessionId}/roster`);
    }

    async getPendingAttendance(sessionId: number) {
        return this.request<PendingData>(`/api/teaching/sessions/${sessionId}/pending`);
    }

    async approveAttendance(attendanceId: number) {
        return this.request(`/api/teaching/attendance/${attendanceId}/approve`, { method: 'PUT' });
    }

    async rejectAttendance(attendanceId: number) {
        return this.request(`/api/teaching/attendance/${attendanceId}/reject`, { method: 'PUT' });
    }

    async updateBatchAttendance(sessionId: number, updates: AttendanceUpdate[]) {
        return this.request(`/api/teaching/sessions/${sessionId}/update-batch`, {
            method: 'PUT',
            body: JSON.stringify({ updates }),
        });
    }

    async getAttendanceRecap(classId: number) {
        return this.request<RecapData>(`/api/teaching/classes/${classId}/recap`);
    }

    async finalizeSession(sessionId: number) {
        return this.request<{ markedAlpha: number; totalStudents: number }>(`/api/teaching/sessions/${sessionId}/finalize`, { method: 'POST' });
    }

    // Admin
    async getTimeSlots() {
        return this.request<TimeSlot[]>('/api/admin/time-slots');
    }

    async getRooms() {
        return this.request<Room[]>('/api/admin/rooms');
    }

    async getSemesters() {
        return this.request<Semester[]>('/api/admin/semesters');
    }

    async getMasterSchedule(semesterId: number) {
        return this.request<MasterScheduleData>(`/api/admin/semesters/${semesterId}/schedule`);
    }

    async getAllClasses() {
        return this.request<ClassItem[]>('/api/admin/classes');
    }

    async adminUpdateAttendance(sessionId: number, updates: { studentId: number; status: string }[]) {
        return this.request<{ updated: number }>(`/api/admin/sessions/${sessionId}/attendance`, {
            method: 'PUT',
            body: JSON.stringify({ updates }),
        });
    }
}

// Types
export interface User {
    id: number;
    email: string;
    name: string;
    is_admin: boolean;
}

export interface TimeSlot {
    id: number;
    slot_number: number;
    start_time: string;
    end_time: string;
    label: string;
}

export interface Room {
    id: number;
    code: string;
    name: string;
}

export interface Semester {
    id: number;
    name: string;
    is_active: boolean;
}

export interface Course {
    id: number;
    code: string;
    name: string;
}

export interface ClassItem {
    id: number;
    name: string;
    quota: number;
    day_of_week?: number;
    day_name?: string;
    time_slot?: TimeSlot;
    room?: Room;
    course: Course;
    semester?: Semester;
    enrolled_count?: number;
    available_quota?: number;
    is_available?: boolean;
    student_count?: number;
    assistants?: { user: { id: number; name: string } }[];
    sessions?: SessionItem[];
}

export interface SessionItem {
    id: number;
    session_number: number;
    topic: string;
    type: string;
    date?: string;
    pending_count?: number;
    is_finalized?: boolean;
}

export interface ScheduleData {
    semester: Semester;
    timeSlots: TimeSlot[];
    dayNames: Record<string, string>;
    schedule: Record<string, Record<string, ClassItem | null>>;
}

export interface ClassReport {
    class: ClassItem;
    enrolled_at: string;
    sessions: {
        id: number;
        session_number: number;
        topic: string;
        type: string;
        status: string | null;
        grade: number | null;
        submitted_at?: string;
        approved_at?: string;
    }[];
    summary: {
        total_sessions: number;
        past_sessions: number;
        present_count: number;
        attendance_percentage: number;
        current_average_grade: number | null;
        graded_sessions: number;
    };
}

export interface RosterStudent {
    student_id: number;
    student_name: string;
    student_email: string;
    attendance: {
        id?: number;
        status: string;
        grade: number | null;
        submitted_at?: string;
    } | null;
}

export interface RosterData {
    session: SessionItem;
    class: ClassItem;
    student_count: number;
    status_counts: { pending: number; hadir: number; alpha: number };
    roster: RosterStudent[];
}

export interface PendingData {
    session: SessionItem;
    pending_count: number;
    submissions: {
        id: number;
        student: { id: number; name: string; email: string };
        submitted_at: string;
    }[];
}

export interface AttendanceUpdate {
    studentId: number;
    status: string;
    grade?: number | null;
}

export interface MasterScheduleData {
    semester: Semester;
    rooms: Room[];
    timeSlots: TimeSlot[];
    dayNames: Record<string, string>;
    schedule: Record<string, Record<string, Record<string, ClassItem | null>>>;
}

export interface RecapStudent {
    id: number;
    name: string;
    email: string;
    attendances: Record<number, { status: string; grade: number | null } | null>;
}

export interface RecapData {
    class: ClassItem;
    sessions: SessionItem[];
    students: RecapStudent[];
    stats: { session_number: number; hadir: number; alpha: number; pending: number; izin: number }[];
    total_students: number;
}

export const api = new ApiClient();

