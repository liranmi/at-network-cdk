import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../../lib/stacks/vpc-stack';
import { devVpcConfig, testVpcConfig, ipamVpcConfig, prodVpcConfig } from '../network-config/examples/vpc-examples';
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
        template.resourceCountIs('AWS::EC2::Subnet', 2);

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
        template.resourceCountIs('AWS::EC2::Subnet', 2);
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
        template.resourceCountIs('AWS::EC2::Subnet', 2);
    });

    test('throws error if both CIDR and IPAM info are missing', () => {
        const invalidConfig: VpcConfig = {
            // No cidr
            // No ipv4IpamPoolId
            // No ipv4NetmaskLength
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
        // Check for 18 subnets (6 types × 3 AZs)
        template.resourceCountIs('AWS::EC2::Subnet', 18);

        // Check public subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: '172.16.0.0/24',
            MapPublicIpOnLaunch: true,
            EnableDns64: true,
            Tags: Match.arrayWith([
                { Key: 'aws-cdk:subnet-name', Value: 'public-1a' }
            ])
        });

        // Check private subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: '172.16.3.0/24',
            EnableDns64: false,
            MapPublicIpOnLaunch: false,
            Tags: Match.arrayWith([
                { Key: 'aws-cdk:subnet-name', Value: 'private-1a' }
            ])
        });

        // Check database subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: '172.16.6.0/24',
            EnableDns64: false,
            MapPublicIpOnLaunch: false,
            Tags: Match.arrayWith([
                { Key: 'aws-cdk:subnet-name', Value: 'db-1a' }
            ])
        });

        // Check application subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: '172.16.9.0/24',
            EnableDns64: false,
            MapPublicIpOnLaunch: false,
            Tags: Match.arrayWith([
                { Key: 'aws-cdk:subnet-name', Value: 'app-1a' }
            ])
        });

        // Check cache subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: '172.16.12.0/24',
            EnableDns64: false,
            MapPublicIpOnLaunch: false,
            Tags: Match.arrayWith([
                { Key: 'aws-cdk:subnet-name', Value: 'cache-1a' }
            ])
        });

        // Check backup subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
            CidrBlock: '172.16.15.0/24',
            EnableDns64: false,
            MapPublicIpOnLaunch: false,
            Tags: Match.arrayWith([
                { Key: 'aws-cdk:subnet-name', Value: 'backup-1a' }
            ])
        });
    });

    test('Internet Gateway is created and attached', () => {
        template.resourceCountIs('AWS::EC2::InternetGateway', 1);
        template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('NAT Gateways are created for private subnets', () => {
        // Should have 1 NAT Gateway (CDK creates one by default)
        template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('Route tables are created and configured correctly', () => {
        // CDK creates a route table for each subnet
        template.resourceCountIs('AWS::EC2::RouteTable', 18);

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