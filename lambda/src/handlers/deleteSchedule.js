const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const SCHEDULES_TABLE = process.env.SCHEDULES_TABLE;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
};

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

    await dynamoDB.delete({
      TableName: SCHEDULES_TABLE,
      Key: { scheduleId },
    }).promise();

    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to delete schedule',
        message: error.message,
      }),
    };
  }
};