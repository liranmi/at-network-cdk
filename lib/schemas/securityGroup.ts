import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface SecurityGroupConfig extends Omit<ec2.SecurityGroupProps, 'vpc'> {
    /**
     * List of ingress rules
     */
    ingress?: {
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
    }[];

    /**
     * List of egress rules
     */
    egress?: {
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
    }[];

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