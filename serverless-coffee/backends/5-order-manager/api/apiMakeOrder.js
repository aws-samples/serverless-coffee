/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })

const documentClient = new AWS.DynamoDB.DocumentClient()
const eventbridge = new AWS.EventBridge()

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
    UpdateExpression: "set baristaUserId = :baristaUserId, TS = :TS",
    ExpressionAttributeValues:{
      ":baristaUserId": record.baristaUserId,
      ":TS": Date.now()
    },
    ReturnValues:"ALL_NEW"
  }

  console.log('updateDDB: ', params)
  const result = await documentClient.update(params).promise()
  console.log('Result: ', JSON.stringify(result,null, 2))
  return result.Attributes
}

// Publish event to EventBridge
const publishEvent = async (record) => {
  const params = {
    Entries: [
      {
        Detail: JSON.stringify(record),
        DetailType: 'OrderManager.MakeOrder',
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

// Claim an order
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  // If not an admin user, exit
  if (!isAdmin(event.requestContext)) {
    return {
      "statusCode": 403
    }
  }

  const record = {
    baristaUserId: event.requestContext.authorizer.jwt.claims.sub,
    orderId: event.pathParameters.id,
    Message:"The barista has pressed the 'Make order' button, this Invokes a Lambda function via API Gateway, which updates the order in DynamoDB and emits a new 'make order' Event.",
  }

  // For unmake, remove the barista from the order
  if (event.queryStringParameters?.action === "unmake") record.baristaUserId = null

  record.order = await updateDDB (record)
  record.userId = record.order.USERID
  console.log('Record: ', JSON.stringify(record, null, 2))

  await publishEvent (record)

  // Return to client
  return {
    "statusCode": 200,
    "body": JSON.stringify({}),
    "isBase64Encoded": false
  }
}
