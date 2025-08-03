import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroupsConfig } from '../../lib/schemas/securityGroup';

/**
 * Example configuration demonstrating two-phase security group deployment
 * using the existing schema with L1 rules for cross-stack dependencies
 */
export const twoPhaseExampleConfig: SecurityGroupsConfig = {
    version: 'v1',
    securityGroups: [
        // Phase 1: Security groups with inline rules (L2)
        {
            securityGroupName: 'web-sg',
            description: 'Security group for web servers',
            allowAllOutbound: true,
            ingress: [
                {
                    peer: ec2.Peer.anyIpv4(),
                    port: ec2.Port.tcp(80),
                    description: 'Allow HTTP traffic'
                },
                {
                    peer: ec2.Peer.anyIpv4(),
                    port: ec2.Port.tcp(443),
                    description: 'Allow HTTPS traffic'
                }
            ],
            tags: {
                Environment: 'prod',
                Component: 'web',
                Phase: '1'
            }
        },

        {
            securityGroupName: 'app-sg',
            description: 'Security group for application servers',
            allowAllOutbound: false,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(8080),
                    description: 'Allow traffic from VPC'
                }
            ],
            egress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(5432),
                    description: 'Allow database access'
                }
            ],
            tags: {
                Environment: 'prod',
                Component: 'app',
                Phase: '1'
            }
        },

        {
            securityGroupName: 'db-sg',
            description: 'Security group for database servers',
            allowAllOutbound: false,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(5432),
                    description: 'Allow PostgreSQL traffic from VPC'
                }
            ],
            tags: {
                Environment: 'prod',
                Component: 'database',
                Phase: '1'
            }
        },

        {
            securityGroupName: 'monitoring-sg',
            description: 'Security group for monitoring servers',
            allowAllOutbound: false,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(9100),
                    description: 'Allow Prometheus metrics'
                },
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(3000),
                    description: 'Allow Grafana'
                }
            ],
            tags: {
                Environment: 'prod',
                Component: 'monitoring',
                Phase: '1'
            }
        },

        // Phase 2: Security groups with L1 rules for cross-stack dependencies
        {
            securityGroupName: 'web-app-bridge',
            description: 'Bridge security group for web to app communication',
            allowAllOutbound: false,
            // L1 rules will be processed in Phase 2
            l1Ingress: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 8080,
                    toPort: 8080,
                    description: 'Allow web servers to communicate with app servers',
                    sourceSecurityGroupId: 'web-sg' // References web-sg from Phase 1
                }
            ],
            tags: {
                Environment: 'prod',
                Component: 'bridge',
                Phase: '2'
            }
        },

        {
            securityGroupName: 'app-db-bridge',
            description: 'Bridge security group for app to database communication',
            allowAllOutbound: false,
            l1Ingress: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 5432,
                    toPort: 5432,
                    description: 'Allow app servers to communicate with database',
                    sourceSecurityGroupId: 'app-sg' // References app-sg from Phase 1
                }
            ],
            tags: {
                Environment: 'prod',
                Component: 'bridge',
                Phase: '2'
            }
        },

        {
            securityGroupName: 'monitoring-bridge',
            description: 'Bridge security group for monitoring communication',
            allowAllOutbound: false,
            l1Ingress: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 8080,
                    toPort: 8080,
                    description: 'Allow monitoring to access app metrics',
                    sourceSecurityGroupId: 'monitoring-sg' // References monitoring-sg from Phase 1
                },
                {
                    ipProtocol: 'tcp',
                    fromPort: 5432,
                    toPort: 5432,
                    description: 'Allow monitoring to access database metrics',
                    sourceSecurityGroupId: 'monitoring-sg' // References monitoring-sg from Phase 1
                }
            ],
            l1Egress: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 8080,
                    toPort: 8080,
                    description: 'Allow app to send metrics to monitoring',
                    destinationSecurityGroupId: 'app-sg', // References app-sg from Phase 1
                    groupId: 'placeholder' // Will be overridden in Phase 2
                }
            ],
            tags: {
                Environment: 'prod',
                Component: 'bridge',
                Phase: '2'
            }
        }
    ]
};

/**
 * Large-scale example with many security groups and cross-stack L1 rules
 */
export const largeScaleExampleConfig: SecurityGroupsConfig = {
    version: 'v1',
    securityGroups: [
        // Phase 1: Create 500 security groups with inline rules
        ...Array.from({ length: 500 }, (_, i) => ({
            securityGroupName: `sg-${i}`,
            description: `Security group ${i}`,
            allowAllOutbound: true,
            ingress: [
                {
                    peer: ec2.Peer.anyIpv4(),
                    port: ec2.Port.tcp(80),
                    description: 'Allow HTTP traffic'
                }
            ],
            tags: {
                Environment: 'prod',
                Component: `component-${i % 10}`,
                Index: i.toString(),
                Phase: '1'
            }
        })),

        // Phase 2: Create bridge security groups with L1 rules
        ...Array.from({ length: 200 }, (_, i) => ({
            securityGroupName: `bridge-${i}`,
            description: `Bridge security group ${i}`,
            allowAllOutbound: false,
            l1Ingress: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 8080 + (i % 100),
                    toPort: 8080 + (i % 100),
                    description: `Cross-stack rule ${i}`,
                    sourceSecurityGroupId: `sg-${i}` // References sg from Phase 1
                }
            ],
            l1Egress: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 8080 + (i % 100),
                    toPort: 8080 + (i % 100),
                    description: `Cross-stack egress rule ${i}`,
                    destinationSecurityGroupId: `sg-${(i + 1) % 500}`, // References next sg from Phase 1
                    groupId: 'placeholder' // Will be overridden in Phase 2
                }
            ],
            tags: {
                Environment: 'prod',
                Component: 'bridge',
                Index: i.toString(),
                Phase: '2'
            }
        }))
    ]
};