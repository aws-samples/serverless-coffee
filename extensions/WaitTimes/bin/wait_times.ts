#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WaitTimesStack } from '../lib/wait_times_stack';

const app = new cdk.App();
new WaitTimesStack(app, 'WaitTimesExtension',);