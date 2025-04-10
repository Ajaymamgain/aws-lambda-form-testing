const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const eventBridge = new AWS.EventBridge();

// Helper function to validate cron expression
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

// Helper to validate frequency
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

// Helper to calculate next run time
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

exports.handler = async (event) => {
  try {
    // Get the schedule ID from the path parameter
    const scheduleId = event.pathParameters?.id;
    
    if (!scheduleId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          error: 'Missing schedule ID'
        })
      };
    }
    
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
      active
    } = requestBody;
    
    // Validate the schedule exists
    const getParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: scheduleId
      }
    };
    
    const scheduleResult = await dynamoDb.get(getParams).promise();
    
    if (!scheduleResult.Item || scheduleResult.Item.type !== 'schedule') {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          error: 'Schedule not found'
        })
      };
    }
    
    const existingSchedule = scheduleResult.Item;
    
    // Check frequency validation if it's being updated
    if (frequency && !isValidFrequency(frequency, frequency === 'custom' ? customCronExpression : null)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          error: 'Invalid frequency or custom cron expression'
        })
      };
    }
    
    // Update schedule in DynamoDB
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    // Helper to add a field to the update expression
    const addToUpdate = (field, value, path = field) => {
      if (value !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = path;
        expressionAttributeValues[`:${field}`] = value;
        return true;
      }
      return false;
    };
    
    // Add fields to update
    addToUpdate('name', name);
    addToUpdate('description', description);
    addToUpdate('url', url);
    addToUpdate('formConfig', formConfig);
    addToUpdate('userData', userData);
    
    // Special handling for frequency which affects cron expression
    let updateCron = false;
    if (frequency) {
      addToUpdate('frequency', frequency);
      
      // Determine new cron expression based on frequency
      const newCronExpression = getCronExpression(
        frequency,
        frequency === 'custom' ? customCronExpression : null,
        specificTime || existingSchedule.specificTime
      );
      
      addToUpdate('cronExpression', newCronExpression);
      addToUpdate('specificTime', specificTime);
      
      if (frequency === 'custom') {
        addToUpdate('customCronExpression', customCronExpression);
      }
      
      updateCron = true;
    } else if (specificTime && specificTime !== existingSchedule.specificTime) {
      // If only the specific time changed, update the cron expression
      const newCronExpression = getCronExpression(
        existingSchedule.frequency,
        existingSchedule.frequency === 'custom' ? existingSchedule.customCronExpression : null,
        specificTime
      );
      
      addToUpdate('cronExpression', newCronExpression);
      addToUpdate('specificTime', specificTime);
      
      updateCron = true;
    }
    
    // Add updated timestamp
    addToUpdate('updatedAt', new Date().toISOString());
    
    // Update active status if provided
    const activeChanged = active !== undefined && active !== existingSchedule.active;
    if (activeChanged) {
      addToUpdate('active', active);
    }
    
    // Calculate next run time if frequency or active status changed
    if (updateCron || activeChanged) {
      const cronExpToUse = expressionAttributeValues[':cronExpression'] || existingSchedule.cronExpression;
      const frequencyToUse = expressionAttributeValues[':frequency'] || existingSchedule.frequency;
      
      const nextRunTime = calculateNextRunTime(cronExpToUse, frequencyToUse);
      addToUpdate('nextRunTime', nextRunTime.toISOString());
    }
    
    // If nothing to update, return success
    if (updateExpressions.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          message: 'No changes to apply',
          scheduleId
        })
      };
    }
    
    // Create update expression
    const updateParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: scheduleId
      },
      UpdateExpression: `set ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    
    const updateResult = await dynamoDb.update(updateParams).promise();
    
    // Update EventBridge rule if necessary
    if ((updateCron || activeChanged) && existingSchedule.ruleArn) {
      const ruleName = `form-test-schedule-${scheduleId}`;
      
      if (active === false) {
        // Disable the rule if active is set to false
        await eventBridge.disableRule({
          Name: ruleName
        }).promise();
      } else if (updateCron || (activeChanged && active === true)) {
        // Update rule with new cron expression or enable it
        await eventBridge.putRule({
          Name: ruleName,
          ScheduleExpression: expressionAttributeValues[':cronExpression'] || existingSchedule.cronExpression,
          State: 'ENABLED'
        }).promise();
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Schedule updated successfully',
        scheduleId,
        schedule: updateResult.Attributes
      })
    };
    
  } catch (error) {
    console.error('Error updating schedule:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Failed to update schedule',
        message: error.message
      })
    };
  }
};
