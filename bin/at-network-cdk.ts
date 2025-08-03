#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { vpcConfigs, EnvName, securityGroupConfigs } from '../network-config';
import { AT_NETWORK_L2_VERSION, environmentConfig } from '../environment-config';
import { SecurityGroupStack } from '../lib/stacks/security-group-stack';
import { SecurityGroupTwoPhaseProcessor } from '../lib/stacks/security-group-two-phase-processor';
import * as crypto from 'crypto';

const app = new cdk.App();

// Function to generate unique stack name with SHA suffix
function generateUniqueStackName(baseName: string, envName: string, env: { account?: string; region?: string }): string {
  const uniqueString = `${baseName}-${envName}-${env.account || 'no-account'}-${env.region || 'no-region'}`;
  const hash = crypto.createHash('sha256').update(uniqueString).digest('hex').substring(0, 8);
  return `${baseName}-${hash}`;
}

// Use the TypeScript environment config
const cfg = environmentConfig;

// Add global tags to all resources in the app if they exist
if (cfg.globalTags) {
  Object.entries(cfg.globalTags).forEach(([key, value]) => {
    cdk.Tags.of(app).add(key, value);
  });
}

// Iterate through all environments
Object.entries(cfg.environments).forEach(([envName, envConfig]) => {
  const { account, region } = envConfig;

  // Convert null values to undefined for CDK environment
  const env = {
    account: account ?? undefined,
    region: region ?? undefined
  };

  cdk.Annotations.of(app).addInfo(`DeploymentType: ${envName} env: ${JSON.stringify(env)}`);

  const vpcConfig = vpcConfigs[envName as EnvName];

  // Validate that VPC configuration exists (required)
  if (!vpcConfig) {
    const errorMsg = `Missing VPC configuration for environment '${envName}'. Please ensure network-config/${envName}/vpc configuration is properly defined.`;
    cdk.Annotations.of(app).addError(errorMsg);
    throw new Error(errorMsg);
  }

  // Validate configuration versions
  if (vpcConfig.version !== AT_NETWORK_L2_VERSION) {
    const errorMsg = `VPC configuration version mismatch. Expected ${AT_NETWORK_L2_VERSION}, got ${vpcConfig.version}`;
    cdk.Annotations.of(app).addError(errorMsg);
    throw new Error(errorMsg);
  }

  const securityGroupConfig = securityGroupConfigs[envName as EnvName];

  if (securityGroupConfig && securityGroupConfig.version !== AT_NETWORK_L2_VERSION) {
    throw new Error(`Security Group configuration version mismatch. Expected ${AT_NETWORK_L2_VERSION}, got ${securityGroupConfig.version}`);
  }

  // Create synthesizer with default settings, allowing override from config
  const synthesizer = new cdk.DefaultStackSynthesizer({
    fileAssetsBucketName: envConfig.synthesizer?.fileAssetsBucketName,
    bucketPrefix: envConfig.synthesizer?.bucketPrefix,
    generateBootstrapVersionRule: false,
  });

  cdk.Annotations.of(app).addInfo(`Using synthesizer: ${synthesizer.constructor.name}`);
  if (envConfig.synthesizer?.fileAssetsBucketName) {
    cdk.Annotations.of(app).addInfo(`Using custom file assets bucket: ${envConfig.synthesizer.fileAssetsBucketName}`);
  }

  // Create the VPC stack with the VPC from main stack
  const mainVpcStack = new VpcStack(app, envConfig.stackNames?.vpcStack || generateUniqueStackName('VpcStack', envName, env), {
    vpcConfig,
    env,
    synthesizer
  });

  // Only create SecurityGroupStack if config exists
  let securityGroupStack: SecurityGroupStack | SecurityGroupTwoPhaseProcessor | undefined;
  if (securityGroupConfig && securityGroupConfig.securityGroups.length > 0) {
    // Check if we should use two-phase processing
    // This can be determined by checking if there are L1 rules that reference other security groups
    const hasCrossStackL1Rules = securityGroupConfig.securityGroups.some(sg => {
      return (sg.l1Ingress && sg.l1Ingress.some(rule => rule.sourceSecurityGroupId)) ||
        (sg.l1Egress && sg.l1Egress.some(rule => rule.destinationSecurityGroupId));
    });

    if (hasCrossStackL1Rules) {
      // Use the new two-phase processor
      securityGroupStack = new SecurityGroupTwoPhaseProcessor(app, envConfig.stackNames?.securityGroupStack || generateUniqueStackName('SecurityGroupTwoPhaseProcessor', envName, env), {
        vpc: mainVpcStack.vpc,
        securityGroupsConfig: securityGroupConfig,
        env,
        synthesizer
      });

      cdk.Annotations.of(app).addInfo(`Using two-phase security group processing for environment '${envName}' (detected cross-stack L1 rules)`);
    } else {
      // Use the original single-phase stack (backward compatibility)
      securityGroupStack = new SecurityGroupStack(app, envConfig.stackNames?.securityGroupStack || generateUniqueStackName('SecurityGroupStack', envName, env), {
        vpc: mainVpcStack.vpc,
        securityGroupsConfig: securityGroupConfig,
        env,
        synthesizer
      });

      cdk.Annotations.of(app).addInfo(`Using single-phase security group processing for environment '${envName}'`);
    }
  } else {
    cdk.Annotations.of(app).addInfo(`No security group configuration found for environment '${envName}' - skipping SecurityGroupStack creation`);
  }

  // Add environment-specific tags to all resources in this environment if they exist
  if (envConfig.tags) {
    Object.entries(envConfig.tags).forEach(([key, value]) => {
      cdk.Tags.of(mainVpcStack).add(key, value);
      if (securityGroupStack) {
        cdk.Tags.of(securityGroupStack).add(key, value);
      }
    });
  }
});