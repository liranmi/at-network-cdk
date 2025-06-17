import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConfig } from '../../lib/schemas/vpc';

export const vpcConfig: VpcConfig = {
    // VPC configuration for prod environment
    ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    enableDnsHostnames: true,
    enableDnsSupport: true,
    defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
    subnetConfigs: [
        {
            name: 'public',
            availabilityZone: 'us-east-1a',
            cidrBlock: '10.0.0.0/24',
            mapPublicIpOnLaunch: true,
            tags: {
                Name: 'public subnet'
            }
        },
        {
            name: 'private',
            availabilityZone: 'us-east-1a',
            cidrBlock: '10.0.1.0/24',
            tags: {
                Name: 'private subnet'
            }
        }
    ],
    tags: {
        Environment: 'prod',
        Project: 'my-project'
    },
    version: "v1",
}; 