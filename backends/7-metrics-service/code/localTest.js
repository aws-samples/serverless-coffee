/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

// Mock event
const event = require('./test/OrderManager.WaitingCompletion.json')

// Mock environment variables
process.env.localTest = true
process.env.AWS_REGION = '<< YOUR REGION >>'

process.env.BusName = 'default'
process.env.AppName = 'Serverlesspresso'
process.env.Source = 'awsserverlessda.serverlesspresso'

// Lambda handler
const { handler } = require('./OrderManagerWaitingCompletion')

const main = async () => {
  console.time('localTest')
  console.log(await handler(event))
  console.timeEnd('localTest')
}

main().catch(error => console.error(error))