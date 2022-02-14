/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

// Mock event
const event = require('./tests/generateHtml_cancel.json')

// Mock environment variables
process.env.s3Bucket = 'serverlesspresso-order-journey-journeybucket-1lc9wg7eac1f4'

// Lambda handler
const { lambdaHandler } = require('./app.js')

const main = async () => {
  console.time('localTest')
  console.log(await lambdaHandler(event))
  console.timeEnd('localTest')
}

main().catch(error => console.error(error))