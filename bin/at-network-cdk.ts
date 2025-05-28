#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { TaggingAspect } from '../aspects/tagging-aspect';
import { vpcConfigs, EnvName, securityGroupConfigs } from '../network-config';
import { environmentConfig } from '../environment-config';

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

  // apply your tags as before
  /*   if (cfg.tags) {
      for (const [k, v] of Object.entries(cfg.tags)) {
        Aspects.of(app).add(new TaggingAspect(k, v), { priority: 100 });
      }
    } */

  console.info(`DeploymentType: ${envName} env: ${JSON.stringify(env)}`);

  const vpcConfig = vpcConfigs[envName as EnvName];
  const securityGroupConfig = securityGroupConfigs[envName as EnvName];

  // Create the VPC stack with the VPC from main stack
  const mainVpcStack = new VpcStack(app, `VpcStack-${envName}`, {
    vpcConfig,
    env
  });

  // Create the NACL stack with the VPC from main stack
  /* new NaclStack(app, `NaclStack-${envName}`, {
    vpc: mainVpcStack.vpc,
    naclConfigs,
    env
  }); */
});