/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

// Mock event
const event = require('./test/orderProcessor.orderStarted.json')

// Mock environment variables
process.env.localTest = true
process.env.AWS_REGION = '<< YOUR REGION >>'
process.env.TableName = '<< YOUR TABLE NAME >>'
process.env.IOT_DATA_ENDPOINT = '<< YOUR ENDPOINT >>'

process.env.IOT_TOPIC = "serverlesspresso-admin"
process.env.BusName = 'default'
process.env.Source = 'awsserverlessda.serverlesspresso'

// Lambda handler
const { handler } = require('./publishToIOT')

const main = async () => {
  console.time('localTest')
  console.log(await handler(event))
  console.timeEnd('localTest')
}

main().catch(error => console.error(error))