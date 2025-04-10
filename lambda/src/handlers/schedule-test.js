const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const eventBridge = new AWS.EventBridge();

// Validate the cron expression
const isValidCronExpression = (cronExpression) => {
  // Basic validation - can be expanded for more thorough checks
  const parts = cronExpression.split(' ');
  
  if (parts.length !== 6) {
    return false; // AWS expects 6 parts for cron expressions
  }
  
  // Basic regex pattern for each part
  const patterns = [
    /^[0-9\-\,\/\*]+$/, // Minutes: 0-59
    /^[0-9\-\,\/\*]+$/, // Hours: 0-23
    /^[0-9\-\,\/\*\?LW]+$/, // Day of month: 1-31
    /^[0-9\-\,\/\*]+$/, // Month: 1-12 or JAN-DEC
    /^[0-9\-\,\/\*\?L#]+$|^(MON|TUE|WED|THU|FRI|SAT|SUN)$/, // Day of week: 1-7 or SUN-SAT
    /^[0-9\-\,\/\*]+$/ // Year: 1970-2199
  ];
  
  for (let i = 0; i < 6; i++) {
    if (!patterns[i].test(parts[i])) {
      return false;
    }
  }
  
  // Either day-of-month or day-of-week must be '?'
  if (parts[2] !== '?' && parts[4] !== '?') {
    return false;
  }
  
  return true;
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
      stats: {
        total: 0,
        success: 0,
        failed: 0
      },
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
      const nextRunTime = calculateNextRunTime(cronExpression, frequency);
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

// Helper function to calculate the next run time based on cron expression and frequency
function calculateNextRunTime(cronExpression, frequency) {
  try {
    // This implementation provides a more accurate next run time based on the frequency
    const now = new Date();
    let nextRunTime = new Date(now);
    
    // Add the appropriate time interval based on frequency
    switch (frequency) {
      case 'hourly':
        // Set to the beginning of the next hour
        nextRunTime.setHours(now.getHours() + 1, 0, 0, 0);
        break;
        
      case 'daily':
        // If it's already past the specified time today, set to tomorrow
        if (cronExpression.includes('cron(')) {
          const parts = cronExpression.replace('cron(', '').replace(')', '').split(' ');
          const minute = parseInt(parts[0], 10);
          const hour = parseInt(parts[1], 10);
          
          nextRunTime.setHours(hour, minute, 0, 0);
          
          if (nextRunTime <= now) {
            nextRunTime.setDate(nextRunTime.getDate() + 1);
          }
        } else {
          // Default to next day at midnight
          nextRunTime.setDate(now.getDate() + 1);
          nextRunTime.setHours(0, 0, 0, 0);
        }
        break;
        
      case 'weekly':
        // Set to next Monday
        const daysUntilMonday = 1 - now.getDay();
        nextRunTime.setDate(now.getDate() + (daysUntilMonday <= 0 ? 7 + daysUntilMonday : daysUntilMonday));
        
        // Set the time if specified in the cron
        if (cronExpression.includes('cron(')) {
          const parts = cronExpression.replace('cron(', '').replace(')', '').split(' ');
          const minute = parseInt(parts[0], 10);
          const hour = parseInt(parts[1], 10);
          
          nextRunTime.setHours(hour, minute, 0, 0);
        } else {
          // Default to midnight
          nextRunTime.setHours(0, 0, 0, 0);
        }
        break;
        
      case 'monthly':
        // Set to the 1st of next month
        nextRunTime.setMonth(now.getMonth() + 1, 1);
        
        // Set the time if specified in the cron
        if (cronExpression.includes('cron(')) {
          const parts = cronExpression.replace('cron(', '').replace(')', '').split(' ');
          const minute = parseInt(parts[0], 10);
          const hour = parseInt(parts[1], 10);
          
          nextRunTime.setHours(hour, minute, 0, 0);
        } else {
          // Default to midnight
          nextRunTime.setHours(0, 0, 0, 0);
        }
        break;
        
      case 'custom':
        // For custom cron expressions, provide a reasonable default
        // In a real implementation, you would use a cron parser library
        nextRunTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 24 hours from now
        break;
        
      default:
        // Default to 24 hours from now
        nextRunTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    
    return nextRunTime;
  } catch (error) {
    console.error('Error calculating next run time:', error);
    // Fallback to 24 hours from now
    return new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  }
}
