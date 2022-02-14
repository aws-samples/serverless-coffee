/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const eventbridge = new AWS.EventBridge()

const { nanoid } = require('nanoid')
const { getItem, decrementToken } = require('./ddb')

const TIME_INTERVAL = (process.env.TimeInterval * 60 * 1000)

// Verifies a QR code
exports.handler = async (event,context) => {
  console.log(JSON.stringify(event, null, 2))
  let bucket = {}

  // Missing parameters
  if (!event.queryStringParameters) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: "Missing parameter" })
    }
  }

  // Load bucket from DynamoDB, if available
  const CURRENT_TIME_BUCKET_ID = parseInt(Date.now() / TIME_INTERVAL)
  console.log('Bucket:', CURRENT_TIME_BUCKET_ID)

  const result = await getItem(CURRENT_TIME_BUCKET_ID)
  if ( result.Items.length != 0 ) {
    bucket = result.Items[0]
    console.log('Bucket loaded: ', bucket)
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid code'
      })
    }
  }

  // Validate token
  if (event.queryStringParameters.token != bucket.last_code) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Invalid code'
      })
    }
  }

  // Check if enough tokens
  if (bucket.availableTokens < 1) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        error: 'No tokens remaining'
      })
    }
  }

  // Decrement token count
  const orderId = nanoid()
  const userId = event.requestContext.authorizer.jwt.claims.sub

  bucket.availableTokens--
  await decrementToken(bucket)

  // Publish to EventBridge with new order ID
  const response = await eventbridge.putEvents({
    Entries: [
      {
        Detail: JSON.stringify({
          orderId,
          userId,
          Message:"A Lambda function is invoked by a POST request to Amazon API Gateway. The Lambda function, Takes the token ID from the QR code scan and checks it against the valid token ID's stored in a DynamoDB database. If Valid, a new Step Functions Workflow is started, this workflow ochestrates various AWS services to move the order along to completion.",
          bucket
        }),
        DetailType: 'Validator.NewOrder',
        EventBusName: process.env.BusName,

        Source: process.env.Source,
        Resources: [context.invokedFunctionArn],
        Time: new Date
      }
    ]
  }).promise()
  console.log('EventBridge putEvents:', response)

  // Return the code
  return {
    statusCode: 200,
    body: JSON.stringify({ orderId })
  }
}