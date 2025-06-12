import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConfig } from '../../lib/schemas/vpc';
/**
 * This is a sample VPC configuration file for the production environment.
 * This file serves as a placeholder to ensure CDK synthesis generates at least one stack.
 * 
 * IMPORTANT: This configuration should be replaced with actual production VPC settings
 * before deploying to production. The current values are minimal and not suitable
 * for production use.
 * 
 * Key points to consider when replacing this configuration:
 * - Set appropriate maxAzs (typically 2-3 for production)
 * - Configure proper subnet configurations for public/private subnets
 * - Enable NAT Gateways for private subnet internet access
 * - Consider enabling default security group restrictions
 * - Review and adjust CIDR block as needed
 */

export const prodVpcConfig: VpcConfig = {
    // VPC configuration for prod environment
    name: 'prod-vpc',
    ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    maxAzs: 0,
    natGateways: 0,
    subnetConfigs: [],
    restrictDefaultSecurityGroup: false,
    version: "v1"
};