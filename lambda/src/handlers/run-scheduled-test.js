const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const playwright = require('playwright-aws-lambda');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();

/**
 * Lambda function to run scheduled tests
 * Triggered by EventBridge scheduled events
 */
exports.handler = async (event) => {
  console.log('Scheduled test event received:', JSON.stringify(event));
  
  // Check if this is a direct invocation from EventBridge with schedule details
  if (event.scheduleId) {
    return await runTest(event);
  }
  
  // Check if this is the hourly check for scheduled tests
  try {
    // Get current hour to find tests that need to run
    const now = new Date();
    const timestamp = now.toISOString();
    
    // Scan for active schedules
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      FilterExpression: 'active = :active AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':active': true,
        ':type': 'schedule'
      }
    };
    
    const result = await dynamoDb.scan(params).promise();
    
    if (!result.Items || result.Items.length === 0) {
      console.log('No active schedules found');
      return { 
        statusCode: 200, 
        body: JSON.stringify({ message: 'No active schedules found' }) 
      };
    }
    
    console.log(`Found ${result.Items.length} active schedules`);
    
    // Check each schedule to see if it needs to run now
    const schedulesToRun = [];
    
    for (const schedule of result.Items) {
      // For simplicity, we're using a very basic check here
      // In production, you would use a proper cron parser to determine if the schedule should run
      
      // For now, just check if it's past the next run time
      if (schedule.nextRunTime && new Date(schedule.nextRunTime) <= now) {
        schedulesToRun.push(schedule);
      }
    }
    
    console.log(`${schedulesToRun.length} schedules need to be run`);
    
    // Process each schedule that needs to run
    const runPromises = schedulesToRun.map(schedule => {
      // Invoke this lambda function for each schedule to run
      const params = {
        // Use the LAMBDA_FUNCTION_NAME env var instead of AWS_LAMBDA_FUNCTION_NAME
        FunctionName: process.env.LAMBDA_FUNCTION_NAME || process.env.AWS_LAMBDA_FUNCTION_NAME,
        InvocationType: 'Event', // Asynchronous invocation
        Payload: JSON.stringify({
          scheduleId: schedule.id,
          name: schedule.name,
          url: schedule.url,
          formConfig: schedule.formConfig,
          userData: schedule.userData
        })
      };
      
      return lambda.invoke(params).promise();
    });
    
    await Promise.all(runPromises);
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        message: `Triggered ${schedulesToRun.length} scheduled tests` 
      }) 
    };
    
  } catch (error) {
    console.error('Error processing scheduled tests:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process scheduled tests',
        message: error.message
      })
    };
  }
};

/**
 * Runs a specific test with the provided configuration
 */
async function runTest(testConfig) {
  const { scheduleId, name, url, formConfig, userData } = testConfig;
  const testId = uuidv4();
  const timestamp = new Date().toISOString();
  
  // Initialize test result object
  const testResult = {
    id: testId,
    scheduleId,
    name: name || url,
    url,
    status: 'running',
    startTime: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    errors: [],
    logs: ['Scheduled test started'],
    screenshots: {},
    formConfig,
    userData,
    type: 'test'
  };
  
  // Save initial test status
  await saveTestResult(testResult);
  
  // Update schedule with last run time
  await updateScheduleLastRun(scheduleId, timestamp, testId);
  
  let browser;
  try {
    // Launch browser
    browser = await playwright.launchChromium({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Add event listeners for console logs and errors
    page.on('console', message => {
      testResult.logs.push(`Console ${message.type()}: ${message.text()}`);
    });
    
    page.on('pageerror', error => {
      testResult.errors.push(`Page error: ${error.message}`);
    });
    
    // Navigate to the form URL
    testResult.logs.push(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Take initial screenshot
    const initialScreenshot = await page.screenshot();
    const initialScreenshotPath = await saveScreenshot(initialScreenshot, testId, 'initial');
    testResult.screenshots.initial = initialScreenshotPath;
    testResult.logs.push('Took initial screenshot');
    
    // Process form fields based on formConfig
    for (const field of formConfig.fields) {
      try {
        testResult.logs.push(`Processing field: ${field.name}`);
        
        // Get the value from userData or use default
        const value = userData[field.name] || field.defaultValue;
        
        if (!value && field.required) {
          throw new Error(`Missing required field: ${field.name}`);
        }
        
        // Handle different field types
        switch (field.type) {
          case 'text':
          case 'email':
          case 'password':
          case 'number':
          case 'tel':
            await page.fill(field.selector, value);
            testResult.logs.push(`Filled ${field.type} field: ${field.name} with value: ${value}`);
            break;
            
          case 'select':
            await page.selectOption(field.selector, value);
            testResult.logs.push(`Selected option in ${field.name}: ${value}`);
            break;
            
          case 'checkbox':
            if (value === true) {
              await page.check(field.selector);
              testResult.logs.push(`Checked checkbox: ${field.name}`);
            } else if (value === false) {
              await page.uncheck(field.selector);
              testResult.logs.push(`Unchecked checkbox: ${field.name}`);
            }
            break;
            
          case 'radio':
            await page.check(`${field.selector}[value="${value}"]`);
            testResult.logs.push(`Selected radio option: ${value} for ${field.name}`);
            break;
            
          default:
            testResult.logs.push(`Unsupported field type: ${field.type} for ${field.name}`);
        }
      } catch (fieldError) {
        testResult.errors.push(`Error processing field ${field.name}: ${fieldError.message}`);
        testResult.logs.push(`Failed to process field: ${field.name} - ${fieldError.message}`);
        
        // Take screenshot of the error state
        const errorScreenshot = await page.screenshot();
        const errorScreenshotPath = await saveScreenshot(errorScreenshot, testId, `error-${field.name}`);
        testResult.screenshots[`error-${field.name}`] = errorScreenshotPath;
      }
    }
    
    // Take pre-submission screenshot
    const preSubmitScreenshot = await page.screenshot();
    const preSubmitScreenshotPath = await saveScreenshot(preSubmitScreenshot, testId, 'pre-submit');
    testResult.screenshots.preSubmit = preSubmitScreenshotPath;
    testResult.logs.push('Took pre-submission screenshot');
    
    // Submit the form
    testResult.logs.push('Submitting form');
    await page.click(formConfig.submitButtonSelector);
    
    // Wait for form submission to complete
    if (formConfig.successIndicator) {
      try {
        await page.waitForSelector(formConfig.successIndicator.selector, { 
          timeout: formConfig.successIndicator.timeout || 10000 
        });
        testResult.logs.push('Form submitted successfully');
        testResult.status = 'success';
      } catch (waitError) {
        testResult.logs.push(`Timeout waiting for success indicator: ${waitError.message}`);
        testResult.errors.push(`Form submission success indicator not found: ${waitError.message}`);
        testResult.status = 'failed';
      }
    } else {
      // Wait for navigation or network idle if no success indicator specified
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      testResult.logs.push('Form submitted and page reached network idle state');
      testResult.status = 'completed';
    }
    
    // Take final screenshot
    const finalScreenshot = await page.screenshot();
    const finalScreenshotPath = await saveScreenshot(finalScreenshot, testId, 'final');
    testResult.screenshots.final = finalScreenshotPath;
    testResult.logs.push('Took final screenshot');
    
    // Calculate metrics
    testResult.metrics = {
      duration: new Date() - new Date(testResult.startTime),
      fieldsProcessed: formConfig.fields.length,
      errorsCount: testResult.errors.length
    };
    
    testResult.endTime = new Date().toISOString();
    testResult.updatedAt = new Date().toISOString();
    
  } catch (error) {
    // Handle any uncaught errors
    testResult.status = 'failed';
    testResult.errors.push(`Test execution error: ${error.message}`);
    testResult.logs.push(`Test failed with error: ${error.message}`);
    testResult.endTime = new Date().toISOString();
    testResult.updatedAt = new Date().toISOString();
  } finally {
    // Close the browser
    if (browser) {
      await browser.close();
    }
    
    // Save final test result
    await saveTestResult(testResult);
    
    // Update schedule with result
    await updateScheduleWithResult(scheduleId, testId, testResult.status);
    
    // Calculate next run time and update schedule
    await updateScheduleNextRun(scheduleId);
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Scheduled form test completed',
      testId: testId,
      scheduleId: scheduleId,
      status: testResult.status
    })
  };
}

// Helper to store screenshot in S3
async function saveScreenshot(buffer, testId, type) {
  const fileName = `${testId}/${type}-${Date.now()}.png`;
  await s3.putObject({
    Bucket: process.env.SCREENSHOTS_BUCKET || `form-testing-lambda-screenshots-${process.env.STAGE || 'dev'}`,
    Key: fileName,
    Body: buffer,
    ContentType: 'image/png'
  }).promise();
  
  return fileName;
}

// Helper to store test result in DynamoDB
async function saveTestResult(testResult) {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: testResult
  };
  
  await dynamoDb.put(params).promise();
  return testResult;
}

// Helper to update schedule with last run time
async function updateScheduleLastRun(scheduleId, timestamp, testId) {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: scheduleId },
      UpdateExpression: 'set lastRunTime = :lastRunTime, updatedAt = :updatedAt, runs = list_append(if_not_exists(runs, :empty_list), :testId)',
      ExpressionAttributeValues: {
        ':lastRunTime': timestamp,
        ':updatedAt': new Date().toISOString(),
        ':empty_list': [],
        ':testId': [testId]
      }
    };
    
    await dynamoDb.update(params).promise();
  } catch (error) {
    console.error(`Error updating schedule ${scheduleId} with last run time:`, error);
  }
}

// Helper to update schedule with test result
async function updateScheduleWithResult(scheduleId, testId, status) {
  try {
    // Get the current schedule
    const getParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: scheduleId }
    };
    
    const result = await dynamoDb.get(getParams).promise();
    const schedule = result.Item;
    
    if (!schedule) {
      console.error(`Schedule ${scheduleId} not found`);
      return;
    }
    
    // Update schedule stats
    const stats = schedule.stats || {
      total: 0,
      success: 0,
      failed: 0
    };
    
    stats.total++;
    if (status === 'success') {
      stats.success++;
    } else if (status === 'failed') {
      stats.failed++;
    }
    
    // Update the schedule
    const updateParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: scheduleId },
      UpdateExpression: 'set stats = :stats, updatedAt = :updatedAt, lastTestId = :testId, lastTestStatus = :status',
      ExpressionAttributeValues: {
        ':stats': stats,
        ':updatedAt': new Date().toISOString(),
        ':testId': testId,
        ':status': status
      }
    };
    
    await dynamoDb.update(updateParams).promise();
  } catch (error) {
    console.error(`Error updating schedule ${scheduleId} with test result:`, error);
  }
}

// Helper to update the next run time for a schedule
async function updateScheduleNextRun(scheduleId) {
  try {
    // Get the current schedule
    const getParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: scheduleId }
    };
    
    const result = await dynamoDb.get(getParams).promise();
    const schedule = result.Item;
    
    if (!schedule) {
      console.error(`Schedule ${scheduleId} not found`);
      return;
    }
    
    // Calculate the next run time based on frequency
    let nextRunTime = null;
    
    // This is a simplified implementation
    // For production, use a proper cron parser library
    switch (schedule.frequency) {
      case 'hourly':
        nextRunTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        break;
      case 'daily':
        nextRunTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        break;
      case 'weekly':
        nextRunTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        break;
      case 'monthly':
        // Rough approximation of a month
        nextRunTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        nextRunTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to daily
    }
    
    // Update the schedule with the next run time
    const updateParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: scheduleId },
      UpdateExpression: 'set nextRunTime = :nextRunTime, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':nextRunTime': nextRunTime.toISOString(),
        ':updatedAt': new Date().toISOString()
      }
    };
    
    await dynamoDb.update(updateParams).promise();
  } catch (error) {
    console.error(`Error updating next run time for schedule ${scheduleId}:`, error);
  }
}
