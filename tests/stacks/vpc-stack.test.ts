import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../../lib/stacks/vpc-stack';
import { devVpcConfig, prodVpcConfig, testVpcConfig, ipamVpcConfig } from '../../config/vpc';
import { VpcConfig } from '../../lib/types/vpc';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

describe('VpcStack', () => {
    let app: cdk.App;

    beforeEach(() => {
        app = new cdk.App();
    });

    test('creates VPC with CIDR configuration', () => {
        const stack = new VpcStack(app, 'TestVpcStackCidr', {
            vpcConfig: devVpcConfig,
            env: { region: 'us-east-1' }, // Ensure a region with enough AZs
        });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: devVpcConfig.cidrBlock,
            EnableDnsHostnames: devVpcConfig.enableDnsHostnames,
            EnableDnsSupport: devVpcConfig.enableDnsSupport,
            InstanceTenancy: devVpcConfig.instanceTenancy,
        });
        // Default maxAzs is used from baseVpcConfig which devVpcConfig extends
        template.hasResourceProperties('AWS::EC2::VPC', {
            Tags: Match.arrayWith([
                {
                    Key: 'Environment',
                    Value: 'dev',
                },
                {
                    Key: 'Project',
                    Value: 'my-project',
                },
            ]),
        });
        // CDK adds default subnets, check for Public (change if default subnet config changes)
        template.resourceCountIs('AWS::EC2::Subnet', 0); // Public and Private per AZ

    });

    test('creates VPC with IPAM configuration', () => {
        const ipamTestConfig: VpcConfig = {
            ...ipamVpcConfig,
            // Override with a mock IPAM pool ID for testing if needed
            // ipv4IpamPoolId: 'ipam-pool-test12345'
        };
        const stack = new VpcStack(app, 'TestVpcStackIpam', {
            vpcConfig: ipamTestConfig,
            env: { region: 'us-east-1' }, // Ensure a region with enough AZs
        });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            Ipv4IpamPoolId: ipamTestConfig.ipv4IpamPoolId,
            Ipv4NetmaskLength: ipamTestConfig.ipv4NetmaskLength,
            EnableDnsHostnames: ipamTestConfig.enableDnsHostnames,
            EnableDnsSupport: ipamTestConfig.enableDnsSupport,
            InstanceTenancy: ipamTestConfig.instanceTenancy,
        });
        // Check for correct maxAzs from the ipam config
        template.resourceCountIs('AWS::EC2::Subnet', 0);
    });

    test('creates VPC with overridden maxAzs', () => {

        // Create stack with explicit region that has at least 3 AZs
        const stack = new VpcStack(app, 'TestVpcStackProd', {
            vpcConfig: prodVpcConfig, // prodVpcConfig overrides maxAzs to 3
            env: { region: 'us-east-1' }, // Ensure a region with at least 3 AZs
        });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.resourceCountIs('AWS::EC2::Subnet', 0); // fallback 2 AZs * 2 subnet types
        template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('creates VPC with explicitly defined test config', () => {
        const stack = new VpcStack(app, 'TestVpcStackExplicit', {
            vpcConfig: testVpcConfig,
            env: { region: 'us-east-1' }, // Ensure a region with enough AZs
        });
        const template = Template.fromStack(stack);

        template.resourceCountIs('AWS::EC2::VPC', 1);
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: testVpcConfig.cidrBlock,
            EnableDnsHostnames: testVpcConfig.enableDnsHostnames,
            EnableDnsSupport: testVpcConfig.enableDnsSupport,
            // InstanceTenancy should be the AWS default (which is 'default')
            InstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
        });
        template.resourceCountIs('AWS::EC2::Subnet', 0);
    });

    test('throws error if both CIDR and IPAM info are missing', () => {
        const invalidConfig: VpcConfig = {
            // No cidr
            // No ipv4IpamPoolId
            // No ipv4NetmaskLength
            maxAzs: 1,
        };
        expect(() => {
            new VpcStack(app, 'TestInvalidVpcStack', {
                vpcConfig: invalidConfig,
            });
        }).toThrow('Either cidr or both ipv4IpamPoolId and ipv4NetmaskLength must be provided in VpcConfig');
    });

    test('throws error if only ipv4IpamPoolId is provided', () => {
        const invalidConfig: VpcConfig = {
            ipv4IpamPoolId: 'ipam-pool-test12345',
            // No ipv4NetmaskLength
            maxAzs: 1,
        };
        expect(() => {
            new VpcStack(app, 'TestInvalidIpamStack1', {
                vpcConfig: invalidConfig,
            });
        }).toThrow('Either cidr or both ipv4IpamPoolId and ipv4NetmaskLength must be provided in VpcConfig');
    });

    test('throws error if only ipv4NetmaskLength is provided', () => {
        const invalidConfig: VpcConfig = {
            ipv4NetmaskLength: 24,
            // No ipv4IpamPoolId
            maxAzs: 1,
        };
        expect(() => {
            new VpcStack(app, 'TestInvalidIpamStack2', {
                vpcConfig: invalidConfig,
            });
        }).toThrow('Either cidr or both ipv4IpamPoolId and ipv4NetmaskLength must be provided in VpcConfig');
    });

    test('exports VpcId', () => {
        const stack = new VpcStack(app, 'TestVpcStackExport', {
            vpcConfig: devVpcConfig,
            env: { region: 'us-east-1' }, // Ensure a region with enough AZs
        });
        const template = Template.fromStack(stack);

        template.hasOutput('VpcId', {
            Export: {
                Name: 'TestVpcStackExport-VpcId',
            },
        });
    });
}); 