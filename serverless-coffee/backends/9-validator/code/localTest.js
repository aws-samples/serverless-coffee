/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

// Mock event
const event = require('./test/testEvent.json')

// Mock environment variables
process.env.localTest = true
process.env.AWS_REGION = '<< YOUR REGION >>'
process.env.TableName = '<< ENTER TABLE NAME >>'
// process.env.IOT_DATA_ENDPOINT = 'a2ty1m17b5znw2-ats.iot.us-east-1.amazonaws.com'
process.env.TimeInterval = 15
process.env.CodeLength = 10
process.env.TokensPerBucket = 10
process.env.BusName = 'Serverlesspresso'
process.env.Source = 'awsserverlessda.serverlesspresso'

// Lambda handler
const { handler } = require('./verifyCode')

const main = async () => {
  console.time('localTest')
  console.log(await handler(event))
  console.timeEnd('localTest')
}

main().catch(error => console.error(error))