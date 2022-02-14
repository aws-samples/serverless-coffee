/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const documentClient = new AWS.DynamoDB.DocumentClient()

// Returns config from DynamoDB table
const getConfigFromDDB = async (record) => {
  const result = await documentClient.scan({
    TableName: process.env.TableName,
  }).promise()

  console.log('getConfigFromDDB: ', JSON.stringify(result, null, 0) )

  return result.Items.map((item) => ({ topic: item.PK, ...item }))
}

// Returns application config
exports.handler = async (event) => {
  console.log('Handler: ', event)
  const config = await getConfigFromDDB ()
  return {
    "statusCode": 200,
    "body": JSON.stringify(config),
    "isBase64Encoded": false
  }
}
