const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
};

/**
 * Creates a formatted API Gateway response
 * @param {number} statusCode HTTP status code
 * @param {object|string} body Response body
 * @param {object} additionalHeaders Additional headers to merge with defaults
 * @returns {object} Formatted response object
 */
exports.createResponse = (statusCode, body, additionalHeaders = {}) => {
  return {
    statusCode,
    headers: { ...defaultHeaders, ...additionalHeaders },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
};

/**
 * Handles common errors and returns appropriate responses
 * @param {Error} error Error object
 * @returns {object} Formatted error response
 */
exports.handleError = (error) => {
  console.error('Error:', error);

  // Handle specific error types
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

  if (error.name === 'ConditionalCheckFailedException') {
    return exports.createResponse(409, {
      error: 'Conflict',
      message: 'The resource has been modified by another request',
    });
  }

  // Handle AWS SDK errors
  if (error.code === 'ResourceNotFoundException') {
    return exports.createResponse(404, {
      error: 'Not Found',
      message: error.message,
    });
  }

  if (error.code === 'ValidationException') {
    return exports.createResponse(400, {
      error: 'Validation Error',
      message: error.message,
    });
  }

  if (error.code === 'ResourceInUseException') {
    return exports.createResponse(409, {
      error: 'Conflict',
      message: error.message,
    });
  }

  // Default error response
  return exports.createResponse(500, {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
  });
};

/**
 * Validates request input against a schema
 * @param {object} input Request input to validate
 * @param {object} schema Joi schema for validation
 * @throws {ValidationError} If validation fails
 */
exports.validateInput = (input, schema) => {
  const { error, value } = schema.validate(input, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';
    validationError.details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    throw validationError;
  }

  return value;
};

/**
 * Error class for resource not found scenarios
 */
class ResourceNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}

exports.ResourceNotFoundError = ResourceNotFoundError;