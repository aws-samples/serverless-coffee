/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

'use strict'

exports.handler = async (event) => {
    console.log('Event: ', JSON.stringify(event, null, 2))

    // The first auth request for CUSTOM_CHALLENGE from the AWSMobileClient (in iOS native app) actually comes in as an "SRP_A" challenge (BUG in AWS iOS SDK), so switch to CUSTOM_CHALLENGE and clear session.
    if (event.request.session && event.request.session.length && event.request.session.slice(-1)[0].challengeName == "SRP_A") {
        console.log('New CUSTOM_CHALLENGE', JSON.stringify(event, null, 2))
        event.request.session = []
        event.response.issueTokens = false
        event.response.failAuthentication = false
        event.response.challengeName = 'CUSTOM_CHALLENGE'
    }
    // User successfully answered the challenge, succeed with auth and issue OpenID tokens
    else if (event.request.session &&
        event.request.session.length &&
        event.request.session.slice(-1)[0].challengeName === 'CUSTOM_CHALLENGE' &&
        event.request.session.slice(-1)[0].challengeResult === true) {

        console.log('The user provided the right answer to the challenge; succeed auth')
        event.response.issueTokens = true
        event.response.failAuthentication = false
    }
    // After 3 failed challenge responses from user, fail authentication
    else if (event.request.session && event.request.session.length >= 4 && event.request.session.slice(-1)[0].challengeResult === false) {
        console.log('FAILED Authentication: The user provided a wrong answer 3 times')
        event.response.issueTokens = false
        event.response.failAuthentication = true
    }
    // The user did not provide a correct answer. Present CUSTOM_CHALLENGE again
    else {
        console.log('User response incorrect: Attempt [' + event.request.session.length + ']');
        event.response.issueTokens = false
        event.response.failAuthentication = false
        event.response.challengeName = 'CUSTOM_CHALLENGE'
    }

    console.log('Output: ', JSON.stringify(event, null, 2))
    return event
}
