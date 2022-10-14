/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const { nanoid } = require('nanoid')
const { getConfig, getItem, saveItem } = require('./ddb')

const TIME_INTERVAL = (5 * 60 * 1000)
const NANO_ID_CODE_LENGTH = process.env.CodeLength

const isAdmin = (requestContext) => {
  try {
    const groups = requestContext.authorizer.claims['cognito:groups'].replace('[','').replace(']','').split(',')
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
    console.log('NOT ADMIN - exiting')
    return {
      "statusCode": 403
    }
  }

  // Check eventId parameter exists
  if (!event.queryStringParameters?.eventId) {
    return {
      "statusCode": 400
    }
  }

  // Load config from event ID
  const eventId = event.queryStringParameters?.eventId
  const eventConfigArray = await getConfig(eventId)
  if (eventConfigArray.length === 0) {
    console.log('No matching event ID')
    return {
      "statusCode": 400,
      "statusMessage": "No matching event ID"
    }
  }
  const eventConfig = eventConfigArray[0]
  console.log('Config', { eventConfig} )
  const availableTokens = eventConfig.drinksPerBarcode

  // Start generating the token
  let bucket = {}
  const CURRENT_TIME_BUCKET_ID = parseInt(Date.now() / TIME_INTERVAL)
  console.log('Bucket:', CURRENT_TIME_BUCKET_ID, )

  // Load bucket from DynamoDB, if available

  const PK = `${eventId}-${CURRENT_TIME_BUCKET_ID}`
  const result = await getItem(PK)
  if ( result.Items.length != 0 ) {
    bucket = result.Items[0]
    console.log('Bucket loaded: ', bucket)
  } else {

    // No bucket info available - create new
    bucket.PK = PK
    bucket.last_id = CURRENT_TIME_BUCKET_ID
    bucket.last_code = nanoid(NANO_ID_CODE_LENGTH)
    bucket.start_ts = ( TIME_INTERVAL * CURRENT_TIME_BUCKET_ID )
    bucket.start_full = new Date(bucket.start_ts).toString()
    bucket.end_ts = ( TIME_INTERVAL * CURRENT_TIME_BUCKET_ID ) + ( TIME_INTERVAL - 1 )
    bucket.end_full = new Date(bucket.end_ts).toString()
    bucket.availableTokens = parseInt(availableTokens)
    bucket.eventId = eventId

    // Save to DDB
    console.log('New code: ', { bucket })
    await saveItem(bucket)
  }

  // Return the code
  return {
    statusCode: 200,
    body: JSON.stringify({bucket}),
    headers: {
      "Access-Control-Allow-Headers" : "*",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
    }
  }
}