#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/stacks/cdk-stack';
import { NaclStack } from '../lib/stacks/nacl-stack';
import { naclConfigs } from '../config/nacl';
import { config } from '../config';

const app = new cdk.App();

// Create the main stack with VPC
const mainStack = new CdkStack(app, 'CdkStack', {
  appConfig: config
});

// Create the NACL stack with the VPC from main stack
new NaclStack(app, 'NaclStack', {
  vpc: mainStack.vpc,
  naclConfigs
});