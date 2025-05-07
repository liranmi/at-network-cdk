#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Aspects } from 'aws-cdk-lib';
import { NaclStack } from '../lib/stacks/nacl-stack';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { TaggingAspect } from '../aspects/tagging-aspect';
import * as fs from 'fs';
import { vpcConfigs, naclConfigsByEnv, EnvName } from '../network-config';
import { NaclConfig } from '../lib/types/v1/nacl';

const app = new cdk.App();

// load and validate environment‐config.json
const raw = fs.readFileSync('environment-config.json', 'utf8');
const cfg = JSON.parse(raw) as {
  environment: string;
  environments: Record<string, { account: string; region: string }>;
  tags?: Record<string, string>;
};

if (!cfg.environments[cfg.environment]) {
  throw new Error(`Unknown environment "${cfg.environment}" in config`);
}
type E = EnvName;  // 'dev'|'test'|'prod'
const envName = cfg.environment as E;
const { account, region } = cfg.environments[envName];

// apply your tags as before
if (cfg.tags) {
  for (const [k, v] of Object.entries(cfg.tags)) {
    Aspects.of(app).add(new TaggingAspect(k, v), { priority: 100 });
  }
}

const env = { account, region };

const vpcConfig = vpcConfigs[envName];
const naclConfigs = naclConfigsByEnv[envName] as NaclConfig[];


// Create the VPC stack with the VPC from main stack
const mainVpcStack = new VpcStack(app, 'VpcStack', {
  vpcConfig,
  env
});

// Create the NACL stack with the VPC from main stack
new NaclStack(app, 'NaclStack', {
  vpc: mainVpcStack.vpc,
  naclConfigs,
  env
});