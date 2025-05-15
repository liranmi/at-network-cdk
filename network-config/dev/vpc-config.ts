import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConfig } from '../../lib/schemas/vpc';

export const devVpcConfig: VpcConfig = {
    // VPC configuration for dev environment
    cidrBlock: '10.0.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    instanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
    subnetConfigs: [
        {
            name: 'public',
            subnetType: ec2.SubnetType.PUBLIC,
            availabilityZone: 'us-east-1a',
            cidrBlock: '10.0.0.0/24',
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
            cidrBlock: '10.0.1.0/24',
            enableDns64: false,
            privateDnsNameOptionsOnLaunch: {
                EnableResourceNameDnsARecord: true,
                HostnameType: 'ip-name'
            }
        }
    ],
    tags: [
        { key: 'Environment', value: 'dev' },
        { key: 'Project', value: 'my-project' },
    ],
    version: 'v1',
}; 