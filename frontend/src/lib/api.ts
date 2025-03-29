import axios from 'axios';
import {
  RunTestRequest,
  RunTestResponse,
  ScheduleTestRequest,
  ScheduleTestResponse,
  TestResult,
  TestResultsResponse,
  Schedule
} from '@/types/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const api = {
  // Test operations
  tests: {
    /**
     * Run a new form test
     */
    run: async (data: RunTestRequest): Promise<RunTestResponse> => {
      const response = await apiClient.post<RunTestResponse>('/run-test', data);
      return response.data;
    },

    /**
     * Get list of test results with filtering options
     */
    getAll: async (params?: {
      url?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      startKey?: string;
      sortByDate?: 'asc' | 'desc';
    }): Promise<TestResultsResponse> => {
      const response = await apiClient.get<TestResultsResponse>('/test-results', { params });
      return response.data;
    },

    /**
     * Get detailed test result by ID
     */
    getById: async (id: string): Promise<TestResult> => {
      const response = await apiClient.get<TestResult>(`/test-results/${id}`);
      return response.data;
    }
  },

  // Schedule operations
  schedules: {
    /**
     * Create a new test schedule
     */
    create: async (data: ScheduleTestRequest): Promise<ScheduleTestResponse> => {
      const response = await apiClient.post<ScheduleTestResponse>('/schedule-test', data);
      return response.data;
    },

    /**
     * Get all schedules
     */
    getAll: async (params?: {
      active?: boolean;
      limit?: number;
      startKey?: string;
    }): Promise<{
      items: Schedule[];
      nextToken?: string;
    }> => {
      const response = await apiClient.get<{
        items: Schedule[];
        nextToken?: string;
      }>('/schedules', { params });
      return response.data;
    },

    /**
     * Get schedule by ID
     */
    getById: async (id: string): Promise<Schedule> => {
      const response = await apiClient.get<Schedule>(`/schedules/${id}`);
      return response.data;
    },

    /**
     * Update a schedule
     */
    update: async (id: string, data: Partial<ScheduleTestRequest>): Promise<ScheduleTestResponse> => {
      const response = await apiClient.patch<ScheduleTestResponse>(`/schedules/${id}`, data);
      return response.data;
    },

    /**
     * Activate or deactivate a schedule
     */
    setActive: async (id: string, active: boolean): Promise<{
      message: string;
      scheduleId: string;
      active: boolean;
    }> => {
      const response = await apiClient.patch<{
        message: string;
        scheduleId: string;
        active: boolean;
      }>(`/schedules/${id}/active`, { active });
      return response.data;
    },

    /**
     * Delete a schedule
     */
    delete: async (id: string): Promise<{
      message: string;
      scheduleId: string;
    }> => {
      const response = await apiClient.delete<{
        message: string;
        scheduleId: string;
      }>(`/schedules/${id}`);
      return response.data;
    },

    /**
     * Get test runs for a schedule
     */
    getRuns: async (id: string, params?: {
      limit?: number;
      startKey?: string;
    }): Promise<TestResultsResponse> => {
      const response = await apiClient.get<TestResultsResponse>(`/schedules/${id}/runs`, { params });
      return response.data;
    }
  },

  // Analytics endpoints
  analytics: {
    /**
     * Get overall analytics
     */
    getOverview: async (params?: {
      startDate?: string;
      endDate?: string;
    }): Promise<{
      totalTests: number;
      successRate: number;
      avgDuration: number;
      failureRate: number;
      mostTestedForms: {
        url: string;
        count: number;
        successRate: number;
      }[];
      recentFailures: {
        id: string;
        url: string;
        status: string;
        createdAt: string;
        errorCount: number;
      }[];
      testsByDay: {
        date: string;
        total: number;
        successful: number;
        failed: number;
      }[];
      errorBreakdown: {
        field: number;
        navigation: number;
        timeout: number; 
        validation: number;
        submission: number;
        other: number;
      };
    }> => {
      const response = await apiClient.get('/analytics/overview', { params });
      return response.data;
    },

    /**
     * Get analytics for a specific URL
     */
    getByUrl: async (url: string, params?: {
      startDate?: string;
      endDate?: string;
    }): Promise<{
      url: string;
      totalTests: number;
      successRate: number;
      avgDuration: number;
      lastTestDate: string;
      lastTestStatus: string;
      errorBreakdown: {
        field: number;
        navigation: number;
        timeout: number;
        validation: number;
        submission: number;
        other: number;
      };
      testsByDay: {
        date: string;
        total: number;
        successful: number;
        failed: number;
      }[];
    }> => {
      const response = await apiClient.get(`/analytics/url`, { 
        params: { 
          url,
          ...params 
        } 
      });
      return response.data;
    }
  }
};

export default api;
