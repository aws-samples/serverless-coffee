/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const AWS = require('aws-sdk')
AWS.config.update({region: process.env.AWS_REGION})
const cloudWatch = new AWS.CloudWatch({apiVersion: '2010-08-01'})

exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 2))

  const params = {
    MetricData: [
      {
        'MetricName': 'Order',
        'Dimensions': [
          {
            'Name': 'State',
            'Value': 'Cancelled'
          }
        ],
        Timestamp: event.time,
        'Unit': 'Count',
        'Value': 1
      }
    ],
    Namespace: `${process.env.AppName}-dev`
  }
  // Send to CloudWatch
  console.log(await cloudWatch.putMetricData(params).promise())
}
