const AWS = require('aws-sdk');
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
    const scheduleId = event.pathParameters?.scheduleId;
    const updates = JSON.parse(event.body);

    if (!scheduleId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing scheduleId',
          message: 'Schedule ID is required',
        }),
      };
    }

    // Check if schedule exists
    const existingSchedule = await dynamoDB.get({
      TableName: SCHEDULES_TABLE,
      Key: { scheduleId },
    }).promise();

    if (!existingSchedule.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Not Found',
          message: 'Schedule not found',
        }),
      };
    }

    const updatedSchedule = {
      ...existingSchedule.Item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate next run time if interval changed
    if (updates.interval) {
      updatedSchedule.nextRunTime = calculateNextRunTime(updatedSchedule);
    }

    await dynamoDB.put({
      TableName: SCHEDULES_TABLE,
      Item: updatedSchedule,
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(updatedSchedule),
    };
  } catch (error) {
    console.error('Failed to update schedule:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to update schedule',
        message: error.message,
      }),
    };
  }
};