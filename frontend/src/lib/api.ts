interface ApiResponse {
  data?: any;
  error?: string;
}

class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function handleResponse(response: Response): Promise&lt;any&gt; {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson && data.error ? data.error : 'An error occurred';
    throw new ApiError(message, response.status);
  }

  return data;
}

export async function fetchAnalytics(timeRange: string): Promise&lt;any&gt; {
  const response = await fetch(`${API_BASE_URL}/analytics?timeRange=${timeRange}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  return handleResponse(response);
}

export async function runTest(url: string, config: any): Promise&lt;any&gt; {
  const response = await fetch(`${API_BASE_URL}/tests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ url, config }),
  });
  return handleResponse(response);
}

export async function createSchedule(schedule: any): Promise&lt;any&gt; {
  const response = await fetch(`${API_BASE_URL}/schedules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(schedule),
  });
  return handleResponse(response);
}

export async function fetchTestResult(testId: string): Promise&lt;any&gt; {
  const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
    headers: {
      'Accept': 'application/json',
    },
  });
  return handleResponse(response);
}

export async function updateSchedule(scheduleId: string, updates: any): Promise&lt;any&gt; {
  const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
}

export async function deleteSchedule(scheduleId: string): Promise&lt;void&gt; {
  const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

// Add retry logic for API calls
export async function withRetry&lt;T&gt;(
  fn: () => Promise&lt;T&gt;,
  retries = 3,
  delay = 1000
): Promise&lt;T&gt; {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}