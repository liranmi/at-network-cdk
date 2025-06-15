import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { overrideLogicalId, overrideLogicalIds, isCfnResource } from '../../../lib/code/helpers/logical-id';

describe('Logical ID Helpers', () => {
    let stack: cdk.Stack;

    beforeEach(() => {
        stack = new cdk.Stack();
    });

    describe('overrideLogicalId', () => {
        test('overrides logical ID of a VPC construct', () => {
            // Create a test VPC
            const vpc = new ec2.Vpc(stack, 'TestVpc', {
                maxAzs: 1,
                subnetConfiguration: [
                    {
                        name: 'Public',
                        subnetType: ec2.SubnetType.PUBLIC,
                        cidrMask: 24,
                    }
                ]
            });

            // Override its logical ID
            overrideLogicalId(vpc, 'CustomVpcName');

            // Get the template
            const template = Template.fromStack(stack);

            // Verify the logical ID was overridden
            template.hasResource('AWS::EC2::VPC', {
                Properties: {}
            });

            // Check that the resource exists with the custom name
            expect(template.findResources('AWS::EC2::VPC')).toHaveProperty('CustomVpcName');
        });

        test('overrides logical ID of a subnet construct', () => {
            // Create a test subnet
            const vpc = new ec2.Vpc(stack, 'TestVpc', {
                maxAzs: 1,
                subnetConfiguration: [
                    {
                        name: 'Public',
                        subnetType: ec2.SubnetType.PUBLIC,
                        cidrMask: 24,
                    }
                ]
            });
            const subnet = vpc.publicSubnets[0];

            // Override its logical ID
            overrideLogicalId(subnet, 'CustomSubnetName');

            // Get the template
            const template = Template.fromStack(stack);

            // Verify the logical ID was overridden
            template.hasResource('AWS::EC2::Subnet', {
                Properties: {}
            });

            // Check that the resource exists with the custom name
            expect(template.findResources('AWS::EC2::Subnet')).toHaveProperty('CustomSubnetName');
        });

        test('overrides logical ID of a security group construct', () => {
            // Create a test security group
            const vpc = new ec2.Vpc(stack, 'TestVpc');
            const securityGroup = new ec2.SecurityGroup(stack, 'TestSecurityGroup', {
                vpc,
                description: 'Test security group'
            });

            // Override its logical ID
            overrideLogicalId(securityGroup, 'CustomSecurityGroupName');

            // Get the template
            const template = Template.fromStack(stack);

            // Verify the logical ID was overridden
            template.hasResource('AWS::EC2::SecurityGroup', {
                Properties: {}
            });

            // Check that the resource exists with the custom name
            expect(template.findResources('AWS::EC2::SecurityGroup')).toHaveProperty('CustomSecurityGroupName');
        });

        test('returns the construct after overriding', () => {
            const vpc = new ec2.Vpc(stack, 'TestVpc');
            const result = overrideLogicalId(vpc, 'CustomVpcName');

            expect(result).toBe(vpc);
        });

        test('handles construct without default child', () => {
            const construct = new Construct(stack, 'TestConstruct');
            const result = overrideLogicalId(construct, 'CustomName');

            expect(result).toBe(construct);
        });
    });

    describe('overrideLogicalIds', () => {
        test('overrides multiple network constructs logical IDs', () => {
            // Create test constructs
            const vpc = new ec2.Vpc(stack, 'TestVpc', {
                maxAzs: 1,
                subnetConfiguration: [
                    {
                        name: 'Public',
                        subnetType: ec2.SubnetType.PUBLIC,
                        cidrMask: 24,
                    }
                ]
            });
            const subnet = vpc.publicSubnets[0];
            const securityGroup = new ec2.SecurityGroup(stack, 'TestSecurityGroup', {
                vpc,
                description: 'Test security group'
            });

            // Override their logical IDs
            overrideLogicalIds([
                { construct: vpc, logicalId: 'CustomVpc' },
                { construct: subnet, logicalId: 'CustomSubnet' },
                { construct: securityGroup, logicalId: 'CustomSecurityGroup' }
            ]);

            // Get the template
            const template = Template.fromStack(stack);

            // Verify all logical IDs were overridden
            expect(template.findResources('AWS::EC2::VPC')).toHaveProperty('CustomVpc');
            expect(template.findResources('AWS::EC2::Subnet')).toHaveProperty('CustomSubnet');
            expect(template.findResources('AWS::EC2::SecurityGroup')).toHaveProperty('CustomSecurityGroup');
        });
    });

    describe('isCfnResource', () => {
        test('returns true for CfnResource', () => {
            const vpc = new ec2.Vpc(stack, 'TestVpc');
            const cfnResource = vpc.node.defaultChild as cdk.CfnResource;

            expect(isCfnResource(cfnResource)).toBe(true);
        });

        test('returns false for non-CfnResource', () => {
            const construct = new Construct(stack, 'TestConstruct');

            expect(isCfnResource(construct)).toBe(false);
        });
    });
}); 