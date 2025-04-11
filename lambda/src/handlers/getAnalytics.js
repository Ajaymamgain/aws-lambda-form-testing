const AWS = require('aws-sdk');
const moment = require('moment');
const { createResponse, handleError } = require('../utils/response');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TESTS_TABLE = process.env.TESTS_TABLE;
const SCHEDULES_TABLE = process.env.SCHEDULES_TABLE;

async function getTestsByTimeRange(timeRange) {
  const now = moment();
  let startTime;

  switch (timeRange) {
    case '24h':
      startTime = now.clone().subtract(24, 'hours');
      break;
    case '7days':
      startTime = now.clone().subtract(7, 'days');
      break;
    case '30days':
      startTime = now.clone().subtract(30, 'days');
      break;
    case 'all':
      startTime = now.clone().subtract(1, 'year'); // Limit to 1 year for performance
      break;
    default:
      startTime = now.clone().subtract(7, 'days');
  }

  const params = {
    TableName: TESTS_TABLE,
    IndexName: 'CreatedAtIndex',
    KeyConditionExpression: 'createdAt >= :startTime',
    ExpressionAttributeValues: {
      ':startTime': startTime.toISOString(),
    },
  };

  const results = await dynamoDB.query(params).promise();
  return results.Items;
}

async function getActiveSchedules() {
  const params = {
    TableName: SCHEDULES_TABLE,
    FilterExpression: 'active = :active',
    ExpressionAttributeValues: {
      ':active': true,
    },
  };

  const results = await dynamoDB.scan(params).promise();
  return results.Items;
}

function calculateMetrics(tests) {
  const totalTests = tests.length;
  const successfulTests = tests.filter(test => test.status === 'success').length;
  const failedTests = totalTests - successfulTests;

  const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;
  const failureRate = totalTests > 0 ? (failedTests / totalTests) * 100 : 0;

  // Calculate average duration
  const totalDuration = tests.reduce((sum, test) => {
    const duration = test.duration || 0; // Duration in seconds
    return sum + duration;
  }, 0);
  const avgDuration = totalTests > 0 ? totalDuration / totalTests : 0;

  // Group tests by URL to find most tested forms
  const testsByUrl = tests.reduce((acc, test) => {
    acc[test.url] = (acc[test.url] || 0) + 1;
    return acc;
  }, {});

  const mostTestedForms = Object.entries(testsByUrl)
    .map(([url, count]) => ({ name: url, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Get recent failures
  const recentFailures = tests
    .filter(test => test.status === 'failed')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(test => ({
      id: test.testId,
      url: test.url,
      status: test.status,
      createdAt: test.createdAt,
      errorCount: test.results?.errors?.length || 0,
    }));

  // Group tests by day for time series data
  const testsByDay = tests.reduce((acc, test) => {
    const day = moment(test.createdAt).format('YYYY-MM-DD');
    if (!acc[day]) {
      acc[day] = { successful: 0, failed: 0 };
    }
    if (test.status === 'success') {
      acc[day].successful++;
    } else {
      acc[day].failed++;
    }
    return acc;
  }, {});

  const testsOverTime = Object.entries(testsByDay)
    .map(([date, counts]) => ({
      date,
      ...counts,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate error distribution
  const errorDistribution = tests
    .filter(test => test.status === 'failed')
    .reduce((acc, test) => {
      (test.results?.errors || []).forEach(error => {
        const errorType = error.type || 'Other';
        acc[errorType] = (acc[errorType] || 0) + 1;
      });
      return acc;
    }, {});

  const errorDistributionArray = Object.entries(errorDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    totalTests,
    successRate: Number(successRate.toFixed(1)),
    failureRate: Number(failureRate.toFixed(1)),
    avgDuration: Number(avgDuration.toFixed(1)),
    mostTestedForms,
    recentFailures,
    testsOverTime,
    errorDistribution: errorDistributionArray,
  };
}

exports.handler = async (event) => {
  try {
    const timeRange = event.queryStringParameters?.timeRange || '7days';
    
    // Get tests and active schedules in parallel
    const [tests, schedules] = await Promise.all([
      getTestsByTimeRange(timeRange),
      getActiveSchedules(),
    ]);

    const metrics = calculateMetrics(tests);

    // Add schedule information
    const scheduleInfo = {
      activeSchedules: schedules.length,
      totalSchedules: schedules.length, // This could be different if we track inactive schedules
      upcomingScheduledTests: schedules
        .sort((a, b) => new Date(a.nextRunTime) - new Date(b.nextRunTime))
        .slice(0, 3)
        .map(schedule => ({
          id: schedule.scheduleId,
          name: schedule.name,
          url: schedule.url,
          nextRun: schedule.nextRunTime,
        })),
    };

    return createResponse(200, {
      ...metrics,
      ...scheduleInfo,
    });
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return handleError(error);
  }
};