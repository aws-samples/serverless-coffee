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

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': "Content-Type,Authorization,authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT"
}

// Update order state
const updateOrderState = async (record) => {
  const params = {
    TableName: process.env.TableName,
    Key: {
      PK: 'orders',
      SK: record.orderId,
    },
    UpdateExpression: "set ORDERSTATE = orderState, TS = :TS",
    ConditionExpression: "#userId = :userId",
    ExpressionAttributeNames:{
      "#userId": "USERID"
    },
    ExpressionAttributeValues:{
      ":orderState": record.state,
      ":userId": record.userId,
      ":TS": Date.now()
    },
    ReturnValues: "ALL_NEW"
  }
  console.log('updateOrderState: ', params)
  const result = await documentClient.update(params).promise()
  return result
}

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

function isEmpty(obj) {
  for(var key in obj) {
      if(obj.hasOwnProperty(key))
          return false
  }
  return true
}

const sanitizeOrder = (order) => {
  console.log('sanitizeOrder: ', order)

  let valid = true

  // Check drink.
  const result = menu.value.filter ((item) => item.drink === order.drink)
  if (result.length === 0) return false

  // Check modifiers
  console.log(JSON.stringify(result, null, 0))
  const modResult = order.modifiers.map((modifier) => {
    console.log(JSON.stringify(modifier, null, 0))

    const present = result[0].modifiers.filter((allowedModifiers) => allowedModifiers.Options.includes(modifier))
    if (present.length === 0) valid = false
  })
  console.log('sanitizeOrder: ', valid)
  // Order and modifiers both exist in the menu
  return valid
}


// Returns list of open orders, sorted by time
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  const body = JSON.parse(event.body)
  console.log({body})

  let record ={}
  record.orderId = event.pathParameters.id,
  record.userId = event.requestContext.authorizer.jwt.claims.sub
  let result = {}
  console.log(record)

  // Cache menu
  if (isEmpty(menu)) {
    console.log('Caching menu from: ', process.env.ConfigURL)
    const result = await axios({method: 'get', url: `${process.env.ConfigURL}/config`})
    const item = result.data.filter((item) => (item.topic === "menu"))
    menu = item[0]
  }

  // Order state update
  if (body.state) {
    record.state = body.state
    result = await updateOrderState(record)
  }

  // Drink update
  if (body.drink) {

    // Ensure that the user-supplied drink order matches the menu
    if (sanitizeOrder({drink: body.drink, modifiers: body.modifiers}) === false) {
      return {
        headers,
        "statusCode": 400,
        "body": JSON.stringify("Order is not valid."),
        "isBase64Encoded": false
      }
    }

    record.drinkOrder = {
      drink: body.drink,
      icon: body.icon,
      modifiers: body.modifiers
    }

    // Update the order
    try {
      result = await updateDrinkOrder(record)
    } catch (err) {
      return {
        headers,
        "statusCode": 409,
        "body": JSON.stringify("Workflow not ready yet."),
        "isBase64Encoded": false
      }
    }
  }

  try {
    // Update Step Functions with task token
    if (result.Attributes.TaskToken) {
      const sfnResult = await sendTaskSuccess(record.orderId, result.Attributes.TaskToken)
      console.log({sfnResult})
    }
  } catch (err) {
    console.error('Step Functions update error: ', err)
  }

  return {
    headers,
    "statusCode": 200,
    "body": JSON.stringify({ result }),
    "isBase64Encoded": false
  }
}
