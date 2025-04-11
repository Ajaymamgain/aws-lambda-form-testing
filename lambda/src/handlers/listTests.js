const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TESTS_TABLE = process.env.TESTS_TABLE;

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
    const { timeRange, lastKey } = event.queryStringParameters || {};
    
    let params = {
      TableName: TESTS_TABLE,
      IndexName: 'CreatedAtIndex',
      Limit: 10,
    };

    // Add pagination if lastKey is provided
    if (lastKey) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(lastKey, 'base64').toString());
    }

    // Add time range filter if provided
    if (timeRange) {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case '24h':
          startDate = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7days':
          startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); // Default to 7 days
      }

      params = {
        ...params,
        KeyConditionExpression: 'createdAt >= :startDate',
        ExpressionAttributeValues: {
          ':startDate': startDate.toISOString(),
        },
      };
    }

    const result = await dynamoDB.query(params).promise();

    // Format the response
    const response = {
      tests: result.Items,
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
    console.error('Failed to list tests:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to list tests',
        message: error.message,
      }),
    };
  }
};