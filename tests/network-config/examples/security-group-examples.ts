import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroupsConfig } from '../../../lib/schemas/securityGroup';

/**
 * Base security group configuration with common settings.
 * Can be extended or overridden by environment-specific configs.
 */
const baseSecurityGroupsConfig: Partial<SecurityGroupsConfig> = {
    version: 'v1',
    tags: {
        Project: 'my-project'
    }
};

/**
 * Development security group configuration.
 * More permissive rules for development environment.
 */
export const devSecurityGroupsConfig: SecurityGroupsConfig = {
    ...baseSecurityGroupsConfig,
    securityGroups: [
        // Web Server Security Group
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
            ]
        },
        // Application Server Security Group
        {
            securityGroupName: 'app-sg',
            description: 'Security group for application servers',
            allowAllOutbound: true,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(8080),
                    description: 'Allow traffic from VPC'
                }
            ]
        },
        // Database Server Security Group
        {
            securityGroupName: 'db-sg',
            description: 'Security group for database servers',
            allowAllOutbound: false,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(5432),
                    description: 'Allow PostgreSQL from VPC'
                }
            ],
            egress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(5432),
                    description: 'Allow outbound PostgreSQL'
                }
            ]
        },
        // Bastion Host Security Group
        {
            securityGroupName: 'bastion-sg',
            description: 'Security group for bastion hosts',
            allowAllOutbound: true,
            ingress: [
                {
                    peer: ec2.Peer.anyIpv4(),
                    port: ec2.Port.tcp(22),
                    description: 'Allow SSH from anywhere'
                }
            ]
        }
    ],
    tags: {
        Environment: 'dev',
        Project: 'my-project'
    }
};

/**
 * Production security group configuration.
 * More restrictive rules for production environment.
 */
export const prodSecurityGroupsConfig: SecurityGroupsConfig = {
    ...baseSecurityGroupsConfig,
    securityGroups: [
        // Web Server Security Group
        {
            securityGroupName: 'web-sg',
            description: 'Security group for web servers',
            allowAllOutbound: false,
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
            egress: [
                {
                    peer: ec2.Peer.ipv4('172.16.0.0/16'),
                    port: ec2.Port.tcp(8080),
                    description: 'Allow outbound to app servers'
                }
            ]
        },
        // Application Server Security Group
        {
            securityGroupName: 'app-sg',
            description: 'Security group for application servers',
            allowAllOutbound: false,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('172.16.0.0/16'),
                    port: ec2.Port.tcp(8080),
                    description: 'Allow traffic from web servers'
                }
            ],
            egress: [
                {
                    peer: ec2.Peer.ipv4('172.16.0.0/16'),
                    port: ec2.Port.tcp(5432),
                    description: 'Allow outbound to database'
                }
            ]
        },
        // Database Server Security Group
        {
            securityGroupName: 'db-sg',
            description: 'Security group for database servers',
            allowAllOutbound: false,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('172.16.0.0/16'),
                    port: ec2.Port.tcp(5432),
                    description: 'Allow PostgreSQL from app servers'
                }
            ],
            egress: [
                {
                    peer: ec2.Peer.ipv4('172.16.0.0/16'),
                    port: ec2.Port.tcp(5432),
                    description: 'Allow outbound PostgreSQL'
                }
            ]
        },
        // Bastion Host Security Group
        {
            securityGroupName: 'bastion-sg',
            description: 'Security group for bastion hosts',
            allowAllOutbound: false,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('172.16.0.0/16'),
                    port: ec2.Port.tcp(22),
                    description: 'Allow SSH from VPC'
                }
            ],
            egress: [
                {
                    peer: ec2.Peer.ipv4('172.16.0.0/16'),
                    port: ec2.Port.tcp(22),
                    description: 'Allow outbound SSH'
                }
            ]
        }
    ],
    tags: {
        Environment: 'prod',
        Project: 'my-project'
    }
};

/**
 * Large security group configuration for testing nested stacks.
 * Creates 600 security groups to test the nested stack functionality.
 */
export const largeSecurityGroupsConfig: SecurityGroupsConfig = {
    ...baseSecurityGroupsConfig,
    securityGroups: Array.from({ length: 600 }, (_, i) => ({
        securityGroupName: `sg-${i}`,
        description: `Security group ${i}`,
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
        egress: [
            {
                peer: ec2.Peer.anyIpv4(),
                port: ec2.Port.allTraffic(),
                description: 'Allow all outbound traffic'
            }
        ]
    })),
    tags: {
        Environment: 'test',
        Project: 'my-project'
    }
}; 