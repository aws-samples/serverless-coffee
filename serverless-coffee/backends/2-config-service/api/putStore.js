'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })

const documentClient = new AWS.DynamoDB.DocumentClient()

  // Update DynamoDB
const updateStoreState = async (state) => {
  const params = {
    TableName: process.env.TableName,
    Key: {
      PK: 'config'
    },
    UpdateExpression: "set storeOpen = :openState",
    ExpressionAttributeValues:{
      ":openState": state,
    },
    ReturnValues:"ALL_NEW"
  }

  console.log('updateStoreState: ', params)
  const result = await documentClient.update(params).promise()
}

// Open/close store
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  const userId = event.requestContext.authorizer.jwt.claims.sub
  const state = event.queryStringParameters?.state

  // Store state can only be open or closed
  if (state != 'open' && state != 'closed') {
    return {
      "statusCode": 400
    }
  }

  const newState = (state === 'open') ? true : false

  // Save to DynamoDB
  await updateStoreState(newState)
  console.log(`Requested store state: ${state} by ${userId}.`)

  return {
    "statusCode": 200,
    "body": JSON.stringify({ state }),
    "isBase64Encoded": false
  }
}
