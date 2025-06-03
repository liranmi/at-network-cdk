import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityGroupStack } from '../../lib/stacks/security-group-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { devSecurityGroupsConfig, prodSecurityGroupsConfig, largeSecurityGroupsConfig } from '../network-config/examples/security-group-examples';
import { countResourcesAcrossStacks, getAllStacks } from '../helpers/stacks';
import { Stack } from 'aws-cdk-lib';

describe('SecurityGroupStack', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let vpc: ec2.Vpc;

    beforeEach(() => {
        app = new cdk.App();
        stack = new cdk.Stack(app, 'TestStack');

        // Create a test VPC
        vpc = new ec2.Vpc(stack, 'TestVpc', {
            maxAzs: 2,
            subnetConfiguration: [
                {
                    name: 'Public',
                    subnetType: ec2.SubnetType.PUBLIC,
                    cidrMask: 24,
                },
                {
                    name: 'Private',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidrMask: 24,
                }
            ]
        });
    });

    test('creates security groups with correct properties', () => {
        // Create the security group stack with dev config
        const securityGroupStack = new SecurityGroupStack(app, 'TestSecurityGroupStack', {
            vpc,
            securityGroupsConfig: devSecurityGroupsConfig
        });

        // Get the template
        const template = Template.fromStack(securityGroupStack);

        // Assert security group creation
        template.resourceCountIs('AWS::EC2::SecurityGroup', 4); // web-sg, app-sg, db-sg, bastion-sg

        // Assert web server security group properties
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            GroupDescription: 'Security group for web servers',
            GroupName: 'web-sg',
            SecurityGroupIngress: [
                {
                    CidrIp: '0.0.0.0/0',
                    Description: 'Allow HTTP traffic',
                    FromPort: 80,
                    ToPort: 80,
                    IpProtocol: 'tcp'
                },
                {
                    CidrIp: '0.0.0.0/0',
                    Description: 'Allow HTTPS traffic',
                    FromPort: 443,
                    ToPort: 443,
                    IpProtocol: 'tcp'
                }
            ],
            SecurityGroupEgress: [
                {
                    CidrIp: '0.0.0.0/0',
                    Description: 'Allow all outbound traffic by default',
                    IpProtocol: '-1'
                }
            ]
        });
    });

    test('creates nested stacks for large number of security groups', () => {
        // Create the security group stack with large config
        const securityGroupStack = new SecurityGroupStack(app, 'TestSecurityGroupStack', {
            vpc,
            securityGroupsConfig: largeSecurityGroupsConfig
        });

        // Get the template
        const template = Template.fromStack(securityGroupStack);

        // Assert stack creation (2 nested stacks for 600 security groups)
        template.resourceCountIs('AWS::CloudFormation::Stack', 2);

        // Assert number of created resources 
        const expectedCount = largeSecurityGroupsConfig.securityGroups.length;

        const allStacks = getAllStacks(securityGroupStack);
        const totalSecurityGroups = countResourcesAcrossStacks(allStacks, 'AWS::EC2::SecurityGroup');

        expect(totalSecurityGroups).toBe(expectedCount);


        // Verify the parent stack
        template.hasResource('AWS::CloudFormation::Stack', {
            Type: 'AWS::CloudFormation::Stack',
            Properties: {
                TemplateURL: Match.anyValue()
            }
        });
    });

    test('handles empty security groups array', () => {
        const emptyConfig = {
            version: 'v1' as const,
            securityGroups: [],
            tags: {
                Environment: 'test',
                Project: 'test-project'
            }
        };

        const securityGroupStack = new SecurityGroupStack(app, 'TestSecurityGroupStack', {
            vpc,
            securityGroupsConfig: emptyConfig
        });

        const template = Template.fromStack(securityGroupStack);
        template.resourceCountIs('AWS::EC2::SecurityGroup', 0);
    });

    test('creates security groups with both ingress and egress rules', () => {
        // Create the security group stack with prod config
        const securityGroupStack = new SecurityGroupStack(app, 'TestSecurityGroupStack', {
            vpc,
            securityGroupsConfig: prodSecurityGroupsConfig
        });

        const template = Template.fromStack(securityGroupStack);

        // Assert database security group with both ingress and egress rules
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
            GroupDescription: 'Security group for database servers',
            GroupName: 'db-sg',
            SecurityGroupIngress: [
                {
                    CidrIp: '172.16.0.0/16',
                    Description: 'Allow PostgreSQL from app servers',
                    FromPort: 5432,
                    ToPort: 5432,
                    IpProtocol: 'tcp'
                }
            ],
            SecurityGroupEgress: [
                {
                    CidrIp: '172.16.0.0/16',
                    Description: 'Allow outbound PostgreSQL',
                    FromPort: 5432,
                    ToPort: 5432,
                    IpProtocol: 'tcp'
                }
            ]
        });
    });
}); 
