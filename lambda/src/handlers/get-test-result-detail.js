const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    // Get the test ID from the path parameter
    const testId = event.pathParameters?.id;
    
    if (!testId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing test ID' })
      };
    }
    
    // Query DynamoDB for the test result
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: testId }
    };
    
    const result = await dynamoDb.get(params).promise();
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Test result not found' })
      };
    }
    
    const testResult = result.Item;
    
    // Generate signed URLs for screenshots if they exist
    if (testResult.screenshots && Object.keys(testResult.screenshots).length > 0) {
      const signedUrls = {};
      const bucketName = process.env.SCREENSHOTS_BUCKET || 
                         `form-testing-lambda-screenshots-${process.env.STAGE || 'dev'}`;
      
      for (const [key, fileName] of Object.entries(testResult.screenshots)) {
        if (fileName) {
          const params = {
            Bucket: bucketName,
            Key: fileName,
            Expires: 3600 // URL valid for 1 hour
          };
          
          try {
            const url = await s3.getSignedUrlPromise('getObject', params);
            signedUrls[key] = url;
          } catch (error) {
            console.error(`Error generating signed URL for ${fileName}:`, error);
            signedUrls[key] = null;
          }
        }
      }
      
      testResult.screenshotUrls = signedUrls;
    }
    
    // If this is a test from a schedule, get the schedule details
    if (testResult.scheduleId) {
      try {
        const scheduleParams = {
          TableName: process.env.DYNAMODB_TABLE,
          Key: { id: testResult.scheduleId }
        };
        
        const scheduleResult = await dynamoDb.get(scheduleParams).promise();
        
        if (scheduleResult.Item) {
          // Include only essential schedule information
          testResult.schedule = {
            id: scheduleResult.Item.id,
            name: scheduleResult.Item.name,
            frequency: scheduleResult.Item.frequency,
            active: scheduleResult.Item.active,
            lastRunTime: scheduleResult.Item.lastRunTime,
            nextRunTime: scheduleResult.Item.nextRunTime
          };
        }
      } catch (error) {
        console.error(`Error fetching schedule for test ${testId}:`, error);
      }
    }
    
    // Include report metrics and analytics
    testResult.analytics = {
      ...testResult.metrics,
      successRate: testResult.status === 'success' ? 100 : 0,
      formCompletionRate: calculateFormCompletionRate(testResult),
      errorBreakdown: analyzeErrors(testResult.errors || []),
      performanceMetrics: {
        loadTime: testResult.metrics?.loadTime,
        processingTime: testResult.metrics?.duration,
        submissionTime: testResult.metrics?.submissionTime
      }
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(testResult)
    };
    
  } catch (error) {
    console.error('Error fetching test result detail:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Could not retrieve test result detail',
        message: error.message
      })
    };
  }
};

/**
 * Calculate form completion rate based on fields processed successfully
 */
function calculateFormCompletionRate(testResult) {
  if (!testResult.formConfig || !testResult.formConfig.fields) {
    return 0;
  }
  
  const totalFields = testResult.formConfig.fields.length;
  
  if (totalFields === 0) {
    return 0;
  }
  
  // Count fields with errors
  const fieldErrors = (testResult.errors || [])
    .filter(error => error.includes('Error processing field') || error.includes('Missing required field'))
    .length;
  
  const successfulFields = totalFields - fieldErrors;
  return Math.round((successfulFields / totalFields) * 100);
}

/**
 * Analyze errors to categorize them for reporting
 */
function analyzeErrors(errors) {
  const errorCategories = {
    field: 0,
    navigation: 0,
    timeout: 0,
    validation: 0,
    submission: 0,
    other: 0
  };
  
  errors.forEach(error => {
    const errorText = error.toLowerCase();
    
    if (errorText.includes('field')) {
      errorCategories.field++;
    } else if (errorText.includes('navigation') || errorText.includes('navigate')) {
      errorCategories.navigation++;
    } else if (errorText.includes('timeout') || errorText.includes('timed out')) {
      errorCategories.timeout++;
    } else if (errorText.includes('validation') || errorText.includes('invalid')) {
      errorCategories.validation++;
    } else if (errorText.includes('submission') || errorText.includes('submit')) {
      errorCategories.submission++;
    } else {
      errorCategories.other++;
    }
  });
  
  return errorCategories;
}
