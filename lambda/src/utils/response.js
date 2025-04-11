const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'http://localhost:3001',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
};

/**
 * Creates a formatted API Gateway response
 */
exports.createResponse = (statusCode, body, additionalHeaders = {}) => {
  return {
    statusCode,
    headers: { ...defaultHeaders, ...additionalHeaders },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
};

/**
 * Handle preflight requests for CORS
 */
exports.handleCors = () => {
  return {
    statusCode: 200,
    headers: defaultHeaders,
    body: '',
  };
};

/**
 * Handles common errors and returns appropriate responses
 */
exports.handleError = (error) => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    return exports.createResponse(400, {
      error: 'Validation Error',
      message: error.message,
      details: error.details,
    });
  }

  if (error.name === 'ResourceNotFoundError') {
    return exports.createResponse(404, {
      error: 'Not Found',
      message: error.message,
    });
  }

  return exports.createResponse(500, {
    error: 'Internal Server Error',
    message: process.env.IS_OFFLINE ? error.message : 'An unexpected error occurred',
  });
};