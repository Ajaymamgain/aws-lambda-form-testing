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
    const { status, lastKey } = event.queryStringParameters || {};
    
    let params = {
      TableName: SCHEDULES_TABLE,
      IndexName: 'NextRunTimeIndex',
      Limit: 10,
    };

    // Add pagination if lastKey is provided
    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    // Add status filter if provided
    if (status) {
      params = {
        ...params,
        FilterExpression: 'active = :active',
        ExpressionAttributeValues: {
          ':active': status === 'active',
        },
      };
    }

    const result = await dynamoDB.scan(params).promise();

    // Format the response
    const response = {
      schedules: result.Items,
      total: result.Count,
    };

    // Add pagination token if there are more items
    if (result.LastEvaluatedKey) {
      response.nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Failed to list schedules:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to list schedules',
        message: error.message,
      }),
    };
  }
};