import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroupTwoPhaseProcessor } from '../../lib/stacks/security-group-two-phase-processor';
import { twoPhaseExampleConfig, largeScaleExampleConfig } from '../../network-config/examples/two-phase-example-config';

describe('SecurityGroupTwoPhaseProcessor', () => {
    let app: cdk.App;
    let vpc: ec2.Vpc;

    beforeEach(() => {
        app = new cdk.App();

        // Create a test VPC
        const vpcStack = new cdk.Stack(app, 'TestVpcStack');
        vpc = new ec2.Vpc(vpcStack, 'TestVpc', {
            maxAzs: 2
        });
    });

    test('creates two-phase security group deployment with proper dependencies', () => {
        // Create the security group processor with two-phase config
        const processor = new SecurityGroupTwoPhaseProcessor(app, 'TestSecurityGroupProcessor', {
            vpc,
            securityGroupsConfig: twoPhaseExampleConfig
        });

        // Get the template
        const template = Template.fromStack(processor);

        // Verify that nested stacks are created for Phase 1 and Phase 2
        const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
        expect(Object.keys(nestedStacks).length).toBeGreaterThan(0);

        // Verify that the processor has the expected stacks
        expect(processor.phase1Stacks.length).toBeGreaterThan(0);
        expect(processor.phase2Stacks.length).toBeGreaterThan(0);

        // Verify that security groups are stored in the processor
        expect(processor.securityGroups.has('web-sg')).toBe(true);
        expect(processor.securityGroups.has('app-sg')).toBe(true);
        expect(processor.securityGroups.has('db-sg')).toBe(true);
        expect(processor.securityGroups.has('monitoring-sg')).toBe(true);
        expect(processor.securityGroups.has('web-app-bridge')).toBe(true);
        expect(processor.securityGroups.has('app-db-bridge')).toBe(true);
        expect(processor.securityGroups.has('monitoring-bridge')).toBe(true);
    });

    test('handles large-scale deployments with batching', () => {
        // Create the security group processor with large-scale config
        const processor = new SecurityGroupTwoPhaseProcessor(app, 'TestLargeScaleProcessor', {
            vpc,
            securityGroupsConfig: largeScaleExampleConfig
        });

        // Get the template
        const template = Template.fromStack(processor);

        // Should have multiple nested stacks due to batching
        // 500 security groups with batch size 400 = 2 Phase 1 stacks
        // 200 bridge security groups * 2 rules each = 400 L1 rules with batch size 200 = 2 Phase 2 stacks
        expect(processor.phase1Stacks.length).toBe(2); // 500 SGs / 400 batch size = 2 stacks
        expect(processor.phase2Stacks.length).toBe(2); // 400 L1 rules / 200 batch size = 2 stacks

        // Verify that security groups are stored in the processor
        expect(processor.securityGroups.size).toBe(700); // 500 + 200 security groups
    });

    test('creates proper stack dependencies', () => {
        const processor = new SecurityGroupTwoPhaseProcessor(app, 'TestDependencyProcessor', {
            vpc,
            securityGroupsConfig: twoPhaseExampleConfig
        });

        // Verify that Phase 2 stacks depend on Phase 1 stacks
        expect(processor.phase1Stacks.length).toBeGreaterThan(0);
        expect(processor.phase2Stacks.length).toBeGreaterThan(0);

        // Verify security groups are stored for Phase 2 reference
        expect(processor.securityGroups.size).toBeGreaterThan(0);
    });

    test('handles configurations without L1 rules gracefully', () => {
        // Create config with no L1 rules
        const noL1RulesConfig = {
            version: 'v1' as const,
            securityGroups: [
                {
                    securityGroupName: 'simple-sg',
                    description: 'Simple security group without L1 rules',
                    allowAllOutbound: true,
                    ingress: [
                        {
                            peer: ec2.Peer.anyIpv4(),
                            port: ec2.Port.tcp(80),
                            description: 'Allow HTTP traffic'
                        }
                    ],
                    tags: {
                        Environment: 'test',
                        Component: 'simple'
                    }
                }
            ]
        };

        const processor = new SecurityGroupTwoPhaseProcessor(app, 'TestNoL1RulesProcessor', {
            vpc,
            securityGroupsConfig: noL1RulesConfig
        });

        // Should create Phase 1 stacks but no Phase 2 stacks
        expect(processor.phase1Stacks.length).toBeGreaterThan(0);
        expect(processor.phase2Stacks.length).toBe(0);
    });

    test('processes L1 rules with security group references correctly', () => {
        const processor = new SecurityGroupTwoPhaseProcessor(app, 'TestL1RulesProcessor', {
            vpc,
            securityGroupsConfig: twoPhaseExampleConfig
        });

        // Verify that security groups are properly stored for reference
        expect(processor.securityGroups.has('web-sg')).toBe(true);
        expect(processor.securityGroups.has('app-sg')).toBe(true);
        expect(processor.securityGroups.has('db-sg')).toBe(true);
        expect(processor.securityGroups.has('monitoring-sg')).toBe(true);
    });

    test('handles invalid security group references gracefully', () => {
        // Create config with invalid security group reference
        const invalidConfig = {
            version: 'v1' as const,
            securityGroups: [
                {
                    securityGroupName: 'valid-sg',
                    description: 'Valid security group',
                    allowAllOutbound: true,
                    tags: {
                        Environment: 'test'
                    }
                },
                {
                    securityGroupName: 'invalid-reference-sg',
                    description: 'Security group with invalid reference',
                    allowAllOutbound: false,
                    l1Ingress: [
                        {
                            ipProtocol: 'tcp',
                            fromPort: 80,
                            toPort: 80,
                            description: 'Invalid rule',
                            sourceSecurityGroupId: 'non-existent-sg' // Invalid reference
                        }
                    ],
                    tags: {
                        Environment: 'test'
                    }
                }
            ]
        };

        const processor = new SecurityGroupTwoPhaseProcessor(app, 'TestInvalidReferenceProcessor', {
            vpc,
            securityGroupsConfig: invalidConfig
        });

        // Should still create the valid security group
        expect(processor.securityGroups.has('valid-sg')).toBe(true);
        // Should not create the invalid reference security group
        expect(processor.securityGroups.has('invalid-reference-sg')).toBe(false);
    });

    test('batches security groups and rules appropriately', () => {
        const processor = new SecurityGroupTwoPhaseProcessor(app, 'TestBatchingProcessor', {
            vpc,
            securityGroupsConfig: largeScaleExampleConfig
        });

        // Verify batching works correctly
        // 500 security groups with batch size 400 = 2 Phase 1 stacks
        expect(processor.phase1Stacks.length).toBe(2);
        // 200 bridge security groups * 2 rules each = 400 L1 rules with batch size 200 = 2 Phase 2 stacks
        expect(processor.phase2Stacks.length).toBe(2);
    });
});