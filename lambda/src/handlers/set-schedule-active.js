const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const eventBridge = new AWS.EventBridge();

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
    
    // Parse request body to get active status
    const requestBody = JSON.parse(event.body || '{}');
    const { active } = requestBody;
    
    if (active === undefined) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          error: 'Missing active parameter'
        })
      };
    }
    
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
    
    // If the active status is already what was requested, just return success
    if (existingSchedule.active === active) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          message: `Schedule is already ${active ? 'active' : 'inactive'}`,
          scheduleId,
          active
        })
      };
    }
    
    const updateParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: scheduleId },
      UpdateExpression: 'set active = :active, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':active': active,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };
    
    // If activating, calculate next run time
    if (active) {
      const nextRunTime = calculateNextRunTime(existingSchedule.cronExpression, existingSchedule.frequency);
      updateParams.UpdateExpression = 'set active = :active, updatedAt = :updatedAt, nextRunTime = :nextRunTime';
      updateParams.ExpressionAttributeValues[':nextRunTime'] = nextRunTime.toISOString();
    }
    
    const updateResult = await dynamoDb.update(updateParams).promise();
    
    // Update EventBridge rule
    const ruleName = `form-test-schedule-${scheduleId}`;
    
    if (active) {
      // Create or enable the rule
      if (existingSchedule.ruleArn) {
        // Enable existing rule
        await eventBridge.enableRule({
          Name: ruleName
        }).promise();
      } else {
        // Create new rule
        const ruleParams = {
          Name: ruleName,
          ScheduleExpression: existingSchedule.cronExpression,
          State: 'ENABLED',
          Description: `Schedule for form test: ${existingSchedule.name}`,
        };
        
        const ruleResult = await eventBridge.putRule(ruleParams).promise();
        
        // Set the target for the rule
        const targetParams = {
          Rule: ruleName,
          Targets: [
            {
              Id: `form-test-target-${scheduleId}`,
              Arn: process.env.RUN_SCHEDULED_TEST_LAMBDA_ARN,
              Input: JSON.stringify({
                scheduleId,
                name: existingSchedule.name,
                url: existingSchedule.url,
                formConfig: existingSchedule.formConfig,
                userData: existingSchedule.userData
              }),
            },
          ],
        };
        
        await eventBridge.putTargets(targetParams).promise();
        
        // Update ruleArn in DynamoDB
        await dynamoDb.update({
          TableName: process.env.DYNAMODB_TABLE,
          Key: { id: scheduleId },
          UpdateExpression: 'set ruleArn = :ruleArn',
          ExpressionAttributeValues: {
            ':ruleArn': ruleResult.RuleArn
          }
        }).promise();
      }
    } else {
      // Disable the rule
      await eventBridge.disableRule({
        Name: ruleName
      }).promise();
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: `Schedule ${active ? 'activated' : 'deactivated'} successfully`,
        scheduleId,
        active,
        schedule: updateResult.Attributes
      })
    };
    
  } catch (error) {
    console.error('Error setting schedule active status:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Failed to update schedule active status',
        message: error.message
      })
    };
  }
};
