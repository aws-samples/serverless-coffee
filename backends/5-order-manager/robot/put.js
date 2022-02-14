/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })

const stepFunctions = new AWS.StepFunctions()
const documentClient = new AWS.DynamoDB.DocumentClient()
const axios = require('axios')

// Cache menu contents between invocations
let menu = {}

// Update order
const updateDrinkOrder = async (record) => {
  const params = {
    TableName: process.env.TableName,
    Key: {
      PK: 'orders',
      SK: record.orderId,
    },
    UpdateExpression: "set drinkOrder = :drinkOrder, TS = :TS",
    ConditionExpression: "#userId = :userId AND attribute_exists(TaskToken)",
    ExpressionAttributeNames:{
      "#userId": "USERID"
    },
    ExpressionAttributeValues:{
      ":drinkOrder": record.drinkOrder,
      ":userId": record.userId,
      ":icon": record.icon,
      ":TS": Date.now()
    },
    ReturnValues: "ALL_NEW"
  }
  console.log('updateDrinkOrder: ', params)
  const result = await documentClient.update(params).promise()
  console.log(result)
  return result
}

// Update Step Functions workflow
const sendTaskSuccess = async(orderId, TaskToken) => {
  const sfnParams = {
    taskToken: TaskToken,
    output: JSON.stringify({ orderId })
  }
  console.log ('sendTaskSuccess: ', { sfnParams })
  const sfnResult = await stepFunctions.sendTaskSuccess(sfnParams).promise()
  console.log('sendTaskSuccess: ', { sfnResult })
  return sfnResult
}

// Returns list of open orders, sorted by time
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  let record ={}
  record.orderId = event.orderId,
  record.userId = event.userId

  let result = {}
  console.log(record)

  // Drink update
  record.drinkOrder = {
    drink: event.body.drink,
    icon: event.body.icon,
    modifiers: event.body.modifiers
  }

  // Update the order
  try {
    result = await updateDrinkOrder(record)
  } catch (err) {
    return console.log("Workflow not ready yet.")
  }

  try {
    // Update Step Functions with task token
    if (result.Attributes.TaskToken) {
      const sfnResult = await sendTaskSuccess(record.orderId, result.Attributes.TaskToken)
      console.log({sfnResult})
    }
  } catch (err) {
    return console.error('Step Functions update error: ', err)
  }

  return true
}
