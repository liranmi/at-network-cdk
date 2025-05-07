import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CustomVpc } from '../../lib/code/vpc/v1/vpc';
import { VpcConfig, SubnetConfig } from '../../lib/types/v1/vpc';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

describe('CustomVpc Construct', () => {
    let stack: cdk.Stack;

    beforeEach(() => {
        // Create a dummy stack to act as the scope for the construct
        stack = new cdk.Stack();
    });

    test('creates VPC resource with CIDR configuration and subnets', () => {
        const subnetConfigs: SubnetConfig[] = [
            {
                name: 'public',
                subnetType: ec2.SubnetType.PUBLIC,
                cidrBlock: '10.1.0.0/24',
                availabilityZone: 'us-east-1a',
                vpcId: cdk.Token.asString({ Ref: 'MyTestVpcConstructCidrVpc' }),
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
                cidrBlock: '10.1.1.0/24',
                availabilityZone: 'us-east-1a',
                vpcId: cdk.Token.asString({ Ref: 'MyTestVpcConstructCidrVpc' }),
                enableDns64: false,
                privateDnsNameOptionsOnLaunch: {
                    EnableResourceNameDnsARecord: true,
                    HostnameType: 'ip-name'
                }
            }
        ];

        const vpcConfig: VpcConfig = {
            cidrBlock: '10.1.0.0/16',
            subnetConfigs,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            instanceTenancy: ec2.DefaultInstanceTenancy.DEDICATED,
        };
        new CustomVpc(stack, 'MyTestVpcConstructCidr', { vpcConfig });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: '10.1.0.0/16',
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
            InstanceTenancy: 'dedicated',
        });
        template.resourceCountIs('AWS::EC2::Subnet', 2);
    });

    test('creates VPC resource with IPAM configuration and subnets', () => {
        const subnetConfigs: SubnetConfig[] = [
            {
                name: 'public',
                subnetType: ec2.SubnetType.PUBLIC,
                availabilityZone: 'us-east-1a',
                vpcId: cdk.Token.asString({ Ref: 'MyTestVpcConstructIpamVpc' }),
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
                vpcId: cdk.Token.asString({ Ref: 'MyTestVpcConstructIpamVpc' }),
                enableDns64: false,
                privateDnsNameOptionsOnLaunch: {
                    EnableResourceNameDnsARecord: true,
                    HostnameType: 'ip-name'
                }
            }
        ];

        const vpcConfig: VpcConfig = {
            ipv4IpamPoolId: 'ipam-pool-testabcdefg',
            ipv4NetmaskLength: 22,
            subnetConfigs,
            enableDnsHostnames: false,
        };
        new CustomVpc(stack, 'MyTestVpcConstructIpam', { vpcConfig });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            Ipv4IpamPoolId: 'ipam-pool-testabcdefg',
            Ipv4NetmaskLength: 22,
            EnableDnsHostnames: false,
            EnableDnsSupport: true,
            InstanceTenancy: 'default',
        });
        template.resourceCountIs('AWS::EC2::Subnet', 2);
    });

    test('creates VPC with minimal configuration', () => {
        const vpcConfig: VpcConfig = {
            cidrBlock: '10.2.0.0/16',
            subnetConfigs: []
        };
        new CustomVpc(stack, 'MyTestVpcConstructDefaultAz', { vpcConfig });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.resourceCountIs('AWS::EC2::Subnet', 0);
    });

    test('throws error if both CIDR and IPAM info are missing', () => {
        const invalidConfig: VpcConfig = {
            subnetConfigs: []
        };
        expect(() => {
            new CustomVpc(stack, 'InvalidConstruct1', { vpcConfig: invalidConfig });
        }).toThrow('Either cidr or both ipv4IpamPoolId and ipv4NetmaskLength must be provided in VpcConfig');
    });

    test('throws error if only ipv4IpamPoolId is provided', () => {
        const invalidConfig: VpcConfig = {
            ipv4IpamPoolId: 'ipam-pool-test12345',
            subnetConfigs: []
        };
        expect(() => {
            new CustomVpc(stack, 'InvalidConstruct2', { vpcConfig: invalidConfig });
        }).toThrow('Either cidr or both ipv4IpamPoolId and ipv4NetmaskLength must be provided in VpcConfig');
    });

    test('throws error if only ipv4NetmaskLength is provided', () => {
        const invalidConfig: VpcConfig = {
            ipv4NetmaskLength: 24,
            subnetConfigs: []
        };
        expect(() => {
            new CustomVpc(stack, 'InvalidConstruct3', { vpcConfig: invalidConfig });
        }).toThrow('Either cidr or both ipv4IpamPoolId and ipv4NetmaskLength must be provided in VpcConfig');
    });

    test('exposes the created vpc object', () => {
        const vpcConfig: VpcConfig = {
            cidrBlock: '10.3.0.0/16',
            subnetConfigs: []
        };
        const customVpc = new CustomVpc(stack, 'MyTestVpcConstructExposure', { vpcConfig });

        expect(customVpc.vpc).toBeDefined();
        expect(customVpc.vpc).toBeInstanceOf(ec2.Vpc);
        expect(cdk.Token.isUnresolved(customVpc.vpc.vpcId)).toBe(true);
    });
}); 