/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })

const documentClient = new AWS.DynamoDB.DocumentClient()
const MAX_ITEMS = 100

const isAdmin = (requestContext) => {
  try {
    const groups = requestContext.authorizer.jwt.claims['cognito:groups'].replace('[','').replace(']','').split(',')
    return groups.includes('admin')
  } catch (err) {
    return false
  }
}

// Returns all open orders
const getOrders = async (filters) => {
  const params = {
    TableName: process.env.TableName,
    IndexName: 'GSI-status',
    KeyConditionExpression: 'ORDERSTATE = :key',
    ExpressionAttributeValues: {
      ':key': filters.state
    },
    ScanIndexForward: true,
    Limit: filters.maxItems,
    ProjectionExpression: "PK, SK, orderNumber, robot, drinkOrder, TS, userId, baristaUserId"
  }

  const result = await documentClient.query(params).promise()
  console.log('getOrders: ', result)
  return result.Items
}

// Returns list of all orders, filtered by state
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  // If not an admin user, exit
  if (!isAdmin(event.requestContext)) {
    return {
      "statusCode": 403
    }
  }

  // Get list of orders
  const filters = {
    state: event.queryStringParameters.state,
    maxItems: ( event.queryStringParameters.maxItems || MAX_ITEMS )
  }

  const result = await getOrders(filters)

  // Return to client
  return {
    "statusCode": 200,
    "body": JSON.stringify({ result }),
    "isBase64Encoded": false
  }
}
