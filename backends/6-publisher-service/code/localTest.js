/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

// Mock event
const event = require('./test/testEvent.json')

// Mock environment variables
process.env.localTest = true
process.env.AWS_REGION = 'us-east-1'
process.env.IOT_DATA_ENDPOINT = 'anput1xffmgcz.iot.us-east-1.amazonaws.com'
process.env.IOT_TOPIC = "serverlesspresso-config"

// Lambda handler
const { handler } = require('./publishToIOT')

const main = async () => {
  console.time('localTest')
  console.log(await handler(event))
  console.timeEnd('localTest')
}

main().catch(error => console.error(error))