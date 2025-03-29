"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Card, 
  Metric, 
  Text, 
  Title, 
  AreaChart, 
  DonutChart, 
  BarList, 
  Bold, 
  Flex, 
  Grid, 
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels 
} from "@tremor/react";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ArrowPathIcon,
  CalendarIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

// Mock data for initial display - will be replaced with real API calls
const mockAnalytics = {
  totalTests: 286,
  successRate: 87.2,
  avgDuration: 4.3,
  failureRate: 12.8,
  mostTestedForms: [
    { name: "signup-form.example.com", value: 83 },
    { name: "login.example.com", value: 64 },
    { name: "checkout.shop.com", value: 52 },
    { name: "contact.example.com", value: 31 },
    { name: "feedback.example.org", value: 28 }
  ],
  recentFailures: [
    { id: "test123", url: "checkout.shop.com", status: "failed", createdAt: "2025-03-28T14:32:01Z", errorCount: 3 },
    { id: "test456", url: "login.example.com", status: "failed", createdAt: "2025-03-28T10:15:42Z", errorCount: 1 },
    { id: "test789", url: "signup-form.example.com", status: "failed", createdAt: "2025-03-27T22:44:19Z", errorCount: 2 }
  ],
  testsByDay: [
    { date: "2025-03-22", total: 35, successful: 31, failed: 4 },
    { date: "2025-03-23", total: 38, successful: 35, failed: 3 },
    { date: "2025-03-24", total: 42, successful: 36, failed: 6 },
    { date: "2025-03-25", total: 45, successful: 39, failed: 6 },
    { date: "2025-03-26", total: 39, successful: 33, failed: 6 },
    { date: "2025-03-27", total: 41, successful: 35, failed: 6 },
    { date: "2025-03-28", total: 46, successful: 40, failed: 6 }
  ],
  errorBreakdown: {
    field: 24,
    navigation: 8,
    timeout: 17,
    validation: 31,
    submission: 12,
    other: 8
  },
  activeSchedules: 4,
  totalSchedules: 5,
  upcomingScheduledTests: [
    { id: "sched-001", name: "Daily Login Test", url: "https://example.com/login", nextRun: "2025-03-29T08:00:00Z" },
    { id: "sched-002", name: "Weekly Registration Form", url: "https://example.com/register", nextRun: "2025-04-01T09:00:00Z" },
    { id: "sched-003", name: "Monthly Newsletter Signup", url: "https://example.com/newsletter", nextRun: "2025-04-01T10:00:00Z" }
  ]
};

// Format the error breakdown for the donut chart
const errorBreakdownData = [
  { name: "Field Errors", value: mockAnalytics.errorBreakdown.field },
  { name: "Navigation Errors", value: mockAnalytics.errorBreakdown.navigation },
  { name: "Timeout Errors", value: mockAnalytics.errorBreakdown.timeout },
  { name: "Validation Errors", value: mockAnalytics.errorBreakdown.validation },
  { name: "Submission Errors", value: mockAnalytics.errorBreakdown.submission },
  { name: "Other Errors", value: mockAnalytics.errorBreakdown.other },
];

// Color mapping for status badges
const statusColors = {
  success: "emerald",
  failed: "rose",
  running: "blue",
  completed: "amber",
};

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("7days");
  const [isLoading, setIsLoading] = useState(false);
  
  // This would be replaced with a real API call in production
  useEffect(() => {
    // Simulating loading state for demo purposes
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
    
    // In a real implementation, we would fetch the data here
    // api.analytics.getOverview({ timeRange }).then(data => { ... })
  }, [timeRange]);

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Page header with time range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <TabGroup>
            <TabList variant="solid" defaultValue="7days" onValueChange={setTimeRange}>
              <Tab value="24h">24h</Tab>
              <Tab value="7days">7 days</Tab>
              <Tab value="30days">30 days</Tab>
              <Tab value="all">All time</Tab>
            </TabList>
          </TabGroup>
        </div>
      </div>
      
      {/* KPI cards */}
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="emerald">
          <Flex alignItems="start">
            <div>
              <Text>Success Rate</Text>
              <Metric>{mockAnalytics.successRate}%</Metric>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
          </Flex>
        </Card>
        <Card decoration="top" decorationColor="rose">
          <Flex alignItems="start">
            <div>
              <Text>Failure Rate</Text>
              <Metric>{mockAnalytics.failureRate}%</Metric>
            </div>
            <XCircleIcon className="h-8 w-8 text-rose-500" />
          </Flex>
        </Card>
        <Card decoration="top" decorationColor="blue">
          <Flex alignItems="start">
            <div>
              <Text>Total Tests</Text>
              <Metric>{mockAnalytics.totalTests}</Metric>
            </div>
            <ArrowPathIcon className="h-8 w-8 text-blue-500" />
          </Flex>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Flex alignItems="start">
            <div>
              <Text>Avg. Duration (s)</Text>
              <Metric>{mockAnalytics.avgDuration}</Metric>
            </div>
            <ClockIcon className="h-8 w-8 text-amber-500" />
          </Flex>
        </Card>
      </Grid>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <Title>Quick Actions</Title>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/run-test" 
              className="flex items-center p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors duration-150"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <ArrowPathIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Run Test</h3>
                <p className="text-xs text-neutral-500">Test a form now</p>
              </div>
            </Link>
            
            <Link 
              href="/schedules/new" 
              className="flex items-center p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors duration-150"
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <PlusIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-900">New Schedule</h3>
                <p className="text-xs text-neutral-500">Create a recurring test</p>
              </div>
            </Link>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between mb-4">
            <Title>Active Schedules</Title>
            <Link href="/schedules" className="text-primary-600 hover:text-primary-800 text-sm">
              View all
            </Link>
          </div>
          <div className="flex items-center mb-4">
            <CalendarIcon className="h-8 w-8 text-primary-500 mr-3" />
            <div>
              <div className="text-2xl font-semibold">{mockAnalytics.activeSchedules}</div>
              <div className="text-xs text-neutral-500">{mockAnalytics.activeSchedules} of {mockAnalytics.totalSchedules} schedules active</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {mockAnalytics.upcomingScheduledTests.map((schedule) => (
              <Link 
                key={schedule.id} 
                href={`/schedules/${schedule.id}`}
                className="block p-3 hover:bg-neutral-50 rounded-md border border-neutral-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold">{schedule.name}</div>
                    <div className="text-xs text-neutral-500">{schedule.url}</div>
                  </div>
                  <div className="text-xs text-neutral-500">
                    Next run: {formatDate(schedule.nextRun)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test results over time */}
        <Card>
          <Title>Test Results Over Time</Title>
          <AreaChart
            className="h-72 mt-4"
            data={mockAnalytics.testsByDay}
            index="date"
            categories={["successful", "failed"]}
            colors={["emerald", "rose"]}
            showLegend={true}
            valueFormatter={(value) => `${value} tests`}
          />
        </Card>

        {/* Error distribution */}
        <Card>
          <Title>Error Distribution</Title>
          <DonutChart
            className="h-72 mt-4"
            data={errorBreakdownData}
            category="value"
            index="name"
            colors={["blue", "cyan", "indigo", "violet", "fuchsia", "rose"]}
            valueFormatter={(value) => `${value} errors`}
          />
        </Card>
      </div>

      {/* Most tested URLs and recent failures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Title>Most Tested Forms</Title>
          <BarList
            data={mockAnalytics.mostTestedForms}
            className="mt-4"
            valueFormatter={(value) => `${value} tests`}
          />
        </Card>

        <Card>
          <Title>Recent Test Failures</Title>
          <div className="mt-4 space-y-2">
            {mockAnalytics.recentFailures.map((failure) => (
              <Link 
                key={failure.id} 
                href={`/test-results/${failure.id}`}
                className="block p-3 hover:bg-neutral-50 rounded-md border border-neutral-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold">{failure.url}</span>
                      <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                        Failed
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {new Date(failure.createdAt).toLocaleString()} • {failure.errorCount} errors
                    </div>
                  </div>
                  <div className="text-neutral-400">
                    <span className="text-xs">ID: {failure.id.substring(0, 8)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
