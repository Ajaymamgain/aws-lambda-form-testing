const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { createResponse, handleError } = require('../utils/response');

const TESTS_TABLE = process.env.TESTS_TABLE;

exports.handler = async (event) => {
  try {
    const { testId } = event.pathParameters;

    if (!testId) {
      return createResponse(400, { error: 'Test ID is required' });
    }

    const params = {
      TableName: TESTS_TABLE,
      Key: { testId },
    };

    const result = await dynamoDB.get(params).promise();

    if (!result.Item) {
      return createResponse(404, { error: 'Test result not found' });
    }

    return createResponse(200, result.Item);
  } catch (error) {
    console.error('Failed to get test result:', error);
    return handleError(error);
  }
};