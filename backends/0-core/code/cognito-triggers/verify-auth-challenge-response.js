/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

"use strict"

exports.handler = async (event) => {
  console.log("Event: ", JSON.stringify(event, null, 2))

  let expectedAnswer = event.request.privateChallengeParameters.passCode || null

  if (event.request.challengeAnswer === expectedAnswer) {
    event.response.answerCorrect = true
  } else {
    event.response.answerCorrect = false
  }

  console.log("Output: ", JSON.stringify(event, null, 2))
  return event
}
