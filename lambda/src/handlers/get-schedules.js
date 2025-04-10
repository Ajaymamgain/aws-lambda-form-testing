const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const { active, limit = 50, startKey } = queryParams;
    
    // Build filter expression if 'active' is provided
    let filterExpression = '#type = :type';
    const expressionAttributeNames = {
      '#type': 'type'
    };
    const expressionAttributeValues = {
      ':type': 'schedule'
    };
    
    if (active !== undefined) {
      const activeValue = active === 'true' || active === true;
      filterExpression += ' AND active = :active';
      expressionAttributeValues[':active'] = activeValue;
    }
    
    // Configure scan parameters
    const scanParams = {
      TableName: process.env.DYNAMODB_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: parseInt(limit, 10)
    };
    
    // Add LastEvaluatedKey for pagination if provided
    if (startKey) {
      scanParams.ExclusiveStartKey = { id: startKey };
    }
    
    // Perform the scan
    const result = await dynamoDb.scan(scanParams).promise();
    
    // Return the results with pagination token if needed
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        items: result.Items || [],
        count: result.Count,
        nextToken: result.LastEvaluatedKey ? result.LastEvaluatedKey.id : null
      })
    };
    
  } catch (error) {
    console.error('Error retrieving schedules:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Failed to retrieve schedules',
        message: error.message
      })
    };
  }
};
