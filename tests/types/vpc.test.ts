import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CustomVpc } from '../../lib/code/vpc/vpc';
import { VpcConfig, SubnetConfig } from '../../lib/schemas/vpc';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Match } from 'aws-cdk-lib/assertions';

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
                cidrBlock: '10.1.0.0/24',
                availabilityZone: 'us-east-1a',
                mapPublicIpOnLaunch: true
            },
            {
                name: 'private',
                cidrBlock: '10.1.1.0/24',
                availabilityZone: 'us-east-1a',
            }
        ];

        const vpcConfig: VpcConfig = {
            name: 'test-vpc',
            ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
            enableDnsHostnames: true,
            enableDnsSupport: true,
            defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEDICATED,
            maxAzs: 1,
            subnetConfigs,
            version: 'v1',
            tags: {
                Environment: 'test',
                Project: 'test-project'
            }
        };

        new CustomVpc(stack, 'MyTestVpcConstructCidr', { vpcConfig });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: '10.1.0.0/16',
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
            InstanceTenancy: 'dedicated',
            Tags: Match.arrayWith([
                { Key: 'Name', Value: 'Default/MyTestVpcConstructCidr/test-vpc' }
            ])
        });
        template.resourceCountIs('AWS::EC2::Subnet', 2);
    });

    test('creates VPC with minimal configuration', () => {
        const vpcConfig: VpcConfig = {
            name: 'minimal-vpc',
            ipAddresses: ec2.IpAddresses.cidr('10.2.0.0/16'),
            maxAzs: 0,
            natGateways: 0,
            subnetConfigs: [],
            version: 'v1',
            tags: {
                Name: 'minimal-vpc'
            }
        };

        new CustomVpc(stack, 'MyTestVpcConstructDefaultAz', { vpcConfig });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            Tags: Match.arrayWith([
                { Key: 'Name', Value: 'minimal-vpc' }
            ])
        });
        template.resourceCountIs('AWS::EC2::Subnet', 0);
    });

    test('exposes the created vpc object', () => {
        const vpcConfig: VpcConfig = {
            name: 'exposure-vpc',
            ipAddresses: ec2.IpAddresses.cidr('10.3.0.0/16'),
            maxAzs: 0,
            natGateways: 0,
            subnetConfigs: [],
            version: 'v1'
        };
        const customVpc = new CustomVpc(stack, 'MyTestVpcConstructExposure', { vpcConfig });

        expect(customVpc.vpc).toBeDefined();
        expect(customVpc.vpc).toBeInstanceOf(ec2.Vpc);
        expect(cdk.Token.isUnresolved(customVpc.vpc.vpcId)).toBe(true);
    });
}); 