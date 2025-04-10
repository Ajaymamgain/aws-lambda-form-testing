const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    // Get the schedule ID from the path parameter
    const scheduleId = event.pathParameters?.id;
    
    if (!scheduleId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          error: 'Missing schedule ID'
        })
      };
    }
    
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const { limit = 50, startKey } = queryParams;
    
    // First, check if the schedule exists
    const scheduleParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: scheduleId
      }
    };
    
    const scheduleResult = await dynamoDb.get(scheduleParams).promise();
    
    if (!scheduleResult.Item || scheduleResult.Item.type !== 'schedule') {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          error: 'Schedule not found'
        })
      };
    }
    
    // Get the runs list from the schedule
    const runs = scheduleResult.Item.runs || [];
    
    if (runs.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          items: [],
          count: 0,
          scheduleId
        })
      };
    }
    
    // Create a list of IDs to fetch
    const startIndex = startKey ? runs.indexOf(startKey) + 1 : 0;
    const endIndex = Math.min(startIndex + parseInt(limit, 10), runs.length);
    
    // If startKey is not found or we're at the end, return empty results
    if (startIndex < 0 || startIndex >= runs.length) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          items: [],
          count: 0,
          scheduleId
        })
      };
    }
    
    // Get the chunk of run IDs for this page
    const runIds = runs.slice(startIndex, endIndex);
    
    // Batch get the test results
    const runItems = [];
    
    // DynamoDB batch get has a limit of 100 items, so we need to chunk the requests
    for (let i = 0; i < runIds.length; i += 100) {
      const batchIds = runIds.slice(i, i + 100);
      
      const batchParams = {
        RequestItems: {
          [process.env.DYNAMODB_TABLE]: {
            Keys: batchIds.map(id => ({ id }))
          }
        }
      };
      
      const batchResult = await dynamoDb.batchGet(batchParams).promise();
      
      if (batchResult.Responses && batchResult.Responses[process.env.DYNAMODB_TABLE]) {
        runItems.push(...batchResult.Responses[process.env.DYNAMODB_TABLE]);
      }
    }
    
    // Sort by creation date (newest first)
    runItems.sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Check if there are more results
    const nextKey = endIndex < runs.length ? runs[endIndex - 1] : null;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        items: runItems,
        count: runItems.length,
        scheduleId,
        nextToken: nextKey,
        totalRuns: runs.length
      })
    };
    
  } catch (error) {
    console.error('Error retrieving schedule runs:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Failed to retrieve schedule runs',
        message: error.message
      })
    };
  }
};
