import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityGroupStack } from '../../lib/stacks/security-group-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { devSecurityGroupsConfig, prodSecurityGroupsConfig, largeSecurityGroupsConfig, testSecurityGroupsConfig } from '../network-config/examples/security-group-examples';
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
        const webSg = template.findResources('AWS::EC2::SecurityGroup', {
            Properties: {
                GroupName: 'web-sg'
            }
        });
        expect(Object.keys(webSg)).toHaveLength(1);
        const webSgResource = Object.values(webSg)[0];
        expect(webSgResource.Properties).toMatchObject({
            GroupDescription: 'Security group for web servers',
            GroupName: 'web-sg',
            Tags: expect.arrayContaining([
                {
                    Key: 'Environment',
                    Value: 'dev'
                },
                {
                    Key: 'Component',
                    Value: 'web'
                },
                {
                    Key: 'Project',
                    Value: 'my-project'
                }
            ]),
            SecurityGroupIngress: expect.arrayContaining([
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
            ]),
            SecurityGroupEgress: expect.arrayContaining([
                {
                    CidrIp: '0.0.0.0/0',
                    Description: 'Allow all outbound traffic by default',
                    IpProtocol: '-1'
                }
            ])
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

    test('creates security groups with comprehensive port configurations', () => {
        // Create the security group stack with test config
        const securityGroupStack = new SecurityGroupStack(app, 'TestSecurityGroupStack', {
            vpc,
            securityGroupsConfig: testSecurityGroupsConfig
        });

        const template = Template.fromStack(securityGroupStack);

        // Assert web server security group with various port configurations
        const webTestSg = template.findResources('AWS::EC2::SecurityGroup', {
            Properties: {
                GroupName: 'web-sg-test'
            }
        });
        expect(Object.keys(webTestSg)).toHaveLength(1);
        const webTestSgResource = Object.values(webTestSg)[0];
        expect(webTestSgResource.Properties).toMatchObject({
            GroupDescription: 'Security group for web servers with comprehensive port configs',
            GroupName: 'web-sg-test',
            Tags: expect.arrayContaining([
                {
                    Key: 'Environment',
                    Value: 'test'
                },
                {
                    Key: 'Component',
                    Value: 'web-test'
                },
                {
                    Key: 'Project',
                    Value: 'my-project'
                },
                {
                    Key: 'TestType',
                    Value: 'comprehensive'
                }
            ]),
            SecurityGroupIngress: expect.arrayContaining([
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
                },
                {
                    CidrIp: '0.0.0.0/0',
                    Description: 'Allow custom application port range',
                    FromPort: 8000,
                    ToPort: 8100,
                    IpProtocol: 'tcp'
                },
                {
                    CidrIp: '0.0.0.0/0',
                    Description: 'Allow all traffic (for testing)',
                    IpProtocol: '-1'
                }
            ])
        });

        // Assert application server security group with UDP and ICMP
        const appTestSg = template.findResources('AWS::EC2::SecurityGroup', {
            Properties: {
                GroupName: 'app-sg-test'
            }
        });
        expect(Object.keys(appTestSg)).toHaveLength(1);
        const appTestSgResource = Object.values(appTestSg)[0];
        expect(appTestSgResource.Properties).toMatchObject({
            GroupDescription: 'Security group for application servers with UDP and ICMP',
            GroupName: 'app-sg-test',
            Tags: expect.arrayContaining([
                {
                    Key: 'Environment',
                    Value: 'test'
                },
                {
                    Key: 'Component',
                    Value: 'app-test'
                },
                {
                    Key: 'Project',
                    Value: 'my-project'
                },
                {
                    Key: 'TestType',
                    Value: 'comprehensive'
                }
            ]),
            SecurityGroupIngress: expect.arrayContaining([
                {
                    CidrIp: '10.0.0.0/16',
                    Description: 'Allow TCP application traffic',
                    FromPort: 8080,
                    ToPort: 8080,
                    IpProtocol: 'tcp'
                },
                {
                    CidrIp: '10.0.0.0/16',
                    Description: 'Allow DNS traffic',
                    FromPort: 53,
                    ToPort: 53,
                    IpProtocol: 'udp'
                },
                {
                    CidrIp: '10.0.0.0/16',
                    Description: 'Allow ICMP echo requests',
                    FromPort: 8,
                    ToPort: -1,
                    IpProtocol: 'icmp'
                }
            ])
        });

        // Assert database server security group with specific port ranges
        const dbTestSg = template.findResources('AWS::EC2::SecurityGroup', {
            Properties: {
                GroupName: 'db-sg-test'
            }
        });
        expect(Object.keys(dbTestSg)).toHaveLength(1);
        const dbTestSgResource = Object.values(dbTestSg)[0];
        expect(dbTestSgResource.Properties).toMatchObject({
            GroupDescription: 'Security group for database servers with specific port ranges',
            GroupName: 'db-sg-test',
            Tags: expect.arrayContaining([
                {
                    Key: 'Environment',
                    Value: 'test'
                },
                {
                    Key: 'Component',
                    Value: 'db-test'
                },
                {
                    Key: 'Project',
                    Value: 'my-project'
                },
                {
                    Key: 'TestType',
                    Value: 'comprehensive'
                }
            ]),
            SecurityGroupIngress: expect.arrayContaining([
                {
                    CidrIp: '10.0.0.0/16',
                    Description: 'Allow PostgreSQL',
                    FromPort: 5432,
                    ToPort: 5432,
                    IpProtocol: 'tcp'
                },
                {
                    CidrIp: '10.0.0.0/16',
                    Description: 'Allow MongoDB',
                    FromPort: 27017,
                    ToPort: 27017,
                    IpProtocol: 'tcp'
                },
                {
                    CidrIp: '10.0.0.0/16',
                    Description: 'Allow Redis cluster',
                    FromPort: 6379,
                    ToPort: 6380,
                    IpProtocol: 'tcp'
                }
            ])
        });

        // Assert monitoring server security group with ICMP and custom protocols
        const monitoringTestSg = template.findResources('AWS::EC2::SecurityGroup', {
            Properties: {
                GroupName: 'monitoring-sg-test'
            }
        });
        expect(Object.keys(monitoringTestSg)).toHaveLength(1);
        const monitoringTestSgResource = Object.values(monitoringTestSg)[0];
        expect(monitoringTestSgResource.Properties).toMatchObject({
            GroupDescription: 'Security group for monitoring servers',
            GroupName: 'monitoring-sg-test',
            Tags: expect.arrayContaining([
                {
                    Key: 'Environment',
                    Value: 'test'
                },
                {
                    Key: 'Component',
                    Value: 'monitoring-test'
                },
                {
                    Key: 'Project',
                    Value: 'my-project'
                },
                {
                    Key: 'TestType',
                    Value: 'comprehensive'
                }
            ]),
            SecurityGroupIngress: expect.arrayContaining([
                {
                    CidrIp: '10.0.0.0/16',
                    Description: 'Allow Prometheus metrics',
                    FromPort: 9100,
                    ToPort: 9100,
                    IpProtocol: 'tcp'
                },
                {
                    CidrIp: '10.0.0.0/16',
                    Description: 'Allow Grafana',
                    FromPort: 3000,
                    ToPort: 3000,
                    IpProtocol: 'tcp'
                },
                {
                    CidrIp: '10.0.0.0/16',
                    Description: 'Allow ICMP echo requests',
                    FromPort: 8,
                    ToPort: -1,
                    IpProtocol: 'icmp'
                },
                {
                    CidrIp: '10.0.0.0/16',
                    Description: 'Allow ICMP echo replies',
                    FromPort: 0,
                    ToPort: -1,
                    IpProtocol: 'icmp'
                }
            ])
        });
    });
}); 
