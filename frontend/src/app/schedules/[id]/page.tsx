"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Card, 
  Title, 
  Text, 
  Tab, 
  TabGroup, 
  TabList, 
  TabPanel, 
  TabPanels, 
  Subtitle,
  ProgressBar
} from "@tremor/react";
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  ClockIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { Schedule, TestResult } from "@/types/api";
import api from "@/lib/api";

// Mock data for initial display - will be replaced with API calls
const mockSchedule: Partial<Schedule> = {
  id: "sched-001",
  name: "Daily Login Test",
  description: "Test the login form every day at 8am",
  testConfig: {
    url: "https://example.com/login",
    name: "Login Form Test",
    description: "Testing the login form functionality",
    formConfig: {
      fields: [
        { name: "email", type: "email", selector: "#email", required: true },
        { name: "password", type: "password", selector: "#password", required: true }
      ],
      submitButtonSelector: "button[type='submit']",
      successIndicator: {
        selector: ".login-success",
        timeout: 5000
      }
    },
    userData: {
      email: "test@example.com",
      password: "password123"
    }
  },
  cronExpression: "0 8 * * *",
  active: true,
  lastRun: "2025-03-28T08:00:00Z",
  nextRun: "2025-03-29T08:00:00Z",
  createdAt: "2025-03-01T10:15:22Z",
  updatedAt: "2025-03-20T14:22:10Z",
  statistics: {
    totalRuns: 28,
    successfulRuns: 26,
    failedRuns: 2
  }
};

// Mock results for the schedule
const mockResults: Partial<TestResult>[] = [
  {
    id: "result-001",
    name: "Login Form Test",
    url: "https://example.com/login",
    status: "success", 
    startTime: "2025-03-28T08:00:02Z",
    endTime: "2025-03-28T08:00:08Z",
    metrics: {
      duration: 6200,
      fieldsProcessed: 2,
      errorsCount: 0
    }
  },
  {
    id: "result-002",
    name: "Login Form Test",
    url: "https://example.com/login",
    status: "success", 
    startTime: "2025-03-27T08:00:01Z",
    endTime: "2025-03-27T08:00:07Z",
    metrics: {
      duration: 6100,
      fieldsProcessed: 2,
      errorsCount: 0
    }
  },
  {
    id: "result-003",
    name: "Login Form Test",
    url: "https://example.com/login",
    status: "failed", 
    startTime: "2025-03-26T08:00:00Z",
    endTime: "2025-03-26T08:00:12Z",
    metrics: {
      duration: 12000,
      fieldsProcessed: 1,
      errorsCount: 1
    }
  }
];

export default function ScheduleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<Partial<Schedule> | null>(null);
  const [results, setResults] = useState<Partial<TestResult>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, this would call the API
        // const schedule = await api.schedules.getById(params.id);
        // const testResults = await api.schedules.getRuns(params.id);
        
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 800));
        setSchedule(mockSchedule);
        setResults(mockResults);
      } catch (error) {
        console.error("Error fetching schedule:", error);
        // Handle error state
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSchedule();
  }, [params.id]);
  
  // Toggle schedule active status
  const toggleScheduleStatus = async () => {
    if (!schedule) return;
    
    try {
      // In a real implementation, this would call the API
      // await api.schedules.setActive(schedule.id!, !schedule.active);
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update local state
      setSchedule(prev => prev ? { ...prev, active: !prev.active } : null);
    } catch (error) {
      console.error("Error toggling schedule status:", error);
    }
  };
  
  // Run test immediately
  const runTestNow = async () => {
    if (!schedule) return;
    
    setIsRunning(true);
    
    try {
      // In a real implementation, this would call the API
      // const result = await api.tests.run(schedule.testConfig);
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to the test result page
      router.push(`/test-results/result-new`);
    } catch (error) {
      console.error("Error running test:", error);
      setIsRunning(false);
    }
  };
  
  // Delete schedule
  const deleteSchedule = async () => {
    if (!schedule) return;
    
    setIsDeleting(true);
    
    try {
      // In a real implementation, this would call the API
      // await api.schedules.delete(schedule.id!);
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to schedules page
      router.push("/schedules");
    } catch (error) {
      console.error("Error deleting schedule:", error);
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };
  
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }
  
  if (!schedule) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-neutral-300 mb-4">404</div>
        <h2 className="text-xl font-semibold mb-2">Schedule Not Found</h2>
        <p className="text-neutral-500 mb-6">
          The schedule you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/schedules" className="btn btn-primary">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Schedules
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/schedules"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Schedules
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{schedule.name}</h1>
          {schedule.description && (
            <p className="mt-1 text-neutral-500">{schedule.description}</p>
          )}
        </div>
        
        <div className="flex flex-col sm:items-end">
          <div className="flex items-center">
            <span className="text-sm text-neutral-500 mr-2">Status:</span>
            <span
              className={`status-badge ${
                schedule.active
                  ? "status-success"
                  : "status-inactive"
              }`}
            >
              {schedule.active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            ID: <span className="font-mono">{schedule.id}</span>
          </div>
        </div>
      </div>
      
      {/* Summary card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <Text>Target URL</Text>
              <div className="flex items-center mt-1 font-medium">
                <Link href={schedule.testConfig?.url || "#"} target="_blank" className="text-primary-600 hover:underline">
                  {schedule.testConfig?.url}
                </Link>
              </div>
            </div>
            
            <div>
              <Text>Schedule</Text>
              <div className="flex items-center mt-1">
                <CalendarIcon className="h-4 w-4 text-neutral-500 mr-2" />
                <span className="font-medium">{formatCronExpression(schedule.cronExpression)}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">Cron: {schedule.cronExpression}</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Text>Next Run</Text>
              <div className="flex items-center mt-1">
                <ClockIcon className="h-4 w-4 text-neutral-500 mr-2" />
                <span className="font-medium">{formatDate(schedule.nextRun)}</span>
              </div>
            </div>
            
            <div>
              <Text>Last Run</Text>
              <div className="flex items-center mt-1">
                <ClockIcon className="h-4 w-4 text-neutral-500 mr-2" />
                <span className="font-medium">{formatDate(schedule.lastRun)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Text>Success Rate</Text>
              <div className="mt-2">
                <ProgressBar
                  value={schedule.statistics ? (schedule.statistics.successfulRuns / schedule.statistics.totalRuns) * 100 : 0}
                  color="emerald"
                  className="mt-1"
                />
                <div className="flex justify-between text-sm mt-1">
                  <span>{schedule.statistics?.successfulRuns || 0} successful</span>
                  <span>{schedule.statistics?.totalRuns || 0} total runs</span>
                </div>
              </div>
            </div>
            
            <div>
              <Text>Created</Text>
              <p className="mt-1 font-medium">{formatDate(schedule.createdAt)}</p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={toggleScheduleStatus}
          className={`btn ${schedule.active ? 'btn-warning' : 'btn-success'} btn-md`}
        >
          {schedule.active ? (
            <>
              <PauseIcon className="h-5 w-5 mr-2" />
              Pause Schedule
            </>
          ) : (
            <>
              <PlayIcon className="h-5 w-5 mr-2" />
              Activate Schedule
            </>
          )}
        </button>
        
        <button
          onClick={runTestNow}
          className="btn btn-primary btn-md"
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <PlayIcon className="h-5 w-5 mr-2" />
              Run Test Now
            </>
          )}
        </button>
        
        <Link
          href={`/schedules/${schedule.id}/edit`}
          className="btn btn-secondary btn-md"
        >
          <PencilIcon className="h-5 w-5 mr-2" />
          Edit Schedule
        </Link>
        
        <button
          onClick={() => setShowConfirmDelete(true)}
          className="btn btn-danger btn-md"
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          Delete Schedule
        </button>
      </div>
      
      {/* Delete confirmation dialog */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Confirm Delete</h3>
            <p className="text-neutral-500 mb-6">
              Are you sure you want to delete the schedule "{schedule.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={deleteSchedule}
                className="btn btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Schedule"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <TabGroup value={activeTab} onValueChange={setActiveTab}>
        <TabList>
          <Tab value="details" icon={DocumentTextIcon}>Configuration</Tab>
          <Tab value="history" icon={ChartBarIcon}>Test History</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel value="details">
            <div className="mt-6 space-y-6">
              {/* Test configuration */}
              <Card>
                <Title>Test Configuration</Title>
                <div className="mt-4 space-y-6">
                  <div>
                    <Subtitle>Form Fields</Subtitle>
                    <div className="overflow-x-auto mt-2">
                      <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Field Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Selector</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Required</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Test Value</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                          {schedule.testConfig?.formConfig.fields.map((field, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">
                                {field.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                                {field.type}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500 font-mono">
                                {field.selector}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                                {field.required ? "Yes" : "No"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                                {field.type === "password" 
                                  ? "********" 
                                  : schedule.testConfig?.userData?.[field.name]?.toString() || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Subtitle>Submit Button</Subtitle>
                      <div className="mt-1 font-mono text-sm bg-neutral-50 p-2 rounded-md">
                        {schedule.testConfig?.formConfig.submitButtonSelector}
                      </div>
                    </div>
                    
                    {schedule.testConfig?.formConfig.successIndicator && (
                      <div>
                        <Subtitle>Success Indicator</Subtitle>
                        <div className="mt-1 font-mono text-sm bg-neutral-50 p-2 rounded-md">
                          <div>Selector: {schedule.testConfig.formConfig.successIndicator.selector}</div>
                          {schedule.testConfig.formConfig.successIndicator.timeout && (
                            <div>Timeout: {schedule.testConfig.formConfig.successIndicator.timeout}ms</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
              
              {/* Schedule configuration */}
              <Card>
                <Title>Schedule Configuration</Title>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Subtitle>Cron Expression</Subtitle>
                    <div className="mt-1 font-mono text-sm bg-neutral-50 p-2 rounded-md">
                      {schedule.cronExpression}
                    </div>
                    <div className="text-sm mt-2 text-neutral-500">
                      {formatCronExpression(schedule.cronExpression)}
                    </div>
                  </div>
                  
                  <div>
                    <Subtitle>Created & Updated</Subtitle>
                    <div className="space-y-2 mt-1">
                      <div className="flex items-center">
                        <span className="text-sm text-neutral-500 w-24">Created:</span>
                        <span className="text-sm">{formatDate(schedule.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-neutral-500 w-24">Last Updated:</span>
                        <span className="text-sm">{formatDate(schedule.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>
          
          <TabPanel value="history">
            <div className="mt-6">
              <Card>
                <Title>Test Run History</Title>
                <div className="mt-4">
                  {results.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">No test runs found for this schedule.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-neutral-50 text-neutral-700">
                          <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Duration</th>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Errors</th>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {results.map((result) => (
                            <tr key={result.id} className="hover:bg-neutral-50 transition-colors duration-150">
                              <td className="px-4 py-3 text-sm font-mono whitespace-nowrap">
                                {result.id?.substring(0, 8)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm">{formatDate(result.startTime)}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span 
                                  className={`status-badge ${ 
                                    result.status === "success" 
                                      ? "status-success" 
                                      : result.status === "failed" 
                                      ? "status-failed" 
                                      : "status-running" 
                                  }`}
                                >
                                  {result.status?.charAt(0).toUpperCase() + result.status?.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {result.metrics?.duration ? (result.metrics.duration / 1000).toFixed(1) + "s" : "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {result.metrics?.errorsCount || 0}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Link
                                  href={`/test-results/${result.id}`}
                                  className="text-primary-600 hover:text-primary-800 font-medium flex items-center"
                                >
                                  View Details
                                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/test-results?scheduleId=${schedule.id}`}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      View all test runs
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
