#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { NaclStack } from '../lib/stacks/nacl-stack';
import { naclConfigs } from '../tests/config/examples/nacl-examples';
import { devVpcConfig } from '../tests/config/examples/vpc-examples';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { TaggingAspect } from '../aspects/tagging-aspect';
import * as fs from 'fs';
const app = new cdk.App();

// Load the environment config
const config = JSON.parse(fs.readFileSync('environment-config.json', 'utf8'));

// Dynamically iterate over the tags from config and apply each as an aspect
if (config.tags) {
  Object.entries(config.tags).forEach(([key, value]) => {
    const aspect = new TaggingAspect(key, value as string);
    // Use priority 100 to avoid conflicts with built-in aspects
    Aspects.of(app).add(aspect, { priority: 100 });
  });
}

const env = {
  account: config.account,
  region: config.region
};

// Create the VPC stack with the VPC from main stack
const mainVpcStack = new VpcStack(app, 'VpcStack', {
  vpcConfig: devVpcConfig,
  env
});

// Create the NACL stack with the VPC from main stack
new NaclStack(app, 'NaclStack', {
  vpc: mainVpcStack.vpc,
  naclConfigs,
  env
});