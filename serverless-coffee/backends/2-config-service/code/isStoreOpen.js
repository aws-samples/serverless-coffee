/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const documentClient = new AWS.DynamoDB.DocumentClient()

// Returns config from DynamoDB table
const isStoreOpen = async () => {

  // Query the service's DDB table
  const result = await documentClient.query({
    TableName: process.env.TableName,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: {
      "#pk": "PK"
    },
    ExpressionAttributeValues: {
      ":pk": "config"
    }
  }).promise()

  // Get config from DynamoDB results
  const storeOpen =  result.Items[0].storeOpen
  console.log(storeOpen)

  return {
    "statusCode": 200,
    "body": JSON.stringify({storeOpen}),
    "isBase64Encoded": false
  }
}

// Returns application config
exports.handler = async (event) => {
  const config = await isStoreOpen ()
  return config
}
