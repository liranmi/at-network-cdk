import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CustomVpc } from '../../lib/code/vpc/vpc';
import { VpcConfig } from '../../lib/types/vpc';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

describe('CustomVpc Construct', () => {
    let stack: cdk.Stack;

    beforeEach(() => {
        // Create a dummy stack to act as the scope for the construct
        stack = new cdk.Stack();
    });

    test('creates VPC resource with CIDR configuration', () => {
        const vpcConfig: VpcConfig = {
            cidr: '10.1.0.0/16',
            maxAzs: 2,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEDICATED,
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
        // Check default subnets are created based on maxAzs
        template.resourceCountIs('AWS::EC2::Subnet', 2 * 2);
    });

    test('creates VPC resource with IPAM configuration', () => {
        const vpcConfig: VpcConfig = {
            ipv4IpamPoolId: 'ipam-pool-testabcdefg',
            ipv4NetmaskLength: 22,
            maxAzs: 3,
            enableDnsHostnames: false,
        };
        new CustomVpc(stack, 'MyTestVpcConstructIpam', { vpcConfig });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            Ipv4IpamPoolId: 'ipam-pool-testabcdefg',
            Ipv4NetmaskLength: 22,
            EnableDnsHostnames: false,
            EnableDnsSupport: true, // Should default to true in base config if not specified
            InstanceTenancy: 'default', // Should use VPC default
        });
        template.resourceCountIs('AWS::EC2::Subnet', 2 * 2);
    });

    test('uses default maxAzs if not provided', () => {
        const vpcConfig: VpcConfig = { cidr: '10.2.0.0/16' };
        new CustomVpc(stack, 'MyTestVpcConstructDefaultAz', { vpcConfig });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        // Default is 1 AZs in the construct
        template.resourceCountIs('AWS::EC2::Subnet', 2 * 1);
    });

    test('throws error if both CIDR and IPAM info are missing', () => {
        const invalidConfig: VpcConfig = {
            // No cidr or IPAM
            maxAzs: 1,
        };
        expect(() => {
            new CustomVpc(stack, 'InvalidConstruct1', { vpcConfig: invalidConfig });
        }).toThrow('Either cidr or both ipv4IpamPoolId and ipv4NetmaskLength must be provided in VpcConfig');
    });

    test('throws error if only ipv4IpamPoolId is provided', () => {
        const invalidConfig: VpcConfig = {
            ipv4IpamPoolId: 'ipam-pool-test12345',
            maxAzs: 1,
        };
        expect(() => {
            new CustomVpc(stack, 'InvalidConstruct2', { vpcConfig: invalidConfig });
        }).toThrow('Either cidr or both ipv4IpamPoolId and ipv4NetmaskLength must be provided in VpcConfig');
    });

    test('throws error if only ipv4NetmaskLength is provided', () => {
        const invalidConfig: VpcConfig = {
            ipv4NetmaskLength: 24,
            maxAzs: 1,
        };
        expect(() => {
            new CustomVpc(stack, 'InvalidConstruct3', { vpcConfig: invalidConfig });
        }).toThrow('Either cidr or both ipv4IpamPoolId and ipv4NetmaskLength must be provided in VpcConfig');
    });

    test('exposes the created vpc object', () => {
        const vpcConfig: VpcConfig = { cidr: '10.3.0.0/16' };
        const customVpc = new CustomVpc(stack, 'MyTestVpcConstructExposure', { vpcConfig });

        expect(customVpc.vpc).toBeDefined();
        expect(customVpc.vpc).toBeInstanceOf(ec2.Vpc);
        // Check if we can access a property (like vpcId, though it's a token during synth)
        expect(cdk.Token.isUnresolved(customVpc.vpc.vpcId)).toBe(true);
    });
}); 