const playwright = require('playwright-aws-lambda');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// Helper to store screenshot in S3
const saveScreenshot = async (buffer, testId, type) => {
  const fileName = `${testId}/${type}-${Date.now()}.png`;
  await s3.putObject({
    Bucket: process.env.SCREENSHOTS_BUCKET || `form-testing-lambda-screenshots-${process.env.STAGE || 'dev'}`,
    Key: fileName,
    Body: buffer,
    ContentType: 'image/png'
  }).promise();
  
  return fileName;
};

// Helper to store test result in DynamoDB
const saveTestResult = async (testResult) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: testResult
  };
  
  await dynamoDb.put(params).promise();
  return testResult;
};

exports.handler = async (event) => {
  // Generate a unique test ID
  const testId = uuidv4();
  const timestamp = new Date().toISOString();
  
  // Parse request body
  const requestBody = JSON.parse(event.body || '{}');
  const { 
    url,
    formConfig,
    userData,
    name,
    description 
  } = requestBody;
  
  if (!url || !formConfig || !userData) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing required parameters: url, formConfig, or userData'
      })
    };
  }
  
  // Initialize test result object
  const testResult = {
    id: testId,
    name: name || url,
    description: description || `Form test for ${url}`,
    url,
    status: 'running',
    startTime: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    errors: [],
    logs: ['Test started'],
    screenshots: {},
    formConfig,
    userData: userData
  };
  
  // Save initial test status
  await saveTestResult(testResult);
  
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
            
          case 'file':
            // Note: File uploads may require special handling in Lambda
            testResult.logs.push(`File upload not fully supported: ${field.name}`);
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
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      message: 'Form test completed',
      testId: testId,
      status: testResult.status,
      url: testResult.url,
      screenshots: testResult.screenshots,
      errorCount: testResult.errors.length
    })
  };
};
