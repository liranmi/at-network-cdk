import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConfig, SubnetConfig } from '../../../lib/schemas/vpc';

/**
 * Example VPC configurations for different environments.
 * These are example configurations that demonstrate how to use the VPC construct.
 * In a real project, you would typically load configurations from environment-specific files
 * or external configuration sources.
 */

/**
 * Base VPC configuration with common settings.
 * Can be extended or overridden by environment-specific configs.
 */
const baseVpcConfig: Partial<VpcConfig> = {
    enableDnsHostnames: true,
    enableDnsSupport: true,
    defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
    version: 'v1',
};

/**
 * Common subnet configurations that can be reused across environments
 */
const commonSubnetConfigs: SubnetConfig[] = [
    {
        name: 'public',
        subnetType: ec2.SubnetType.PUBLIC,
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        enableDns64: true,
        enableLniAtDeviceIndex: 0,
        privateDnsNameOptionsOnLaunch: {
            EnableResourceNameDnsARecord: true,
            HostnameType: 'ip-name'
        }
    },
    {
        name: 'private',
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        availabilityZone: 'us-east-1a',
        enableDns64: false,
        privateDnsNameOptionsOnLaunch: {
            EnableResourceNameDnsARecord: true,
            HostnameType: 'ip-name'
        }
    }
];

/**
 * Development VPC configuration (CIDR-based).
 * Extends the base configuration.
 */
export const devVpcConfig: VpcConfig = {
    ...baseVpcConfig,
    ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    subnetConfigs: commonSubnetConfigs.map(subnet => ({
        ...subnet,
        cidrBlock: subnet.name === 'public' ? '10.0.0.0/24' : '10.0.1.0/24'
    })),
    tags: {
        Environment: 'dev',
        Project: 'my-project'
    },
    version: 'v1',
};

/**
 * Production VPC configuration with multiple subnets across different AZs.
 * This configuration represents a more realistic production environment setup.
 */
export const prodVpcConfig: VpcConfig = {
    ...baseVpcConfig,
    ipAddresses: ec2.IpAddresses.cidr('172.16.0.0/16'),
    subnetConfigs: [
        // Public Subnets (3 AZs)
        {
            name: 'public-1a',
            subnetType: ec2.SubnetType.PUBLIC,
            availabilityZone: 'us-east-1a',
            cidrBlock: '172.16.0.0/24',
            mapPublicIpOnLaunch: true,
            enableDns64: true,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'public-1b',
            subnetType: ec2.SubnetType.PUBLIC,
            availabilityZone: 'us-east-1b',
            cidrBlock: '172.16.1.0/24',
            mapPublicIpOnLaunch: true,
            enableDns64: true,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'public-1c',
            subnetType: ec2.SubnetType.PUBLIC,
            availabilityZone: 'us-east-1c',
            cidrBlock: '172.16.2.0/24',
            mapPublicIpOnLaunch: true,
            enableDns64: true,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        // Private Subnets (3 AZs)
        {
            name: 'private-1a',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            availabilityZone: 'us-east-1a',
            cidrBlock: '172.16.10.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'private-1b',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            availabilityZone: 'us-east-1b',
            cidrBlock: '172.16.11.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'private-1c',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            availabilityZone: 'us-east-1c',
            cidrBlock: '172.16.12.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        // Database Subnets (3 AZs)
        {
            name: 'db-1a',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            availabilityZone: 'us-east-1a',
            cidrBlock: '172.16.20.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'db-1b',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            availabilityZone: 'us-east-1b',
            cidrBlock: '172.16.21.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'db-1c',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            availabilityZone: 'us-east-1c',
            cidrBlock: '172.16.22.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        // Application Subnets (3 AZs)
        {
            name: 'app-1a',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            availabilityZone: 'us-east-1a',
            cidrBlock: '172.16.30.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'app-1b',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            availabilityZone: 'us-east-1b',
            cidrBlock: '172.16.31.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'app-1c',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            availabilityZone: 'us-east-1c',
            cidrBlock: '172.16.32.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        // Cache Subnets (3 AZs)
        {
            name: 'cache-1a',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            availabilityZone: 'us-east-1a',
            cidrBlock: '172.16.40.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'cache-1b',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            availabilityZone: 'us-east-1b',
            cidrBlock: '172.16.41.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'cache-1c',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            availabilityZone: 'us-east-1c',
            cidrBlock: '172.16.42.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        // Backup Subnets (3 AZs)
        {
            name: 'backup-1a',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            availabilityZone: 'us-east-1a',
            cidrBlock: '172.16.50.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'backup-1b',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            availabilityZone: 'us-east-1b',
            cidrBlock: '172.16.51.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        },
        {
            name: 'backup-1c',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            availabilityZone: 'us-east-1c',
            cidrBlock: '172.16.52.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        }
    ],
    tags: {
        Environment: 'prod',
        Project: 'my-project'
    },
    version: 'v1',
};

/**
 * Testing VPC configuration (CIDR-based).
 * Defines all properties explicitly.
 */
export const testVpcConfig: VpcConfig = {
    ipAddresses: ec2.IpAddresses.cidr('192.168.0.0/16'),
    enableDnsHostnames: true,
    enableDnsSupport: true,
    subnetConfigs: commonSubnetConfigs.map(subnet => ({
        ...subnet,
        cidrBlock: subnet.name === 'public' ? '192.168.0.0/24' : '192.168.1.0/24'
    })),
    tags: {
        Environment: 'test',
        Project: 'my-project'
    },
    version: 'v1',
};



// Default VPC configuration to use if not specified (e.g., for a default deployment)
export const defaultVpcConfig = devVpcConfig; 