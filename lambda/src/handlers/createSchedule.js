const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const SCHEDULES_TABLE = process.env.SCHEDULES_TABLE;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
};

function calculateNextRunTime(schedule) {
  const now = new Date();
  let nextRun = new Date(now);

  switch (schedule.interval) {
    case 'hourly':
      nextRun.setHours(nextRun.getHours() + 1);
      break;
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      break;
    case 'weekly':
      nextRun.setDate(nextRun.getDate() + 7);
      break;
    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
    default:
      // For custom intervals in minutes
      const intervalMinutes = parseInt(schedule.interval, 10) || 60;
      nextRun.setMinutes(nextRun.getMinutes() + intervalMinutes);
  }

  return nextRun.toISOString();
}

exports.handler = async (event) => {
  // Handle preflight requests
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const schedule = JSON.parse(event.body);

    // Validate required fields
    if (!schedule.url || !schedule.interval || !schedule.config) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing required fields',
          message: 'URL, interval, and config are required',
        }),
      };
    }

    const scheduleId = uuidv4();
    const timestamp = new Date().toISOString();
    const nextRunTime = calculateNextRunTime(schedule);

    const item = {
      scheduleId,
      url: schedule.url,
      interval: schedule.interval,
      config: schedule.config,
      name: schedule.name || `Schedule for ${schedule.url}`,
      description: schedule.description,
      active: schedule.active !== false, // Default to true if not specified
      createdAt: timestamp,
      updatedAt: timestamp,
      nextRunTime,
      lastRunTime: null,
    };

    await dynamoDB.put({
      TableName: SCHEDULES_TABLE,
      Item: item,
    }).promise();

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error('Failed to create schedule:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to create schedule',
        message: error.message,
      }),
    };
  }
};