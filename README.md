# Serverlesspresso - A serverless coffee ordering workload.

This repo provides the code for a serverless coffee bar exhibit, as seen at AWS re:Invent 2021. This consists of three frontend applications and various backend microservices. This README explains the  process to completely install all the various components.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.

```bash
.
├── README.MD       <-- This instructions file
├── backends        <-- Source code for backend applications
├── frontends       <-- Source code for frontend applications
```

## Requirements

* AWS CLI already configured with Administrator permission
* [AWS SAM CLI installed](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) - **minimum version 0.48**.
* [NodeJS 14.x installed](https://nodejs.org/en/download/)
* [Vue.js and Vue CLI installed](https://vuejs.org/v2/guide/installation.html)

## Installing the backend

For all of the deployments, use `us-east-1` for Region when prompted.

### 1. Installing the core stack

This create a custom event bus, custom SMS auth flow for Cognito signin, and other foundational resources used by other services.

1. From the command line, install the realtime messaging stack:
```
cd backends/0-core
sam build
sam deploy --guided
```
During the prompts, enter `serverlesspresso-core` for the Stack Name, `core` for Service, and accept the defaults for the remaining questions.

2. After installation, note the outputs section, which provides the UserPoolID, bus name and ARN, IoT endpoint, and user pool client name. These outputs are also stored in [AWS Systems Manager Parameter Store](https://console.aws.amazon.com/systems-manager/parameters/) for the subsequent SAM stacks to use.

### 2. Install base microservices

1. To install the counting service:
```
cd ../1-counting-service
sam deploy --guided
```
During the prompts, enter `serverlesspresso-counting-service` for the Stack Name, `counting` for Service, and accept the defaults for the remaining questions.

2. To install the config service:
```
cd ../2-config-service
sam deploy --guided
```
During the prompts:
- Enter `serverlesspresso-config-service` for the Stack Name
- For `OpenConfigFunction may not have authorization defined, Is this okay?`, enter Y.
- Accept the defaults for the remaining questions.

2. To install the capacity service:
```
cd ../3-capacity-service
sam deploy --guided
```

During the prompts, enter `serverlesspresso-config-capacity` for the Stack Name and accept the defaults for the remaining questions.

### 3. Install the order processor

To install, run:
```
cd ../4-order-processing
sam build
sam deploy --guided
```
During the prompts, enter `serverlesspresso-order-processor` for the Stack Name and accept the defaults for the remaining questions.

2. Using the StateMachineArn output from this stack, update the environment variable for the IsCapacityAvailableFunction above:

```
aws lambda update-function-configuration --region us-east-1 --function-name *EnterFunctionName* --environment Variables="{StateMachineArn=enterStateMachineARN}"
```

### 4. Install order manager

From the command line, install the realtime messaging stack:
```
cd ../5-order-manager
sam build
sam deploy --guided
```
During the prompts, enter `serverlesspresso-order-manager` for the Stack Name and accept the defaults for the remaining questions.

### 5. Install final microservices

1. From the command line, install the publisher service:
```
cd ../6-publisher-service
sam deploy --guided
```
During the prompts, enter `serverlesspresso-publisher` for the Stack Name and accept the defaults for the remaining questions.

2. From the command line, install the publisher service:
```
cd ../7-metrics-service
sam deploy --guided
```
During the prompts, enter `serverlesspresso-metrics` for the Stack Name and accept the defaults for the remaining questions.

3. From the command line, install the publisher service:
```
cd ../8-order-journey
sam deploy --guided
```
During the prompts, enter `serverlesspresso-order-journey` for the Stack Name and accept the defaults for the remaining questions.

### 6. Install the validator microservice

1. From the command line, install the realtime messaging stack:
```
cd ../9-validator
sam build
sam deploy --guided
```
During the prompts, enter `serverlesspresso-validator` for the Stack Name, enter `us-east-1` for Region, and accept the defaults for the remaining questions.

## Installing the frontends

The frontend code is saved in the `frontends` subdirectory. There are three applications:
* vue-barista-app: Used by the barista to produce and cancel drink orders
* vue-display-app: A display application that shows the upcoming list of drinks and completed orders.
* vue-order-app: Used by customers to place orders and get notifications when drinks are made or canceled.

To run each of these applications:
1. Change directory into the application you want to run.
2. Before running, you need to set environment variables in the `src\main.js` file for each application. These are marked with `<< ENTER YOUR VALUE >>`. These are the values shown in the outputs from the backend installation and are unique to your deployments.
3. Install the npm packages required:
```
npm install
```
4. After installation is complete, you can run the application locally:
```
npm run serve
```

You can optionally use [AWS Amplify Console](https://console.aws.amazon.com/amplify/home) to deploy these applicaitons automatically for public access.

## Cleaning up

1. Navigate to the AWS CloudFormation console.
2. Delete each stack that starts with `serverlesspresso`.

## Next steps

In 2022, the DA team will be producing a workshop and blog content walking through the services and features used to build Serverlesspresso.

If you have any questions, please contact the author or raise an issue in the GitHub repo.


==============================================

Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0