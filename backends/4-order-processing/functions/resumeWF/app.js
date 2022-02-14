/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

 const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': "Content-Type,Authorization,authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
  }

 const aws = require('aws-sdk');
 const stepfunctions = new aws.StepFunctions();

exports.handler = async (event, context) => {

    console.log(JSON.stringify(event, null, 2))

 /*
    2.**********************************************
    Make ready the data
    **********************************************
*/
   const orderId = event.detail.orderId
   const TaskToken = event.detail.TaskToken
 /*
    2.**********************************************
    RESUME SFN WF (ORDER SERICE)
    **********************************************
*/
    var params = {
        output: JSON.stringify({"orderId":orderId}),
        taskToken: TaskToken
    }

    try {
        const res = await stepfunctions.sendTaskSuccess(params).promise()
    }catch(err){
        console.error(err)
    }

 /*
    3.**********************************************
    RETURN Success
    **********************************************
*/
    return {
        statusCode: 200,
        body: JSON.stringify({success:true}),
        headers,
    }
  }
