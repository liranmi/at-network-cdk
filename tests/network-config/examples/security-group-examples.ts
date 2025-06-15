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

/**
 * Test security group configuration with comprehensive port configurations.
 * Includes various port types and ranges for testing.
 */
export const testSecurityGroupsConfig: SecurityGroupsConfig = {
    ...baseSecurityGroupsConfig,
    securityGroups: [
        // Web Server Security Group with various port configurations
        {
            securityGroupName: 'web-sg-test',
            description: 'Security group for web servers with comprehensive port configs',
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
                },
                {
                    peer: ec2.Peer.anyIpv4(),
                    port: ec2.Port.tcpRange(8000, 8100),
                    description: 'Allow custom application port range'
                },
                {
                    peer: ec2.Peer.anyIpv4(),
                    port: ec2.Port.allTraffic(),
                    description: 'Allow all traffic (for testing)'
                }
            ],
            egress: [
                {
                    peer: ec2.Peer.anyIpv4(),
                    port: ec2.Port.tcp(80),
                    description: 'Allow outbound HTTP'
                },
                {
                    peer: ec2.Peer.anyIpv4(),
                    port: ec2.Port.tcp(443),
                    description: 'Allow outbound HTTPS'
                }
            ]
        },
        // Application Server Security Group with UDP and ICMP
        {
            securityGroupName: 'app-sg-test',
            description: 'Security group for application servers with UDP and ICMP',
            allowAllOutbound: false,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(8080),
                    description: 'Allow TCP application traffic'
                },
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.udp(53),
                    description: 'Allow DNS traffic'
                },
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.icmpType(8),
                    description: 'Allow ICMP echo requests'
                }
            ],
            egress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(8080),
                    description: 'Allow outbound application traffic'
                },
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.udp(53),
                    description: 'Allow outbound DNS traffic'
                }
            ]
        },
        // Database Server Security Group with specific port ranges
        {
            securityGroupName: 'db-sg-test',
            description: 'Security group for database servers with specific port ranges',
            allowAllOutbound: false,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(5432),
                    description: 'Allow PostgreSQL'
                },
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(27017),
                    description: 'Allow MongoDB'
                },
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcpRange(6379, 6380),
                    description: 'Allow Redis cluster'
                }
            ],
            egress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(5432),
                    description: 'Allow outbound PostgreSQL'
                },
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(27017),
                    description: 'Allow outbound MongoDB'
                }
            ]
        },
        // Monitoring Server Security Group with ICMP and custom protocols
        {
            securityGroupName: 'monitoring-sg-test',
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
                },
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.icmpType(8),
                    description: 'Allow ICMP echo requests'
                },
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.icmpType(0),
                    description: 'Allow ICMP echo replies'
                }
            ],
            egress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(9100),
                    description: 'Allow outbound Prometheus metrics'
                },
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(3000),
                    description: 'Allow outbound Grafana'
                }
            ]
        }
    ],
    tags: {
        Environment: 'test',
        Project: 'my-project'
    }
}; 