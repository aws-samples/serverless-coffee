/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const documentClient = new AWS.DynamoDB.DocumentClient()

// Returns details of a Place ID where the app has user-generated content.
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))
  
    const params ={
    TableName: process.env.TableName,
    Item: {
      PK: 'orders',
      SK: event.detail.orderId,
      USERID: event.detail.userId,
      ORDERSTATE: event.detail.eventId+'-CREATED',
      TaskToken: event.detail.TaskToken,
      robot: (event.detail.robot || false),
      TS: Date.now()
    }
  }

  console.log(params)
  const result = await documentClient.put(params).promise()
}
