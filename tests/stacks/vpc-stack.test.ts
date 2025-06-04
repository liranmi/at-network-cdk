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
        template.resourceCountIs('AWS::EC2::Subnet', 2);
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
        template.resourceCountIs('AWS::EC2::Subnet', 2);
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

        template.hasOutput('*', {
            Value: {
                Ref: Match.stringLikeRegexp('CustomVpc.*'),
            },
            Export: {
                Name: 'CustomVpc-vpc-id',
            },
        });
    });

    test('subnets reference created VPC', () => {
        const stack = new VpcStack(app, 'TestVpcStackVpcRef', {
            vpcConfig: devVpcConfig,
            env: { region: 'us-east-1' },
        });

        const template = Template.fromStack(stack);

        template.hasResourceProperties('AWS::EC2::Subnet', {
            VpcId: { Ref: Match.stringLikeRegexp('CustomVpc.*') },
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
        // Check for all subnets in the production configuration
        template.resourceCountIs('AWS::EC2::Subnet', 18);

        // Check public subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: Match.stringLikeRegexp('172.16.\\d+.0/24'),
            MapPublicIpOnLaunch: true,
            Tags: Match.arrayWith([
                { Key: 'Name', Value: Match.stringLikeRegexp('TestVpcStack/CustomVpc/public-\\d+') }
            ])
        });

        // Check private subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: Match.stringLikeRegexp('172.16.\\d+.0/24'),
            Tags: Match.arrayWith([
                { Key: 'Name', Value: Match.stringLikeRegexp('TestVpcStack/CustomVpc/private-\\d+') }
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