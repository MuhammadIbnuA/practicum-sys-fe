'use client';

import useSWR from 'swr';
import { api, ClassItem, SessionItem, RosterData, RecapData } from './api';

// Generic fetcher for SWR
const fetcher = <T,>(endpoint: string) => api.request<T>(endpoint).then(r => r.data);

// ============================================================================
// STUDENT HOOKS
// ============================================================================

export function useStudentSchedule() {
    const { data, error, isLoading, mutate } = useSWR<ClassItem[]>(
        '/api/student/schedule',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30000 }
    );
    return { classes: data, error, isLoading, refresh: mutate };
}

export function useStudentClasses() {
    const { data, error, isLoading, mutate } = useSWR<ClassItem[]>(
        '/api/student/classes',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30000 }
    );
    return { classes: data, error, isLoading, refresh: mutate };
}

// ============================================================================
// TEACHING HOOKS
// ============================================================================

export function useTeachingSchedule() {
    const { data, error, isLoading, mutate } = useSWR<ClassItem[]>(
        '/api/teaching/schedule',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30000 }
    );
    return { classes: data, error, isLoading, refresh: mutate };
}

export function useSessionRoster(sessionId: number | null) {
    const { data, error, isLoading, mutate } = useSWR<RosterData>(
        sessionId ? `/api/teaching/sessions/${sessionId}/roster` : null,
        fetcher,
        { revalidateOnFocus: false }
    );
    return { roster: data, error, isLoading, refresh: mutate };
}

export function useAttendanceRecap(classId: number | null) {
    const { data, error, isLoading, mutate } = useSWR<RecapData>(
        classId ? `/api/teaching/classes/${classId}/recap` : null,
        fetcher,
        { revalidateOnFocus: false }
    );
    return { recap: data, error, isLoading, refresh: mutate };
}

// ============================================================================
// ADMIN HOOKS
// ============================================================================

export function useAllClasses() {
    const { data, error, isLoading, mutate } = useSWR<ClassItem[]>(
        '/api/admin/classes',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );
    return { classes: data, error, isLoading, refresh: mutate };
}

export function useSemesters() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/admin/semesters',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );
    return { semesters: data, error, isLoading, refresh: mutate };
}

export function useTimeSlots() {
    const { data, error, isLoading } = useSWR(
        '/api/admin/time-slots',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 300000 } // 5 minutes - rarely changes
    );
    return { timeSlots: data, error, isLoading };
}

export function useRooms() {
    const { data, error, isLoading } = useSWR(
        '/api/admin/rooms',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 300000 } // 5 minutes - rarely changes
    );
    return { rooms: data, error, isLoading };
}

export function useCourses() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/admin/courses',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 60000 }
    );
    return { courses: data, error, isLoading, refresh: mutate };
}
