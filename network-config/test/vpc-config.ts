import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConfig } from '../../lib/types/v1/vpc';

export const testVpcConfig: VpcConfig = {
    // VPC configuration for test environment
    // Using smaller CIDR range for public subnet to save costs
    // This reduces the number of available public IP addresses which can lower costs
    cidrBlock: '192.168.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    instanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
    subnetConfigs: [
        {
            name: 'public',
            subnetType: ec2.SubnetType.PUBLIC,
            availabilityZone: 'us-east-1a',
            cidrBlock: '192.168.0.0/27',  // Smaller CIDR block (32 IPs vs 256 in dev)
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
            cidrBlock: '192.168.1.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        }
    ],
    tags: [
        { key: 'Environment', value: 'test' },
        { key: 'Project', value: 'my-project' },
    ],
    version: 'v1',
}; 