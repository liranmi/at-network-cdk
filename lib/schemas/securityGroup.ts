import * as ec2 from 'aws-cdk-lib/aws-ec2';

/**
 * L2 rule configuration using CDK's Port class
 */
export interface L2SecurityGroupRule {
    /**
     * Peer to connect to
     */
    peer: ec2.IPeer;

    /**
     * Port range to allow
     */
    port: ec2.Port;

    /**
     * Description of the rule
     */
    description?: string;
}

export interface SecurityGroupConfig extends Omit<ec2.SecurityGroupProps, 'vpc'> {
    /**
     * List of ingress rules (L2 - inlined)
     */
    ingress?: L2SecurityGroupRule[];

    /**
     * List of egress rules (L2 - inlined)
     */
    egress?: L2SecurityGroupRule[];

    /**
     * Optional L1 ingress rules for custom protocols
     */
    l1Ingress?: ec2.CfnSecurityGroupIngressProps[];

    /**
     * Optional L1 egress rules for custom protocols
     */
    l1Egress?: ec2.CfnSecurityGroupEgressProps[];

    /**
     * Tags to apply to the security group
     */
    readonly tags?: { [key: string]: string };
}

export interface SecurityGroupsConfig {
    /**
     * Version identifier for the config
     */
    readonly version?: 'v1';

    /**
     * List of security group configurations
     */
    readonly securityGroups: SecurityGroupConfig[];
} 