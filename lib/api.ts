const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://practicum-sys-be.vercel.app';

interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

class ApiClient {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private isRefreshing = false;
    private refreshPromise: Promise<boolean> | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.accessToken = localStorage.getItem('accessToken');
            this.refreshToken = localStorage.getItem('refreshToken');
        }
    }

    setTokens(tokens: AuthTokens | null) {
        if (tokens) {
            this.accessToken = tokens.accessToken;
            this.refreshToken = tokens.refreshToken;
            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', tokens.accessToken);
                localStorage.setItem('refreshToken', tokens.refreshToken);
            }
        } else {
            this.accessToken = null;
            this.refreshToken = null;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        }
    }

    // Legacy support for existing code
    setToken(token: string | null) {
        if (token) {
            this.accessToken = token;
            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', token);
            }
        } else {
            this.setTokens(null);
        }
    }

    getToken(): string | null {
        if (this.accessToken) return this.accessToken;
        if (typeof window !== 'undefined') {
            this.accessToken = localStorage.getItem('accessToken');
        }
        return this.accessToken;
    }

    private async tryRefreshToken(): Promise<boolean> {
        if (!this.refreshToken) return false;

        // Prevent multiple simultaneous refresh attempts
        if (this.isRefreshing) {
            return this.refreshPromise || Promise.resolve(false);
        }

        this.isRefreshing = true;
        this.refreshPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: this.refreshToken }),
                });

                if (!res.ok) {
                    this.setTokens(null);
                    return false;
                }

                const data = await res.json();
                this.setTokens({
                    accessToken: data.data.accessToken,
                    refreshToken: data.data.refreshToken,
                    expiresIn: data.data.expiresIn
                });
                return true;
            } catch {
                this.setTokens(null);
                return false;
            } finally {
                this.isRefreshing = false;
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {},
        retried = false
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

        // Handle token expiry - try refresh once
        if (res.status === 401 && !retried && this.refreshToken) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
                return this.request<T>(endpoint, options, true);
            }
        }

        if (!res.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    }

    // Auth
    async login(email: string, password: string) {
        const res = await this.request<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setTokens({
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
            expiresIn: res.data.expiresIn
        });
        return res.data;
    }

    async register(email: string, password: string, name: string, nim?: string) {
        const res = await this.request<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, nim }),
        });
        this.setTokens({
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
            expiresIn: res.data.expiresIn
        });
        return res.data;
    }

    async getProfile() {
        return this.request<User>('/api/auth/me');
    }

    async changePassword(currentPassword: string, newPassword: string) {
        return this.request('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }


    logout() {
        this.setToken(null);
    }

    // Student
    async getOpenClasses() {
        return this.request<ClassItem[]>('/api/student/classes/open');
    }

    // DEPRECATED: Direct enrollment is disabled. Use payment system instead.
    // async enrollClass(classId: number) {
    //     return this.request('/api/student/enroll', {
    //         method: 'POST',
    //         body: JSON.stringify({ classId }),
    //     });
    // }

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
        return this.request<{ data: ClassItem[]; pagination: any }>('/api/teaching/schedule');
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

    async getStudents(page: number = 1, limit: number = 50, search: string = '') {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append('search', search);
        return this.request<{ data: any[]; pagination: any }>(`/api/admin/students?${params}`);
    }

    async resetStudentPassword(studentId: number, newPassword: string) {
        return this.request(`/api/admin/students/${studentId}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ newPassword }),
        });
    }

    async deleteStudent(studentId: number) {
        return this.request(`/api/admin/students/${studentId}`, {
            method: 'DELETE',
        });
    }

    // Payment
    async submitPayment(classId: number, proofFileName: string, proofFileData: string) {
        return this.request('/api/payment/submit', {
            method: 'POST',
            body: JSON.stringify({ classId, proofFileName, proofFileData }),
        });
    }

    async getPaymentStatus(classId: number) {
        return this.request<Payment>(`/api/payment/status/${classId}`);
    }

    async getMyPayments(page: number = 1, limit: number = 50) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        return this.request<{ data: Payment[]; pagination: any }>(`/api/payment/my-payments?${params}`);
    }

    async getPendingPayments(page: number = 1, limit: number = 50, status: string = '') {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status) params.append('status', status);
        return this.request<{ data: Payment[]; pagination: any }>(`/api/admin/payments?${params}`);
    }

    async verifyPayment(paymentId: number) {
        return this.request(`/api/admin/payments/${paymentId}/verify`, { method: 'PUT' });
    }

    async rejectPayment(paymentId: number, reason: string = '') {
        return this.request(`/api/admin/payments/${paymentId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    }

    async getPaymentStats() {
        return this.request<any>('/api/admin/payments/stats');
    }
}

// Types
export interface User {
    id: number;
    email: string;
    name: string;
    nim?: string;  // Nomor Induk Siswa (Student ID Number)
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

export interface Payment {
    id: number;
    student_id: number;
    class_id: number;
    amount: number;
    proof_file_name: string;
    proof_file_url: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
    verified_by_id?: number;
    verified_at?: string;
    created_at: string;
    updated_at: string;
    student?: { id: number; name: string; email: string; nim?: string };
    class?: ClassItem;
    verified_by?: { id: number; name: string };
}

export const api = new ApiClient();

