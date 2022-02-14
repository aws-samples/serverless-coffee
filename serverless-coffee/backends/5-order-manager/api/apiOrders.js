/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const documentClient = new AWS.DynamoDB.DocumentClient()

// Returns all open orders
const getOrders = async (state) => {
  const params = {
    TableName: process.env.TableName,
    IndexName: 'GSI-status',
    KeyConditionExpression: 'ORDERSTATE = :key',
    ExpressionAttributeValues: {
      ':key': state
    },
    ScanIndexForward: true,
    // Limit: 12,
    ProjectionExpression: "PK, SK, ORDERSTATE, robot, drink, TS, userId"
  }

  const result = await documentClient.query(params).promise()
  console.log('openOrders: ', result)
  return result
}

// Returns list of open orders, sorted by time
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  const state = event.queryStringParameters.state
  const orders = await getOrders (state)

  return {
    "statusCode": 200,
    "body": JSON.stringify(orders.Items),
    "isBase64Encoded": false
  }
}
