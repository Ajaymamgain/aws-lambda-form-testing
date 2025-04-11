"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Card, 
  Metric, 
  Text, 
  Title, 
  Flex, 
  Grid, 
  BarList,
  LineChart,
  DonutChart,
  Legend
} from "@tremor/react";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ArrowPathIcon,
  CalendarIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { toast } from 'react-hot-toast';
import { fetchAnalytics } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("7days");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchAnalytics(timeRange);
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch (err) {
      console.error('Date formatting error:', err);
      return dateString;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to load dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Page header with time range selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics Dashboard</h1>
          <div className="flex space-x-2">
            <div className="bg-gray-100 p-1 rounded-md flex">
              {['24h', '7days', '30days', 'all'].map((range) => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* KPI cards */}
        <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
          <Card decoration="top" decorationColor="emerald">
            <Flex alignItems="start">
              <div>
                <Text>Success Rate</Text>
                <Metric>{analytics.successRate}%</Metric>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
            </Flex>
          </Card>
          
          {/* ... Rest of the cards and components ... */}
          
        </Grid>

        {/* Charts section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <Title>Test Results Over Time</Title>
            <LineChart
              className="h-72 mt-4"
              data={analytics.testsOverTime}
              index="date"
              categories={["successful", "failed"]}
              colors={["emerald", "rose"]}
              valueFormatter={(value) => `${value} tests`}
              yAxisWidth={40}
              showAnimation={true}
            />
          </Card>

          <Card>
            <Title>Error Distribution</Title>
            <DonutChart
              className="h-72 mt-4"
              data={analytics.errorDistribution}
              category="value"
              index="name"
              valueFormatter={(value) => `${value} errors`}
              colors={["rose", "amber", "blue", "indigo", "slate"]}
              showAnimation={true}
            />
          </Card>
        </div>

        {/* Recent activities and schedules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <Title>Recent Test Failures</Title>
            <div className="mt-4 space-y-2">
              {analytics.recentFailures.map((failure) => (
                <Link 
                  key={failure.id} 
                  href={`/test-results/${failure.id}`}
                  className="block p-3 hover:bg-neutral-50 rounded-md border border-neutral-200 transition-colors"
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
                        {formatDate(failure.createdAt)} • {failure.errorCount} errors
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <Title>Upcoming Scheduled Tests</Title>
            <div className="mt-4 space-y-2">
              {analytics.upcomingScheduledTests.map((schedule) => (
                <Link 
                  key={schedule.id} 
                  href={`/schedules/${schedule.id}`}
                  className="block p-3 hover:bg-neutral-50 rounded-md border border-neutral-200 transition-colors"
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
      </div>
    </ErrorBoundary>
  );
}