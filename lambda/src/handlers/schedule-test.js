const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const eventBridge = new AWS.EventBridge();

// Validate the cron expression
const isValidCronExpression = (cronExpression) => {
  // Basic validation - can be expanded for more thorough checks
  const parts = cronExpression.split(' ');
  return parts.length === 6; // AWS expects 6 parts for cron expressions
};

// Validate the schedule frequency
const isValidFrequency = (frequency, customValue) => {
  const validFrequencies = ['hourly', 'daily', 'weekly', 'monthly', 'custom'];
  
  if (!validFrequencies.includes(frequency)) {
    return false;
  }
  
  if (frequency === 'custom' && !isValidCronExpression(customValue)) {
    return false;
  }
  
  return true;
};

// Get cron expression from frequency
const getCronExpression = (frequency, customValue, specificTime) => {
  const time = specificTime || '00:00';
  const [hour, minute] = time.split(':').map(Number);
  
  switch (frequency) {
    case 'hourly':
      return 'cron(0 * * * ? *)'; // Run at the beginning of every hour
    case 'daily':
      return `cron(${minute} ${hour} * * ? *)`; // Run at specified time every day
    case 'weekly':
      return `cron(${minute} ${hour} ? * MON *)`; // Run at specified time every Monday
    case 'monthly':
      return `cron(${minute} ${hour} 1 * ? *)`; // Run at specified time on the 1st of every month
    case 'custom':
      return customValue; // Use custom cron expression
    default:
      return 'cron(0 0 * * ? *)'; // Default to midnight every day
  }
};

exports.handler = async (event) => {
  try {
    // Parse request body
    const requestBody = JSON.parse(event.body || '{}');
    const {
      name,
      description,
      url,
      formConfig,
      userData,
      frequency,
      customCronExpression,
      specificTime,
      active = true
    } = requestBody;
    
    // Validate required fields
    if (!name || !url || !formConfig || !userData || !frequency) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required parameters: name, url, formConfig, userData, or frequency'
        })
      };
    }
    
    // Validate frequency
    if (!isValidFrequency(frequency, customCronExpression)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid frequency or custom cron expression'
        })
      };
    }
    
    // Generate schedule ID
    const scheduleId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Create cron expression for the schedule
    const cronExpression = getCronExpression(frequency, customCronExpression, specificTime);
    
    // Create the schedule in DynamoDB
    const scheduleItem = {
      id: scheduleId,
      name,
      description,
      url,
      formConfig,
      userData,
      frequency,
      cronExpression,
      specificTime,
      active,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastRunTime: null,
      nextRunTime: null,
      runs: [],
      type: 'schedule'
    };
    
    await dynamoDb.put({
      TableName: process.env.DYNAMODB_TABLE,
      Item: scheduleItem
    }).promise();
    
    // Create EventBridge rule if schedule is active
    if (active) {
      // Name for the EventBridge rule
      const ruleName = `form-test-schedule-${scheduleId}`;
      
      // Create the rule
      const ruleParams = {
        Name: ruleName,
        ScheduleExpression: cronExpression,
        State: 'ENABLED',
        Description: `Schedule for form test: ${name}`,
      };
      
      const ruleResult = await eventBridge.putRule(ruleParams).promise();
      
      // Set the target for the rule (our Lambda function)
      const targetParams = {
        Rule: ruleName,
        Targets: [
          {
            Id: `form-test-target-${scheduleId}`,
            Arn: process.env.RUN_SCHEDULED_TEST_LAMBDA_ARN,
            Input: JSON.stringify({
              scheduleId,
              name,
              url,
              formConfig,
              userData
            }),
          },
        ],
      };
      
      await eventBridge.putTargets(targetParams).promise();
      
      // Update the schedule with the rule ARN
      await dynamoDb.update({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id: scheduleId },
        UpdateExpression: 'set ruleArn = :ruleArn',
        ExpressionAttributeValues: {
          ':ruleArn': ruleResult.RuleArn
        }
      }).promise();
      
      // Calculate the next run time
      const nextRunTime = calculateNextRunTime(cronExpression);
      if (nextRunTime) {
        await dynamoDb.update({
          TableName: process.env.DYNAMODB_TABLE,
          Key: { id: scheduleId },
          UpdateExpression: 'set nextRunTime = :nextRunTime',
          ExpressionAttributeValues: {
            ':nextRunTime': nextRunTime.toISOString()
          }
        }).promise();
      }
    }
    
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: `Schedule created successfully${active ? ' and activated' : ''}`,
        scheduleId,
        name,
        frequency,
        cronExpression,
        active
      })
    };
    
  } catch (error) {
    console.error('Error creating schedule:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to create schedule',
        message: error.message
      })
    };
  }
};

// Helper function to calculate the next run time based on cron expression
function calculateNextRunTime(cronExpression) {
  try {
    // This is a simplified implementation
    // For production, consider using a library like 'cron-parser'
    // that can accurately calculate the next run time from a cron expression
    
    // For now, we'll just return a time 1 hour from now as an example
    const now = new Date();
    return new Date(now.getTime() + 60 * 60 * 1000);
  } catch (error) {
    console.error('Error calculating next run time:', error);
    return null;
  }
}
