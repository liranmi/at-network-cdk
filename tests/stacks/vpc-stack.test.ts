import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../../lib/stacks/vpc-stack';
import { devVpcConfig, testVpcConfig, prodVpcConfig } from '../network-config/examples/vpc-examples';
import { VpcConfig } from '../../lib/schemas/vpc';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

describe('VpcStack', () => {
    let app: cdk.App;

    beforeEach(() => {
        app = new cdk.App();
    });

    test('creates VPC with CIDR configuration', () => {
        const stack = new VpcStack(app, 'TestVpcStackCidr', {
            vpcConfig: devVpcConfig,
            env: { region: 'us-east-1' },
        });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: '10.0.0.0/16',
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
            InstanceTenancy: 'default',
        });
        template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('creates VPC with explicitly defined test config', () => {
        const stack = new VpcStack(app, 'TestVpcStackExplicit', {
            vpcConfig: testVpcConfig,
            env: { region: 'us-east-1' },
        });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: '192.168.0.0/16',
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
            InstanceTenancy: 'default',
        });
        template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('exports VpcId', () => {
        const stack = new VpcStack(app, 'TestVpcStackExports', {
            vpcConfig: {
                ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
                maxAzs: 0,
                natGateways: 0,
                subnetConfigs: []
            },
            env: { region: 'us-east-1' },
        });
        const template = Template.fromStack(stack);

        template.hasOutput('VpcId', {
            Value: {
                Ref: Match.stringLikeRegexp('CustomVpc.*'),
            },
            Export: {
                Name: 'TestVpcStackExports-VpcId',
            },
        });
    });
});

describe('VPC Stack with Production Configuration', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestVpcStack', {
        vpcConfig: prodVpcConfig,
        env: {
            account: '123456789012',
            region: 'us-east-1'
        }
    });
    const template = Template.fromStack(stack);

    test('VPC is created with correct CIDR block', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: '172.16.0.0/16',
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
            InstanceTenancy: 'default'
        });
    });

    test('All subnets are created with correct configurations', () => {
        // Check for 6 subnets (2 types × 3 AZs)
        template.resourceCountIs('AWS::EC2::Subnet', 6);

        // Check public subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: Match.stringLikeRegexp('172.16.\\d+.0/19'),
            MapPublicIpOnLaunch: true,
            Tags: Match.arrayWith([
                { Key: 'aws-cdk:subnet-name', Value: 'Public' }
            ])
        });

        // Check private subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: Match.stringLikeRegexp('172.16.\\d+.0/19'),
            MapPublicIpOnLaunch: false,
            Tags: Match.arrayWith([
                { Key: 'aws-cdk:subnet-name', Value: 'Private' }
            ])
        });
    });

    test('Internet Gateway is created and attached', () => {
        template.resourceCountIs('AWS::EC2::InternetGateway', 1);
        template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('NAT Gateways are created for private subnets', () => {
        // Should have 3 NAT Gateways (one per AZ)
        template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('Route tables are created and configured correctly', () => {
        // CDK creates a route table for each subnet
        template.resourceCountIs('AWS::EC2::RouteTable', 6);

        // Check route tables have the correct VPC ID and environment tags
        template.hasResourceProperties('AWS::EC2::RouteTable', {
            VpcId: Match.anyValue(),
            Tags: Match.arrayWith([
                { Key: 'Environment', Value: 'prod' },
                { Key: 'Project', Value: 'my-project' }
            ])
        });
    });

    test('VPC has correct tags', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
            Tags: Match.arrayWith([
                { Key: 'Environment', Value: 'prod' },
                { Key: 'Project', Value: 'my-project' }
            ])
        });
    });
}); 