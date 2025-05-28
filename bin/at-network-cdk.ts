#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { TaggingAspect } from '../aspects/tagging-aspect';
import { vpcConfigs, EnvName, securityGroupConfigs } from '../network-config';
import { AT_NETWORK_L2_VERSION, environmentConfig } from '../environment-config';
import { SecurityGroupStack } from '../lib/stacks/security-group-stack';

const app = new cdk.App();

// Use the TypeScript environment config
const cfg = environmentConfig;

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
});