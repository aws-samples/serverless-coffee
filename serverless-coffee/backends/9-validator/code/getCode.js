/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const { nanoid } = require('nanoid')
const { getItem, saveItem } = require('./ddb')

const TIME_INTERVAL = (process.env.TimeInterval * 60 * 1000)
const NANO_ID_CODE_LENGTH = process.env.CodeLength
const AVAILABLE_TOKENS = process.env.TokensPerBucket

const isAdmin = (requestContext) => {
  try {
    const groups = requestContext.authorizer.jwt.claims['cognito:groups'].replace('[','').replace(']','').split(',')
    return groups.includes('admin')
  } catch (err) {
    return false
  }
}

// Returns details of a Place ID where the app has user-generated content.
exports.handler = async (event) => {
  console.log(JSON.stringify(event, null, 0))

  // If not an admin user, exit
  if (!isAdmin(event.requestContext)) {
    return {
      "statusCode": 403
    }
  }

  let bucket = {}
  const CURRENT_TIME_BUCKET_ID = parseInt(Date.now() / TIME_INTERVAL)
  console.log('Bucket:', CURRENT_TIME_BUCKET_ID, )

  // Load bucket from DynamoDB, if available
  const result = await getItem(CURRENT_TIME_BUCKET_ID)
  if ( result.Items.length != 0 ) {
    bucket = result.Items[0]
    console.log('Bucket loaded: ', bucket)
  } else {

    // No bucket info available - create new
    bucket.last_id = CURRENT_TIME_BUCKET_ID
    bucket.last_code = nanoid(NANO_ID_CODE_LENGTH)
    bucket.start_ts = ( TIME_INTERVAL * CURRENT_TIME_BUCKET_ID )
    bucket.start_full = new Date(bucket.start_ts).toString()
    bucket.end_ts = ( TIME_INTERVAL * CURRENT_TIME_BUCKET_ID ) + ( TIME_INTERVAL - 1 )
    bucket.end_full = new Date(bucket.end_ts).toString()
    bucket.availableTokens = parseInt(AVAILABLE_TOKENS)

    // Save to DDB
    console.log('New code: ', { bucket })
    await saveItem(bucket)
  }

  // Return the code
  return {
    statusCode: 200,
    body: JSON.stringify({bucket})
  }
}