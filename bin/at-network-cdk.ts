#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { vpcConfigs, EnvName, securityGroupConfigs } from '../network-config';
import { AT_NETWORK_L2_VERSION, environmentConfig } from '../environment-config';
import { SecurityGroupStack } from '../lib/stacks/security-group-stack';

const app = new cdk.App();

// Use the TypeScript environment config
const cfg = environmentConfig;

// Add global tags to all resources in the app
Object.entries(cfg.globalTags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});

// Iterate through all environments
Object.entries(cfg.environments).forEach(([envName, envConfig]) => {
  const { account, region } = envConfig;

  // Convert null values to undefined for CDK environment
  const env = {
    account: account ?? undefined,
    region: region ?? undefined
  };

  console.info(`DeploymentType: ${envName} env: ${JSON.stringify(env)}`);

  const vpcConfig = vpcConfigs[envName as EnvName];
  const securityGroupConfig = securityGroupConfigs[envName as EnvName];

  // Validate configuration versions
  if (vpcConfig.version !== AT_NETWORK_L2_VERSION) {
    throw new Error(`VPC configuration version mismatch. Expected ${AT_NETWORK_L2_VERSION}, got ${vpcConfig.version}`);
  }

  if (securityGroupConfig.version !== AT_NETWORK_L2_VERSION) {
    throw new Error(`Security Group configuration version mismatch. Expected ${AT_NETWORK_L2_VERSION}, got ${securityGroupConfig.version}`);
  }

  // Create the VPC stack with the VPC from main stack
  const mainVpcStack = new VpcStack(app, `VpcStack-${envName}`, {
    vpcConfig,
    env
  });

  const securityGroupStack = new SecurityGroupStack(app, `SecurityGroupStack-${envName}`, {
    vpc: mainVpcStack.vpc,
    securityGroupsConfig: securityGroupConfig,
    env
  });

  // Add environment-specific tags to all resources in this environment
  Object.entries(envConfig.tags).forEach(([key, value]) => {
    cdk.Tags.of(mainVpcStack).add(key, value);
    cdk.Tags.of(securityGroupStack).add(key, value);
  });
});