/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

// Mock event
const event = require('./test/configChanged.json')

// Mock environment variables
process.env.localTest = true
process.env.AWS_REGION = '<< YOUR REGION >>'
process.env.TableName = '<< YOUR TABLE NAME >>'

process.env.EventBusName = 'Serverlesspresso'
process.env.Source = 'awsserverlessda.serverlesspresso'

// Lambda handler
// const { handler } = require('./configChanged')
const { handler } = require('./isStoreOpen')

const main = async () => {
  console.time('localTest')
  console.log(await handler(event))
  console.timeEnd('localTest')
}

main().catch(error => console.error(error))