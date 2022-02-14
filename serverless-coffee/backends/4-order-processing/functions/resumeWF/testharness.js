/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

// Mock event
const event = require('./events/testEvent.json')
// Mock environment variables
const environmentVars = require('../env.json')
process.env.AWS_REGION = environmentVars.AWS_REGION
process.env.localTest = true
// Lambda handler
const { handler } = require('./app')
const main = async () => {
  console.time('localTest')
  console.dir(await handler(event))
  console.timeEnd('localTest')
}
main().catch(error => console.error(error))