/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })

const documentClient = new AWS.DynamoDB.DocumentClient()

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': "Content-Type,Authorization,authorization",
  "Access-Control-Allow-Methods": "GET"
}

// Returns all open orders
const getOrders = async (userId) => {
  const params = {
    TableName: process.env.TableName,
    IndexName: 'GSI-userId',
    KeyConditionExpression: 'USERID = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: true,
    ProjectionExpression: "PK, SK, orderNumber, robot, drinkOrder, ORDERSTATE, TS"
  }

  const result = await documentClient.query(params).promise()
  console.log('getOrders: ', result)
  return result.Items
}

// Returns list of all orders, filtered by state
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  const userId = event.requestContext.authorizer.jwt.claims.sub
  const result = await getOrders(userId)

  return {
    headers,
    "statusCode": 200,
    "body": JSON.stringify({ result }),
    "isBase64Encoded": false
  }
}
