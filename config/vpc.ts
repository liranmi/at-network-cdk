import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConfig } from '../lib/types/vpc';

/**
 * Base VPC configuration with common settings.
 * Can be extended or overridden by environment-specific configs.
 */
const baseVpcConfig: Partial<VpcConfig> = {
    enableDnsHostnames: true,
    enableDnsSupport: true,
    instanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
    maxAzs: 2,
};

/**
 * Development VPC configuration (CIDR-based).
 * Extends the base configuration.
 */
export const devVpcConfig: VpcConfig = {
    ...baseVpcConfig,
    cidrBlock: '10.0.0.0/16',
    tags: [
        { key: 'Environment', value: 'dev' },
        { key: 'Project', value: 'my-project' },
    ],
};

/**
 * Production VPC configuration (CIDR-based).
 * Extends the base configuration and overrides maxAzs.
 */
export const prodVpcConfig: VpcConfig = {
    ...baseVpcConfig,
    cidrBlock: '172.16.0.0/16',
    maxAzs: 3,
};

/**
 * Testing VPC configuration (CIDR-based).
 * Defines all properties explicitly.
 */
export const testVpcConfig: VpcConfig = {
    cidrBlock: '192.168.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    maxAzs: 2,
    // defaultInstanceTenancy will use the VPC default if not specified
};

/**
 * IPAM-based VPC configuration.
 * Uses IPAM for CIDR allocation instead of specifying it directly.
 */
export const ipamVpcConfig: VpcConfig = {
    // cidr is intentionally omitted when using IPAM
    ipv4IpamPoolId: 'ipam-pool-xxxxxxxxxxxxxxxxx', // <-- Replace with your actual IPAM Pool ID
    ipv4NetmaskLength: 16, // Example netmask length for IPAM allocation
    ...baseVpcConfig, // Include common settings
    maxAzs: 3, // Override maxAzs for this specific config
};

// Default VPC configuration to use if not specified (e.g., for a default deployment)
export const defaultVpcConfig = devVpcConfig; 