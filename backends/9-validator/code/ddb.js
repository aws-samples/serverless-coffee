/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const AWS = require('aws-sdk')
AWS.config.update({region: process.env.AWS_REGION})
const documentClient = new AWS.DynamoDB.DocumentClient()


const getConfig = async (id) => {
  const PKvalue = `config-${id}`
  const params = {
    TableName: process.env.ConfigTableName,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: {
      "#pk": "PK"
    },
    ExpressionAttributeValues: {
      ":pk": PKvalue
    }
  }
  console.log('getConfig params: ', params)

  try {
    const result = await documentClient.query(params).promise()
    console.log('getConfig result: ', result.Items)
    return result.Items
  } catch (err) {
    console.error('getConfig error: ', err)
  }
}

const getItem = async (id) => {
  const params = {
    TableName: process.env.TableName,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: {
      "#pk": "PK"
    },
    ExpressionAttributeValues: {
      ":pk": id
    }
  }
  console.log('getItem params: ', params)

  try {
    const result = await documentClient.query(params).promise()
    console.log('getItem result: ', result)
    return result
  } catch (err) {
    console.error('getItem error: ', err)
  }
}

const saveItem = async (record) => {
  const Item = {
    PK: record.PK,
    ...record
  }
  console.log(Item)
  const result = await documentClient.put({
    TableName: process.env.TableName,
    Item
  }).promise()
  console.log('saveItem: ', result)
}

const decrementToken = async (record) => {
  const params = {
    TableName: process.env.TableName,
    Key: {
      PK: record.PK
    },
    UpdateExpression: "set availableTokens = availableTokens - :val",
    ExpressionAttributeValues:{
      ":val": 1
    },
    ReturnValues:"UPDATED_NEW"
  }
  console.log(params)
  const result = await documentClient.update(params).promise()
  console.log('decrementToken: ', result)
}

module.exports = { getConfig, saveItem, getItem, decrementToken }