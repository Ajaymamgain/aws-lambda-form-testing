const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const eventBridge = new AWS.EventBridge();

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
    
    const schedule = scheduleResult.Item;
    
    // Delete EventBridge rule if it exists
    if (schedule.ruleArn) {
      const ruleName = `form-test-schedule-${scheduleId}`;
      
      try {
        // First, remove all targets from the rule
        const targetsResponse = await eventBridge.listTargetsByRule({
          Rule: ruleName
        }).promise();
        
        if (targetsResponse.Targets && targetsResponse.Targets.length > 0) {
          const targetIds = targetsResponse.Targets.map(target => target.Id);
          
          await eventBridge.removeTargets({
            Rule: ruleName,
            Ids: targetIds
          }).promise();
        }
        
        // Then delete the rule
        await eventBridge.deleteRule({
          Name: ruleName
        }).promise();
        
        console.log(`Successfully deleted EventBridge rule: ${ruleName}`);
      } catch (ruleError) {
        // Log the error but continue with deleting the schedule record
        console.error(`Error deleting EventBridge rule: ${ruleName}`, ruleError);
      }
    }
    
    // Delete the schedule from DynamoDB
    const deleteParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        id: scheduleId
      }
    };
    
    await dynamoDb.delete(deleteParams).promise();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Schedule deleted successfully',
        scheduleId
      })
    };
    
  } catch (error) {
    console.error('Error deleting schedule:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Failed to delete schedule',
        message: error.message
      })
    };
  }
};
