"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, Title, Text, Tab, TabGroup, TabList, TabPanel, TabPanels, Subtitle, ProgressBar } from "@tremor/react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PhotoIcon,
  InformationCircleIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { TestResult } from "@/types/api";
import api from "@/lib/api";

// Mock data for initial display - will be replaced with API calls
const mockTestResult: Partial<TestResult> = {
  id: "8f7d6e5c",
  name: "Login Form Test",
  description: "Testing the login form functionality",
  url: "https://example.com/login",
  status: "success",
  startTime: "2025-03-28T15:30:22Z",
  endTime: "2025-03-28T15:30:28Z",
  errors: [],
  logs: [
    "Test started",
    "Navigating to https://example.com/login",
    "Took initial screenshot",
    "Processing field: email",
    "Filled email field: email with value: test@example.com",
    "Processing field: password",
    "Filled password field: password with value: ********",
    "Took pre-submission screenshot",
    "Submitting form",
    "Form submitted successfully",
    "Took final screenshot"
  ],
  screenshots: {
    initial: "test-screenshots/8f7d6e5c/initial.png",
    preSubmit: "test-screenshots/8f7d6e5c/pre-submit.png",
    final: "test-screenshots/8f7d6e5c/final.png"
  },
  screenshotUrls: {
    initial: "https://via.placeholder.com/800x600?text=Initial+Screenshot",
    preSubmit: "https://via.placeholder.com/800x600?text=Pre+Submit+Screenshot",
    final: "https://via.placeholder.com/800x600?text=Final+Screenshot"
  },
  metrics: {
    duration: 6200,
    fieldsProcessed: 2,
    errorsCount: 0
  },
  analytics: {
    successRate: 100,
    formCompletionRate: 100,
    errorBreakdown: {
      field: 0,
      navigation: 0,
      timeout: 0,
      validation: 0,
      submission: 0,
      other: 0
    },
    performanceMetrics: {
      loadTime: 1200,
      processingTime: 6200,
      submissionTime: 800
    }
  },
  formConfig: {
    fields: [
      {
        name: "email",
        type: "email",
        selector: "#email",
        required: true
      },
      {
        name: "password",
        type: "password",
        selector: "#password",
        required: true
      }
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
};

export default function TestResultDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [testResult, setTestResult] = useState<Partial<TestResult> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    const fetchTestResult = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, this would call the API
        // const result = await api.tests.getById(params.id);
        
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 800));
        setTestResult(mockTestResult);
      } catch (error) {
        console.error("Error fetching test result:", error);
        // Handle error state
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTestResult();
  }, [params.id]);
  
  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Helper function to format duration
  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return "N/A";
    const seconds = durationMs / 1000;
    return `${seconds.toFixed(1)} seconds`;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }
  
  if (!testResult) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl font-bold text-neutral-300 mb-4">404</div>
        <h2 className="text-xl font-semibold mb-2">Test Result Not Found</h2>
        <p className="text-neutral-500 mb-6">
          The test result you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/test-results" className="btn btn-primary">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Test Results
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
            href="/test-results"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Test Results
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{testResult.name}</h1>
          {testResult.description && (
            <p className="mt-1 text-neutral-500">{testResult.description}</p>
          )}
        </div>
        
        <div className="flex flex-col sm:items-end">
          <div className="flex items-center">
            <span className="text-sm text-neutral-500 mr-2">Status:</span>
            <span
              className={`status-badge ${
                testResult.status === "success"
                  ? "status-success"
                  : testResult.status === "failed"
                  ? "status-failed"
                  : testResult.status === "running"
                  ? "status-running"
                  : "status-completed"
              }`}
            >
              {testResult.status?.charAt(0).toUpperCase() + testResult.status?.slice(1)}
            </span>
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            ID: <span className="font-mono">{testResult.id}</span>
          </div>
        </div>
      </div>
      
      {/* Summary card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <Text>URL</Text>
              <div className="flex items-center mt-1">
                <p className="font-medium truncate">{testResult.url}</p>
                <a
                  href={testResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 ml-1"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
            
            <div>
              <Text>Run Time</Text>
              <p className="mt-1 font-medium">{formatDate(testResult.startTime)}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Text>Duration</Text>
              <p className="mt-1 font-medium">{formatDuration(testResult.metrics?.duration)}</p>
            </div>
            
            <div>
              <Text>Fields Processed</Text>
              <p className="mt-1 font-medium">{testResult.metrics?.fieldsProcessed || 0} fields</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Text>Form Completion Rate</Text>
              <div className="mt-2">
                <ProgressBar
                  value={testResult.analytics?.formCompletionRate || 0}
                  color={testResult.analytics?.formCompletionRate === 100 ? "emerald" : "amber"}
                  className="mt-1"
                />
                <p className="text-right text-sm mt-1">{testResult.analytics?.formCompletionRate || 0}%</p>
              </div>
            </div>
            
            <div>
              <Text>Errors</Text>
              <p className="mt-1 font-medium flex items-center">
                {testResult.metrics?.errorsCount || 0}
                {testResult.metrics?.errorsCount === 0 ? (
                  <CheckCircleIcon className="h-5 w-5 ml-1 text-success-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 ml-1 text-danger-500" />
                )}
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Tabs */}
      <TabGroup value={activeTab} onValueChange={setActiveTab}>
        <TabList>
          <Tab value="overview" icon={InformationCircleIcon}>Overview</Tab>
          <Tab value="screenshots" icon={PhotoIcon}>Screenshots</Tab>
          <Tab value="logs" icon={DocumentTextIcon}>Logs</Tab>
          <Tab value="configuration" icon={CodeBracketIcon}>Configuration</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Performance metrics */}
              <Card>
                <Title>Performance Metrics</Title>
                <div className="space-y-4 mt-4">
                  <div>
                    <Text>Page Load Time</Text>
                    <div className="flex items-center mt-1">
                      <ClockIcon className="h-5 w-5 text-neutral-500 mr-2" />
                      <span>{formatDuration(testResult.analytics?.performanceMetrics?.loadTime)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Text>Processing Time</Text>
                    <div className="flex items-center mt-1">
                      <ClockIcon className="h-5 w-5 text-neutral-500 mr-2" />
                      <span>{formatDuration(testResult.analytics?.performanceMetrics?.processingTime)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Text>Form Submission Time</Text>
                    <div className="flex items-center mt-1">
                      <ClockIcon className="h-5 w-5 text-neutral-500 mr-2" />
                      <span>{formatDuration(testResult.analytics?.performanceMetrics?.submissionTime)}</span>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Error breakdown */}
              <Card>
                <Title>Error Analysis</Title>
                {testResult.errors && testResult.errors.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {testResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="p-3 bg-danger-50 border border-danger-200 rounded-md text-sm text-danger-700"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-success-600">
                    <CheckCircleIcon className="h-8 w-8 mr-2" />
                    <span className="text-lg font-medium">No errors detected</span>
                  </div>
                )}
              </Card>
              
              {/* Form fields summary */}
              <Card className="lg:col-span-2">
                <Title>Form Fields</Title>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Field Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Selector</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Required</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Value Used</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {testResult.formConfig?.fields.map((field, index) => (
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
                              : testResult.userData?.[field.name]?.toString() || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabPanel>
          
          <TabPanel value="screenshots">
            <div className="space-y-6 mt-6">
              {testResult.screenshotUrls ? (
                <>
                  {/* Initial screenshot */}
                  {testResult.screenshotUrls.initial && (
                    <Card>
                      <Title>Initial State</Title>
                      <Text className="mt-1">Screenshot of the form before any interaction</Text>
                      <div className="mt-4 flex justify-center border border-neutral-200 rounded-md overflow-hidden">
                        <img
                          src={testResult.screenshotUrls.initial}
                          alt="Initial Form State"
                          className="max-w-full h-auto"
                        />
                      </div>
                    </Card>
                  )}
                  
                  {/* Pre-submit screenshot */}
                  {testResult.screenshotUrls.preSubmit && (
                    <Card>
                      <Title>Pre-Submission State</Title>
                      <Text className="mt-1">Screenshot of the form after filling but before submission</Text>
                      <div className="mt-4 flex justify-center border border-neutral-200 rounded-md overflow-hidden">
                        <img
                          src={testResult.screenshotUrls.preSubmit}
                          alt="Pre-Submission Form State"
                          className="max-w-full h-auto"
                        />
                      </div>
                    </Card>
                  )}
                  
                  {/* Final screenshot */}
                  {testResult.screenshotUrls.final && (
                    <Card>
                      <Title>Final State</Title>
                      <Text className="mt-1">Screenshot of the page after form submission</Text>
                      <div className="mt-4 flex justify-center border border-neutral-200 rounded-md overflow-hidden">
                        <img
                          src={testResult.screenshotUrls.final}
                          alt="Final Page State"
                          className="max-w-full h-auto"
                        />
                      </div>
                    </Card>
                  )}
                  
                  {/* Error screenshots if any */}
                  {Object.entries(testResult.screenshotUrls)
                    .filter(([key]) => key.startsWith("error-"))
                    .map(([key, url]) => (
                      <Card key={key}>
                        <Title>Error State: {key.replace("error-", "")}</Title>
                        <Text className="mt-1">Screenshot taken when an error occurred</Text>
                        <div className="mt-4 flex justify-center border border-neutral-200 rounded-md overflow-hidden">
                          <img
                            src={url}
                            alt={`Error State: ${key}`}
                            className="max-w-full h-auto"
                          />
                        </div>
                      </Card>
                    ))}
                </>
              ) : (
                <Card>
                  <div className="flex flex-col items-center justify-center py-12">
                    <PhotoIcon className="h-12 w-12 text-neutral-300 mb-4" />
                    <Text>No screenshots available for this test.</Text>
                  </div>
                </Card>
              )}
            </div>
          </TabPanel>
          
          <TabPanel value="logs">
            <Card className="mt-6">
              <Title>Test Execution Logs</Title>
              <div className="mt-4 bg-neutral-50 border border-neutral-200 rounded-md p-4 font-mono text-sm overflow-x-auto">
                <div className="space-y-2">
                  {testResult.logs?.map((log, index) => (
                    <div key={index} className="flex">
                      <span className="text-neutral-400 mr-2">[{index + 1}]</span>
                      <span className={`
                        ${log.includes("Error") || log.includes("Failed") ? "text-danger-600" : ""}
                        ${log.includes("success") ? "text-success-600" : ""}
                      `}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabPanel>
          
          <TabPanel value="configuration">
            <div className="space-y-6 mt-6">
              {/* Form configuration */}
              <Card>
                <Title>Form Configuration</Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <Text>Submit Button Selector</Text>
                    <div className="mt-1 font-mono text-sm bg-neutral-50 p-2 rounded-md">
                      {testResult.formConfig?.submitButtonSelector}
                    </div>
                  </div>
                  
                  {testResult.formConfig?.successIndicator && (
                    <div>
                      <Text>Success Indicator</Text>
                      <div className="mt-1 font-mono text-sm bg-neutral-50 p-2 rounded-md">
                        <div>Selector: {testResult.formConfig.successIndicator.selector}</div>
                        {testResult.formConfig.successIndicator.timeout && (
                          <div>Timeout: {testResult.formConfig.successIndicator.timeout}ms</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
              
              {/* User data */}
              <Card>
                <Title>User Data</Title>
                <Text className="mt-1">Data used to fill the form fields</Text>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Field</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {testResult.userData && Object.entries(testResult.userData).map(([field, value], index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {field}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                            {field.toLowerCase().includes("password") ? "********" : value?.toString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              
              {/* JSON representation (for debugging/advanced users) */}
              <Card>
                <div className="flex justify-between items-center">
                  <Title>Raw Configuration</Title>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(testResult.formConfig, null, 2));
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800"
                  >
                    Copy to Clipboard
                  </button>
                </div>
                <div className="mt-4 bg-neutral-50 p-4 rounded-md overflow-x-auto">
                  <pre className="text-xs">{JSON.stringify(testResult.formConfig, null, 2)}</pre>
                </div>
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-4">
        <Link
          href={`/run-test?clone=${params.id}`}
          className="btn btn-secondary btn-md"
        >
          Re-Run This Test
        </Link>
        
        <Link
          href={`/schedules/new?fromTest=${params.id}`}
          className="btn btn-primary btn-md"
        >
          Create Schedule
        </Link>
      </div>
    </div>
  );
}
