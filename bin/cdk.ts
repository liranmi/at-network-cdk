#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NaclStack } from '../lib/stacks/nacl-stack';
import { naclConfigs } from '../config/nacl';
import { devVpcConfig } from '../config/vpc';
import { VpcStack } from '../lib/stacks/vpc-stack';

const app = new cdk.App();

// Create the VPC stack with the VPC from main stack
const mainVpcStack = new VpcStack(app, 'VpcStack', {
  vpcConfig: devVpcConfig
});

// Create the NACL stack with the VPC from main stack
new NaclStack(app, 'NaclStack', {
  vpc: mainVpcStack.vpc,
  naclConfigs
});