/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

"use strict"

const crypto_secure_random_digit = require("crypto-secure-random-digit")
const AWS = require("aws-sdk")
const sns = new AWS.SNS()

const TEXT_MSG = "[Serverlesspresso] Your registration code is: "

// Lambda handler
exports.handler = async (event = {}) => {
  console.log("Event: ", JSON.stringify(event, null, 2))

  let passCode
  const phoneNumber = event.request.userAttributes.phone_number

  if (
    (event.request.session &&
      event.request.session.length &&
      event.request.session.slice(-1)[0].challengeName == "SRP_A") ||
    event.request.session.length == 0
  ) {
    passCode = crypto_secure_random_digit.randomDigits(6).join("")
    await sendSMSviaSNS(phoneNumber, passCode)
  } else {
    const previousChallenge = event.request.session.slice(-1)[0]
    passCode = previousChallenge.challengeMetadata.match(/CODE-(\d*)/)[1]
  }

  event.response.publicChallengeParameters = {
    phone: event.request.userAttributes.phone_number,
  }
  event.response.privateChallengeParameters = { passCode }
  event.response.challengeMetadata = `CODE-${passCode}`

  console.log("Output: ", JSON.stringify(event, null, 2))
  return event
}

// Send one-time password via SMS
async function sendSMSviaSNS(phoneNumber, passCode) {
  const params = {
    Message: `${TEXT_MSG} ${passCode}`,
    PhoneNumber: phoneNumber,
  }
  const result = await sns.publish(params).promise()
  console.log("SNS result: ", result)
}
