/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })

const documentClient = new AWS.DynamoDB.DocumentClient()
const eventbridge = new AWS.EventBridge()
const stepFunctions = new AWS.StepFunctions()

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': "Content-Type,Authorization,authorization",
  "Access-Control-Allow-Methods": "OPTIONS,PUT"
}

const isAdmin = (requestContext) => {
  try {
    const groups = requestContext.authorizer.jwt.claims['cognito:groups'].replace('[','').replace(']','').split(',')
    return groups.includes('admin')
  } catch (err) {
    return false
  }
}

// Update database
const updateDDB = async (record) => {
  // Update DynamoDB
  const params = {
    TableName: process.env.TableName,
    Key: {
      PK: 'orders',
      SK: record.orderId,
    },
    UpdateExpression: "set ORDERSTATE = :state, TS = :TS",
    ExpressionAttributeValues:{
      ":state": 'COMPLETED',
      ":TS": Date.now()
    },
    ReturnValues:"ALL_NEW"
  }

  console.log('updateDDB: ', params)
  const result = await documentClient.update(params).promise()
  console.log('Result: ', JSON.stringify(result,null, 2))

  return {
    orderNumber: result.Attributes.orderNumber,
    userId: result.Attributes.USERID,
    drinkOrder: result.Attributes.drinkOrder,
    orderState: result.Attributes.ORDERSTATE,
    TaskToken: result.Attributes.TaskToken
  }
}

const completeWorkflow = async (record) => {
  // Update Step Functions workflow
  const sfnParams = {
    taskToken: record.order.TaskToken,
    output: JSON.stringify({'cancelled': false})
  }

  // console.log ({ sfnParams })
  try {
    const sfnResult = await stepFunctions.sendTaskSuccess(sfnParams).promise()
    console.log({ sfnResult })
  } catch (err) {
    console.error('completeWorkflow error: ', err)
  }
}

// Publish event to EventBridge
const publishEvent = async (record) => {

  // Do not publish this value
  delete record.order.TaskToken

  const params = {
    Entries: [
      {
        Detail: JSON.stringify(record),
        DetailType: 'OrderManager.OrderCompleted',
        EventBusName: process.env.BusName,
        Source: process.env.Source,
        Time: new Date
      }
    ]
  }

  console.log('publishEvent: ', params)
  const response = await eventbridge.putEvents(params).promise()
  console.log('EventBridge putEvents:', response)
}

// Complete an order
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  // If not an admin user, exit
  if (!isAdmin(event.requestContext)) {
    return {
      "statusCode": 403
    }
  }

  const record = {
    actionUserId: event.requestContext.authorizer.jwt.claims.sub,
    orderId: event.pathParameters.id,
    Message: "The barista presses the 'complete order' button, this sends an HTTP POST request to Amazon API Gateway which invokes an AWS Lambda function. The Lambda function updates the order item in DynamoDb, and retrives the correct Task token. It then resumes the Step Functions workflow and emits a final 'Order completed' event to Amazon EventBridge",

  }

  console.log ('Parameters: ', record)
  record.order = await updateDDB (record)
  console.log('Record: ', JSON.stringify(record, null, 2))
  
  record.userId = record.order.userId
  await completeWorkflow (record)
  await publishEvent (record)

  // Return to client
  return {
    headers,
    "statusCode": 200,
    "body": JSON.stringify({}),
    "isBase64Encoded": false
  }
}
