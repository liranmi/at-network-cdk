import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConfig } from '../../lib/schemas/vpc';

export const testVpcConfig: VpcConfig = {
    // VPC configuration for dev environment
    ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    enableDnsHostnames: true,
    enableDnsSupport: true,
    defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
    subnetConfigs: [
        {
            name: 'public',
            vpcId: '${VpcId}', // Will be replaced by the VPC construct
            availabilityZone: 'us-east-1a',
            cidrBlock: '10.0.0.0/24',
            mapPublicIpOnLaunch: true
        },
        {
            name: 'private',
            vpcId: '${VpcId}', // Will be replaced by the VPC construct
            availabilityZone: 'us-east-1a',
            cidrBlock: '10.0.1.0/24'
        }
    ],
    tags: {
        Environment: 'dev',
        Project: 'my-project'
    },
    version: "v1",
}; 