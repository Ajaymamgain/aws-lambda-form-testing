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
    
    // Get the schedule from DynamoDB
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: scheduleId
      }
    };
    
    const result = await dynamoDb.get(params).promise();
    
    // Check if schedule exists
    if (!result.Item || result.Item.type !== 'schedule') {
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
    
    // Return the schedule
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(result.Item)
    };
    
  } catch (error) {
    console.error('Error retrieving schedule detail:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Failed to retrieve schedule detail',
        message: error.message
      })
    };
  }
};
