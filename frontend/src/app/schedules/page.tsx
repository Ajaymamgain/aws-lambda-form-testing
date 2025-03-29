"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, Title, Text, Tab, TabGroup, TabList } from "@tremor/react";
import { 
  PlusIcon, 
  ArrowPathIcon, 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { Schedule } from "@/types/api";
import api from "@/lib/api";

// Mock data for initial display - will be replaced with API calls
const mockSchedules: Partial<Schedule>[] = [
  {
    id: "sched-001",
    name: "Daily Login Test",
    description: "Test the login form every day at 8am",
    testConfig: {
      url: "https://example.com/login",
      formConfig: {
        fields: [
          { name: "email", type: "email", selector: "#email" },
          { name: "password", type: "password", selector: "#password" }
        ],
        submitButtonSelector: "button[type='submit']"
      }
    },
    cronExpression: "0 8 * * *",
    active: true,
    lastRun: "2025-03-28T08:00:00Z",
    nextRun: "2025-03-29T08:00:00Z",
    createdAt: "2025-03-01T10:15:22Z",
    statistics: {
      totalRuns: 28,
      successfulRuns: 26,
      failedRuns: 2
    }
  },
  {
    id: "sched-002",
    name: "Weekly Registration Form",
    description: "Test the registration form every Monday at 9am",
    testConfig: {
      url: "https://example.com/register",
      formConfig: {
        fields: [
          { name: "firstName", type: "text", selector: "#firstName" },
          { name: "lastName", type: "text", selector: "#lastName" },
          { name: "email", type: "email", selector: "#email" },
          { name: "password", type: "password", selector: "#password" }
        ],
        submitButtonSelector: "button.register-btn"
      }
    },
    cronExpression: "0 9 * * 1",
    active: true,
    lastRun: "2025-03-25T09:00:00Z",
    nextRun: "2025-04-01T09:00:00Z",
    createdAt: "2025-03-04T14:30:45Z",
    statistics: {
      totalRuns: 4,
      successfulRuns: 3,
      failedRuns: 1
    }
  },
  {
    id: "sched-003",
    name: "Monthly Newsletter Signup",
    description: "Test the newsletter signup form on the 1st of each month",
    testConfig: {
      url: "https://example.com/newsletter",
      formConfig: {
        fields: [
          { name: "email", type: "email", selector: "input[name='email']" }
        ],
        submitButtonSelector: "button.submit-newsletter"
      }
    },
    cronExpression: "0 10 1 * *",
    active: false,
    lastRun: "2025-03-01T10:00:00Z",
    nextRun: "2025-04-01T10:00:00Z",
    createdAt: "2025-02-15T11:10:30Z",
    statistics: {
      totalRuns: 2,
      successfulRuns: 2,
      failedRuns: 0
    }
  }
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Partial<Schedule>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [nextToken, setNextToken] = useState<string | null>(null);
  
  // Load schedules
  const loadSchedules = async (resetPagination = true) => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the API
      // const response = await api.schedules.getAll({
      //   active: statusFilter !== "all" ? statusFilter === "active" : undefined,
      //   startKey: resetPagination ? undefined : nextToken,
      // });
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock schedules based on status filter
      let filteredSchedules = mockSchedules;
      
      if (statusFilter === "active") {
        filteredSchedules = mockSchedules.filter(schedule => schedule.active === true);
      } else if (statusFilter === "inactive") {
        filteredSchedules = mockSchedules.filter(schedule => schedule.active === false);
      }
      
      // Update state with filtered schedules
      if (resetPagination) {
        setSchedules(filteredSchedules);
      } else {
        setSchedules(prev => [...prev, ...filteredSchedules]);
      }
      
      // Set nextToken for pagination (mock)
      setNextToken(filteredSchedules.length > 10 ? "mock-next-token" : null);
      
    } catch (error) {
      console.error("Error loading schedules:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load schedules on initial render and filter changes
  useEffect(() => {
    loadSchedules(true);
  }, [statusFilter]);
  
  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Helper function to format cron expression in human-readable form
  const formatCronExpression = (cronExp?: string) => {
    if (!cronExp) return "N/A";
    
    // Basic parsing of common cron patterns
    // This could be expanded with a proper cron parser library
    const parts = cronExp.split(' ');
    if (parts.length !== 5) return cronExp;
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    if (minute === '0' && hour === '8' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 'Daily at 8:00 AM';
    } else if (minute === '0' && hour === '9' && dayOfMonth === '*' && month === '*' && dayOfWeek === '1') {
      return 'Every Monday at 9:00 AM';
    } else if (minute === '0' && hour === '10' && dayOfMonth === '1' && month === '*' && dayOfWeek === '*') {
      return 'Monthly on the 1st at 10:00 AM';
    }
    
    return cronExp; // Return original if no pattern matched
  };
  
  // Toggle schedule active status
  const toggleScheduleStatus = async (id: string, currentStatus: boolean) => {
    try {
      // In a real implementation, this would call the API
      // await api.schedules.setActive(id, !currentStatus);
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update local state
      setSchedules(prevSchedules => 
        prevSchedules.map(schedule => 
          schedule.id === id 
            ? { ...schedule, active: !currentStatus }
            : schedule
        )
      );
    } catch (error) {
      console.error("Error toggling schedule status:", error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Scheduled Tests</h1>
        
        <Link href="/schedules/new" className="btn btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Schedule
        </Link>
      </div>
      
      {/* Filter bar */}
      <Card>
        <div className="flex items-center justify-between">
          <Title>Status Filter</Title>
          <button
            onClick={() => setStatusFilter("all")}
            className={`text-xs text-primary-600 hover:text-primary-800 ${statusFilter === "all" ? "hidden" : ""}`}
          >
            Clear
          </button>
        </div>
        <TabGroup value={statusFilter} onValueChange={setStatusFilter}>
          <TabList variant="solid" className="mt-2">
            <Tab value="all">All</Tab>
            <Tab value="active">Active</Tab>
            <Tab value="inactive">Inactive</Tab>
          </TabList>
        </TabGroup>
      </Card>
      
      {/* Schedules list */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title>Scheduled Tests</Title>
          <button
            onClick={() => loadSchedules(true)}
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        
        {isLoading && schedules.length === 0 ? (
          <div className="py-12 flex items-center justify-center">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-neutral-500">No scheduled tests found.</p>
            <Link href="/schedules/new" className="btn btn-primary btn-sm mt-4">
              Create Your First Schedule
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 text-neutral-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                    <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Schedule</th>
                    <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Next Run</th>
                    <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Success Rate</th>
                    <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-neutral-50 transition-colors duration-150">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-neutral-900">{schedule.name}</div>
                        <div className="text-xs text-neutral-500 truncate max-w-xs">{schedule.testConfig?.url}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-neutral-500 mr-2" />
                          <span className="text-sm">{formatCronExpression(schedule.cronExpression)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span 
                            className={`status-badge ${
                              schedule.active
                                ? "status-success"
                                : "status-inactive"
                            }`}
                          >
                            {schedule.active ? "Active" : "Inactive"}
                          </span>
                          <button
                            onClick={() => toggleScheduleStatus(schedule.id!, schedule.active!)}
                            className="ml-2 text-xs text-primary-600 hover:text-primary-800"
                          >
                            {schedule.active ? "Pause" : "Activate"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-neutral-500 mr-2" />
                          <span className="text-sm">{formatDate(schedule.nextRun)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {schedule.statistics ? (
                          <div className="flex items-center">
                            {schedule.statistics.totalRuns > 0 ? (
                              <>
                                <div className="mr-2 text-sm font-medium">
                                  {Math.round((schedule.statistics.successfulRuns / schedule.statistics.totalRuns) * 100)}%
                                </div>
                                <div className="text-xs text-neutral-500">
                                  ({schedule.statistics.successfulRuns}/{schedule.statistics.totalRuns})
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-neutral-500">No runs yet</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-500">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-3">
                          <Link
                            href={`/schedules/${schedule.id}`}
                            className="text-primary-600 hover:text-primary-800 font-medium flex items-center"
                          >
                            View
                            <ChevronRightIcon className="h-4 w-4 ml-1" />
                          </Link>
                          <Link
                            href={`/test-results?scheduleId=${schedule.id}`}
                            className="text-primary-600 hover:text-primary-800 flex items-center"
                          >
                            History
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {nextToken && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => loadSchedules(false)}
                  className="btn btn-secondary btn-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
