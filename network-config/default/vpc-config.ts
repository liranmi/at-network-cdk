import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConfig } from '../../lib/schemas/vpc';
/**
 * Default VPC configuration that serves as a base template.
 * This configuration can be extended or overridden by environment-specific configs.
 * 
 * Key points to consider when extending this configuration:
 * - Set appropriate maxAzs (typically 2-3 for production)
 * - Configure proper subnet configurations for public/private subnets
 * - Enable NAT Gateways for private subnet internet access
 * - Consider enabling default security group restrictions
 * - Review and adjust CIDR block as needed
 */

export const vpcConfig: VpcConfig = {
    name: 'vpc',
    ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    maxAzs: 0,
    natGateways: 0,
    subnetConfigs: [],
    restrictDefaultSecurityGroup: false,
    version: "v1"
}; 