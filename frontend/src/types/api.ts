// Form Field Types
export type FieldType = 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'file' | 'tel';

export interface FormField {
  name: string;
  type: FieldType;
  selector: string;
  required?: boolean;
  defaultValue?: string | boolean;
  options?: string[]; // For select and radio fields
  label?: string; // For UI display
}

// Form Configuration
export interface FormConfig {
  fields: FormField[];
  submitButtonSelector: string;
  successIndicator?: {
    selector: string;
    timeout?: number;
  };
}

// User Data
export interface UserData {
  [key: string]: string | boolean;
}

// Test Result
export interface TestResult {
  id: string;
  name: string;
  description?: string;
  url: string;
  status: 'running' | 'success' | 'failed' | 'completed';
  startTime: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
  errors: string[];
  logs: string[];
  screenshots: {
    [key: string]: string; // Screenshot type -> S3 key
  };
  screenshotUrls?: {
    [key: string]: string; // Screenshot type -> Signed URL
  };
  formConfig: FormConfig;
  userData: UserData;
  metrics?: {
    duration: number;
    fieldsProcessed: number;
    errorsCount: number;
    loadTime?: number;
    submissionTime?: number;
  };
  scheduleId?: string;
  schedule?: ScheduleInfo;
  analytics?: {
    successRate: number;
    formCompletionRate: number;
    errorBreakdown: {
      field: number;
      navigation: number;
      timeout: number;
      validation: number;
      submission: number;
      other: number;
    };
    performanceMetrics: {
      loadTime?: number;
      processingTime?: number;
      submissionTime?: number;
    };
  };
  type: 'test';
}

// Schedule
export interface Schedule {
  id: string;
  name: string;
  description?: string;
  url: string;
  formConfig: FormConfig;
  userData: UserData;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression: string;
  specificTime?: string; // HH:MM format
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunTime?: string;
  nextRunTime?: string;
  runs: string[]; // Array of test IDs
  ruleArn?: string;
  stats?: {
    total: number;
    success: number;
    failed: number;
  };
  lastTestId?: string;
  lastTestStatus?: 'success' | 'failed' | 'completed';
  type: 'schedule';
}

// Simplified schedule info for inclusion in test results
export interface ScheduleInfo {
  id: string;
  name: string;
  frequency: string;
  active: boolean;
  lastRunTime?: string;
  nextRunTime?: string;
}

// API Requests
export interface RunTestRequest {
  url: string;
  formConfig: FormConfig;
  userData: UserData;
  name?: string;
  description?: string;
}

export interface ScheduleTestRequest {
  name: string;
  description?: string;
  url: string;
  formConfig: FormConfig;
  userData: UserData;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  customCronExpression?: string;
  specificTime?: string;
  active?: boolean;
}

// API Responses
export interface TestResultsResponse {
  items: Omit<TestResult, 'logs' | 'formConfig' | 'userData'>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
  };
  nextToken?: string;
}

export interface RunTestResponse {
  message: string;
  testId: string;
  status: string;
  url: string;
  screenshots: {
    [key: string]: string;
  };
  errorCount: number;
}

export interface ScheduleTestResponse {
  message: string;
  scheduleId: string;
  name: string;
  frequency: string;
  cronExpression: string;
  active: boolean;
}
