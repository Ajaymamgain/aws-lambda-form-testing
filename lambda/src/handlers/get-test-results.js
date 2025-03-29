const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

/**
 * Get test results with filtering and pagination options
 */
exports.handler = async (event) => {
  // Parse query string parameters
  const queryParams = event.queryStringParameters || {};
  const {
    url,
    status,
    startDate,
    endDate,
    limit = '50',
    startKey,
    sortByDate = 'desc'
  } = queryParams;

  // Set up base query parameters
  let params = {
    TableName: process.env.DYNAMODB_TABLE,
    Limit: parseInt(limit, 10),
  };

  // Handle pagination with last evaluated key
  if (startKey) {
    try {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(startKey, 'base64').toString());
    } catch (error) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid pagination token' })
      };
    }
  }

  // If filtering by URL, use the GSI
  if (url) {
    params.IndexName = 'UrlIndex';
    params.KeyConditionExpression = 'url = :url';
    params.ExpressionAttributeValues = {
      ':url': url
    };

    // Add date range if provided
    if (startDate && endDate) {
      params.KeyConditionExpression += ' AND createdAt BETWEEN :startDate AND :endDate';
      params.ExpressionAttributeValues[':startDate'] = startDate;
      params.ExpressionAttributeValues[':endDate'] = endDate;
    } else if (startDate) {
      params.KeyConditionExpression += ' AND createdAt >= :startDate';
      params.ExpressionAttributeValues[':startDate'] = startDate;
    } else if (endDate) {
      params.KeyConditionExpression += ' AND createdAt <= :endDate';
      params.ExpressionAttributeValues[':endDate'] = endDate;
    }

    // Add status filter if provided
    if (status) {
      if (!params.FilterExpression) {
        params.FilterExpression = '';
      }
      params.FilterExpression = 'status = :status';
      params.ExpressionAttributeValues[':status'] = status;
    }

    // Set scan direction based on sort order
    params.ScanIndexForward = sortByDate.toLowerCase() !== 'desc';
  } else {
    // Without URL, we have to use scan with filters
    const filterExpressions = [];
    params.ExpressionAttributeValues = {};

    // Add status filter
    if (status) {
      filterExpressions.push('status = :status');
      params.ExpressionAttributeValues[':status'] = status;
    }

    // Add date filter
    if (startDate && endDate) {
      filterExpressions.push('createdAt BETWEEN :startDate AND :endDate');
      params.ExpressionAttributeValues[':startDate'] = startDate;
      params.ExpressionAttributeValues[':endDate'] = endDate;
    } else if (startDate) {
      filterExpressions.push('createdAt >= :startDate');
      params.ExpressionAttributeValues[':startDate'] = startDate;
    } else if (endDate) {
      filterExpressions.push('createdAt <= :endDate');
      params.ExpressionAttributeValues[':endDate'] = endDate;
    }

    // Combine filter expressions if any
    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
    }
  }

  try {
    let result;
    
    // Execute query or scan based on parameters
    if (url) {
      result = await dynamoDb.query(params).promise();
    } else {
      result = await dynamoDb.scan(params).promise();
    }

    // Format items to exclude sensitive or large data
    const formattedItems = result.Items.map(item => {
      // Only include essential fields in the list view
      return {
        id: item.id,
        name: item.name,
        url: item.url,
        status: item.status,
        startTime: item.startTime,
        endTime: item.endTime,
        duration: item.metrics?.duration,
        errorsCount: item.errors?.length || 0,
        screenshots: {
          final: item.screenshots?.final,
          initial: item.screenshots?.initial
        },
        createdAt: item.createdAt
      };
    });

    // Prepare pagination token if there are more results
    let nextToken = null;
    if (result.LastEvaluatedKey) {
      nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    // Calculate summary statistics
    const summary = {
      total: formattedItems.length,
      successful: formattedItems.filter(item => item.status === 'success').length,
      failed: formattedItems.filter(item => item.status === 'failed').length,
      avgDuration: formattedItems.reduce((acc, item) => acc + (item.duration || 0), 0) / 
                 (formattedItems.length || 1)
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        items: formattedItems,
        summary,
        nextToken
      })
    };
  } catch (error) {
    console.error('Error fetching test results:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Could not retrieve test results',
        message: error.message
      })
    };
  }
};
