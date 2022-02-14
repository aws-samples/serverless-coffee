/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const documentClient = new AWS.DynamoDB.DocumentClient()

// Returns details of a Place ID where the app has user-generated content.
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  const params = {
    TableName: process.env.TableName,
    Key: {
      PK: 'orders',
      SK: event.detail.orderId,
    },
    UpdateExpression: "set TaskToken = :TaskToken, TS = :TS",
    ConditionExpression: "#userId = :userId",
    ExpressionAttributeNames:{
      "#userId": "USERID"
    },
    ExpressionAttributeValues:{
      ":TaskToken": event.detail.TaskToken,
      ":userId": event.detail.userId,
      ":TS": Date.now()
    }
  }

  console.log(params)
  const result = await documentClient.update(params).promise()
}
