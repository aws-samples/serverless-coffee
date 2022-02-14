/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

// Environment variables
process.env.AWS_REGION = '<< ENTER REGION >>'
process.env.StateMachineArn = '<< ENTER ARN >>'

// AWS services
const AWS = require('aws-sdk')
AWS.config.update({ region: process.env.AWS_REGION })
const stepFunctions = new AWS.StepFunctions()

// Gets current number of running executions in state machine
const stopRunningExecutions = async (record) => {
  const sfnParams = {
    stateMachineArn: process.env.StateMachineArn,
    maxResults: '1000',
    statusFilter: 'RUNNING'
  }
  const sfnResult = await stepFunctions.listExecutions(sfnParams).promise()
  // console.log (JSON.stringify(sfnResult, null, 2))

  Promise.all(sfnResult.executions.map((execution) => {
    console.log('Deleting: ', execution.executionArn)
    return stepFunctions.stopExecution({ executionArn: execution.executionArn }).promise()
  }))
}

// Entry point
const main = async () => {
  console.log(await stopRunningExecutions())
}

main().catch(error => console.error(error))
