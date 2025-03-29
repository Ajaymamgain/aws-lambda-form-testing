"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Title, Text, Tab, TabGroup, TabList } from "@tremor/react";
import { ChevronRightIcon, ArrowPathIcon, FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { TestResult } from "@/types/api";
import api from "@/lib/api";

// Mock data for initial display - will be replaced with real API calls
const mockResults: Partial<TestResult>[] = [
  {
    id: "8f7d6e5c",
    name: "Login Form Test",
    url: "https://example.com/login",
    status: "success", 
    startTime: "2025-03-28T15:30:22Z",
    endTime: "2025-03-28T15:30:28Z",
    metrics: {
      duration: 6200,
      fieldsProcessed: 2,
      errorsCount: 0
    }
  },
  {
    id: "7e6d5c4b",
    name: "Registration Form Test",
    url: "https://example.com/register",
    status: "failed",
    startTime: "2025-03-28T14:45:11Z",
    endTime: "2025-03-28T14:45:18Z",
    metrics: {
      duration: 7300,
      fieldsProcessed: 5,
      errorsCount: 2
    }
  },
  {
    id: "6d5c4b3a",
    name: "Contact Form Test",
    url: "https://example.com/contact",
    status: "success",
    startTime: "2025-03-28T12:22:05Z",
    endTime: "2025-03-28T12:22:10Z",
    metrics: {
      duration: 5100,
      fieldsProcessed: 4,
      errorsCount: 0
    }
  },
  {
    id: "5c4b3a29",
    name: "Password Reset Form",
    url: "https://example.com/forgot-password",
    status: "failed",
    startTime: "2025-03-27T18:12:33Z",
    endTime: "2025-03-27T18:12:40Z",
    metrics: {
      duration: 7000,
      fieldsProcessed: 2,
      errorsCount: 1
    }
  },
  {
    id: "4b3a2918",
    name: "Newsletter Signup",
    url: "https://example.com/newsletter",
    status: "success",
    startTime: "2025-03-27T16:05:22Z",
    endTime: "2025-03-27T16:05:27Z",
    metrics: {
      duration: 5300,
      fieldsProcessed: 1,
      errorsCount: 0
    }
  }
];

export default function TestResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Partial<TestResult>[]>(mockResults);
  const [summary, setSummary] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    avgDuration: 0
  });
  const [nextToken, setNextToken] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("search") || "");
  const [timeRange, setTimeRange] = useState<string>(searchParams.get("timeRange") || "7days");
  
  // Load test results
  const loadResults = async (resetPagination = true) => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the API
      // const response = await api.tests.getAll({
      //   status: statusFilter !== "all" ? statusFilter : undefined,
      //   startDate: calculateStartDate(timeRange),
      //   url: searchQuery ? searchQuery : undefined,
      //   startKey: resetPagination ? undefined : nextToken,
      // });
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock results based on status filter
      let filteredResults = mockResults;
      
      if (statusFilter !== "all") {
        filteredResults = mockResults.filter(result => result.status === statusFilter);
      }
      
      // Filter by search query if provided
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredResults = filteredResults.filter(result => 
          result.name?.toLowerCase().includes(query) || 
          result.url?.toLowerCase().includes(query) ||
          result.id?.toLowerCase().includes(query)
        );
      }
      
      // Update state with filtered results
      if (resetPagination) {
        setResults(filteredResults);
      } else {
        setResults(prev => [...prev, ...filteredResults]);
      }
      
      // Update summary data
      setSummary({
        total: filteredResults.length,
        successful: filteredResults.filter(r => r.status === "success").length,
        failed: filteredResults.filter(r => r.status === "failed").length,
        avgDuration: filteredResults.reduce((acc, curr) => acc + (curr.metrics?.duration || 0), 0) / filteredResults.length
      });
      
      // Set nextToken for pagination (mock)
      setNextToken(filteredResults.length > 5 ? "mock-next-token" : null);
      
    } catch (error) {
      console.error("Error loading test results:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load results on initial render and filter changes
  useEffect(() => {
    loadResults(true);
    
    // Update URL with filters
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (searchQuery) params.set("search", searchQuery);
    if (timeRange !== "7days") params.set("timeRange", timeRange);
    
    const search = params.toString();
    const url = search ? `?${search}` : "";
    
    router.replace(`/test-results${url}`);
  }, [statusFilter, timeRange]);
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Helper function to format duration
  const formatDuration = (durationMs: number) => {
    const seconds = durationMs / 1000;
    return `${seconds.toFixed(1)}s`;
  };
  
  return (
    <div className="space-y-6">
      {/* Page header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Test Results</h1>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {/* Search box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search by URL or name"
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadResults(true);
                }
              }}
            />
          </div>
          
          {/* Filters button (for mobile) */}
          <button
            className="block sm:hidden btn btn-secondary"
            onClick={() => {/* Show mobile filter panel */}}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>
      
      {/* Filter bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Tab value="success">Success</Tab>
              <Tab value="failed">Failed</Tab>
              <Tab value="running">Running</Tab>
            </TabList>
          </TabGroup>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <Title>Time Range</Title>
            <button
              onClick={() => setTimeRange("7days")}
              className={`text-xs text-primary-600 hover:text-primary-800 ${timeRange === "7days" ? "hidden" : ""}`}
            >
              Reset
            </button>
          </div>
          <TabGroup value={timeRange} onValueChange={setTimeRange}>
            <TabList variant="solid" className="mt-2">
              <Tab value="24h">24h</Tab>
              <Tab value="7days">7 days</Tab>
              <Tab value="30days">30 days</Tab>
              <Tab value="all">All time</Tab>
            </TabList>
          </TabGroup>
        </Card>
      </div>
      
      {/* Summary statistics */}
      <Card>
        <Title className="mb-2">Summary</Title>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Text>Total Tests</Text>
            <p className="text-2xl font-semibold">{summary.total}</p>
          </div>
          <div>
            <Text>Success Rate</Text>
            <p className="text-2xl font-semibold text-success-600">
              {summary.total > 0 ? Math.round((summary.successful / summary.total) * 100) : 0}%
            </p>
          </div>
          <div>
            <Text>Failed Tests</Text>
            <p className="text-2xl font-semibold text-danger-600">{summary.failed}</p>
          </div>
          <div>
            <Text>Avg. Duration</Text>
            <p className="text-2xl font-semibold">
              {summary.avgDuration ? formatDuration(summary.avgDuration) : "-"}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Results table */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title>Test Results</Title>
          <button
            onClick={() => loadResults(true)}
            className="btn btn-secondary btn-sm"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        
        {isLoading && results.length === 0 ? (
          <div className="py-12 flex items-center justify-center">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : results.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-neutral-500">No test results found.</p>
            <Link href="/run-test" className="btn btn-primary btn-sm mt-4">
              Run a New Test
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 text-neutral-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                    <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Name/URL</th>
                    <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Run Time</th>
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
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-neutral-900">{result.name}</div>
                        <div className="text-xs text-neutral-500 truncate max-w-xs">{result.url}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className={`status-badge ${
                            result.status === "success" 
                              ? "status-success" 
                              : result.status === "failed" 
                              ? "status-failed" 
                              : result.status === "running" 
                              ? "status-running" 
                              : "status-completed"
                          }`}
                        >
                          {result.status?.charAt(0).toUpperCase() + result.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">
                        {result.startTime ? formatDate(result.startTime) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {result.metrics?.duration ? formatDuration(result.metrics.duration) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {result.metrics?.errorsCount || 0}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/test-results/${result.id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium flex items-center"
                        >
                          View
                          <ChevronRightIcon className="h-4 w-4 ml-1" />
                        </Link>
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
                  onClick={() => loadResults(false)}
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
