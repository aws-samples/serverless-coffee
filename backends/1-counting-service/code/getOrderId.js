/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const documentClient = new AWS.DynamoDB.DocumentClient()

// Increments the order ID count in the DynamoDB table
const incrementCount = async (record) => {
  const params = {
    TableName: process.env.TableName,
    Key: {
      PK: 'orderID'
    },
    UpdateExpression: "set IDvalue = IDvalue + :val",
    ExpressionAttributeValues:{
      ":val": 1
    },
    ReturnValues:"UPDATED_NEW"
  }
  const result = await documentClient.update(params).promise()
  console.log('incrementCount: ', result.Attributes.IDvalue)
  return result.Attributes.IDvalue
}

// Returns details of a Place ID where the app has user-generated content.
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))
  const orderNumber = await incrementCount ()
  return { orderNumber  }
}
