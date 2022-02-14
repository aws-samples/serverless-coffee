/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

// Mock environment variables
process.env.localTest = true
process.env.AWS_REGION = '<< YOUR REGION >>'
process.env.TableName = '<< YOUR TABLE NAME >>'
process.env.StateMachineArn = '<< YOUR ARN >>'
process.env.MaxQueueCapacity = 50

// Lambda handler
const { handler } = require('./isCapacityAvailable')

const main = async () => {
  console.time('localTest')
  console.log(await handler({}))
  console.timeEnd('localTest')
}

main().catch(error => console.error(error))