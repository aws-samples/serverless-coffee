# Serverlesspresso - A serverless coffee ordering workload.

This repo provides the code for a serverless coffee bar exhibit, first seen at AWS re:Invent 2021. This consists of three frontend applications (not included) and various backend microservices. This README explains the  process to completely install all the various components.



```bash
.
├── README.MD           <-- This instructions file
├── backends            <-- Source code for the applicaiotn microservices and resources
├── 001-appCore         <-- Source code template for backend resources
├── 00-baseCore         <-- Source code for application Core (event bus and config tables)
```

To see the Serverlesspresso workshop, visit: https://workshop.serverlesscoffee.com/.
In this workshop, you will deploy a serverless backend that supports a pop-up coffee shop. You will then test your application using 3 front-end applications that are provided.


## Installing the backend

For all of the deployments, use `us-east-1` for Region when prompted.

### 1. Installing the core stack

This create a custom event bus, custom SMS auth flow for Cognito signin, and other foundational resources used by other services.

1. From the command line, install the realtime messaging stack:
```
cd /00-baseCore
sam build
sam deploy --guided
```
During the prompts, enter `serverlesspresso-core` for the Stack Name, `core` for Service, and accept the defaults for the remaining questions.

2. After installation, note the outputs section, which provides the UserPoolID, bus name and ARN, IoT endpoint, and user pool client name. These outputs are also stored in [AWS Systems Manager Parameter Store](https://console.aws.amazon.com/systems-manager/parameters/) for the subsequent SAM stacks to use.

### 2. Install microservices

```
cd /01-appCore
sam build
sam deploy --guided
```
During the prompts, enter `serverlesspresso` for the Stack Name.

## Cleaning up

1. Navigate to the AWS CloudFormation console.
2. Delete each stack that starts with `serverlesspresso`.

## Next steps
If you have any questions, please contact the author or raise an issue in the GitHub repo.

Important: this application uses various AWS services and there are costs associated with these services after the Free Tier usage - please see the [AWS Pricing page](https://aws.amazon.com/pricing/) for details. You are responsible for any AWS costs incurred. No warranty is implied in this example.


==============================================


Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0
