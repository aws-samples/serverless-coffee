/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })

const documentClient = new AWS.DynamoDB.DocumentClient()
const stepFunctions = new AWS.StepFunctions()

// Returns details of a Place ID where the app has user-generated content.
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  const params = {
    TableName: process.env.TableName,
    Key: {
      PK: 'orders',
      SK: event.detail.orderId,
    },
    UpdateExpression: "set drinkOrder = :drinkOrder, TS = :TS",
    ConditionExpression: "#userId = :userId",
    ExpressionAttributeNames:{
      "#userId": "USERID"
    },
    ExpressionAttributeValues:{
      ":drinkOrder": event.detail.drink,
      ":userId": event.detail.userId,
      ":TS": Date.now()
    },
    ReturnValues: "ALL_NEW"
  }

  console.log(params)
  const result = await documentClient.update(params).promise()
  console.log(result)

  // Update Step Functions workflow
  const sfnParams = {
    taskToken: result.Attributes.TaskToken,
    output: JSON.stringify({'orderId': event.detail.orderId})
  }
  console.log ({ sfnParams })
  const sfnResult = await stepFunctions.sendTaskSuccess(sfnParams).promise()
  console.log({ sfnResult })
}
