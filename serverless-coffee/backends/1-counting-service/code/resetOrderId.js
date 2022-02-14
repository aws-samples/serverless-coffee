/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const documentClient = new AWS.DynamoDB.DocumentClient()

// Reset order ID counter
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  await documentClient.update({
    TableName: process.env.TableName,
    Key: {
      PK: 'orderID'
    },
    UpdateExpression: "set IDvalue = :val",
    ExpressionAttributeValues:{
      ":val": 0
    }
  }).promise()
}
