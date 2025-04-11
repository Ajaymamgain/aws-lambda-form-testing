const AWS = require('aws-sdk');
const { runTest } = require('./runTest');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const SCHEDULES_TABLE = process.env.SCHEDULES_TABLE;

exports.handler = async (event) => {
  try {
    // Get current timestamp
    const now = new Date().toISOString();

    // Query for schedules that need to be run
    const params = {
      TableName: SCHEDULES_TABLE,
      IndexName: 'NextRunTimeIndex',
      KeyConditionExpression: 'nextRunTime <= :now',
      FilterExpression: 'active = :active',
      ExpressionAttributeValues: {
        ':now': now,
        ':active': true,
      },
    };

    const result = await dynamoDB.query(params).promise();
    const schedules = result.Items;

    // Process each schedule
    const processPromises = schedules.map(async (schedule) => {
      try {
        // Run the test
        const testEvent = {
          body: JSON.stringify({
            url: schedule.url,
            config: schedule.config,
          }),
        };

        await runTest(testEvent);

        // Calculate next run time based on schedule interval
        const nextRunTime = calculateNextRunTime(schedule);

        // Update schedule with new next run time
        await dynamoDB.update({
          TableName: SCHEDULES_TABLE,
          Key: { scheduleId: schedule.scheduleId },
          UpdateExpression: 'SET nextRunTime = :nextRunTime, lastRunTime = :lastRunTime',
          ExpressionAttributeValues: {
            ':nextRunTime': nextRunTime,
            ':lastRunTime': now,
          },
        }).promise();

        return {
          scheduleId: schedule.scheduleId,
          status: 'success',
          nextRunTime,
        };
      } catch (error) {
        console.error(`Failed to process schedule ${schedule.scheduleId}:`, error);
        return {
          scheduleId: schedule.scheduleId,
          status: 'error',
          error: error.message,
        };
      }
    });

    const results = await Promise.all(processPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({
        processed: results.length,
        results,
      }),
    };
  } catch (error) {
    console.error('Failed to process scheduled tests:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process scheduled tests',
        message: error.message,
      }),
    };
  }
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