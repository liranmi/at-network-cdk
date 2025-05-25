import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroupsConfig } from '../../lib/schemas/securityGroup';

export const devSecurityGroupsConfig: SecurityGroupsConfig = {
    version: 'v1',
    securityGroups: [
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
        {
            securityGroupName: 'app-sg',
            description: 'Security group for application servers',
            allowAllOutbound: true,
            ingress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(8080),
                    description: 'Allow traffic from VPC to application port'
                }
            ]
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
            egress: [
                {
                    peer: ec2.Peer.ipv4('10.0.0.0/16'),
                    port: ec2.Port.tcp(5432),
                    description: 'Allow PostgreSQL traffic to VPC'
                }
            ]
        },
        {
            securityGroupName: 'bastion-sg',
            description: 'Security group for bastion hosts',
            allowAllOutbound: true,
            ingress: [
                {
                    peer: ec2.Peer.anyIpv4(),
                    port: ec2.Port.tcp(22),
                    description: 'Allow SSH access from anywhere'
                }
            ]
        }
    ],
    tags: {
        Environment: 'dev',
        Project: 'my-project'
    }
}; 