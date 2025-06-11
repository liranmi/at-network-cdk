import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';

export interface VpcConfig extends ec2.VpcProps {
    /**
     * Version identifier for the config
     */
    readonly version?: 'v1';

    /**
     * Tags to apply to the VPC
     */
    readonly tags?: { [key: string]: string };

    /**
     * Subnet definitions. Each entry is processed via splitSubnetConfigs to
     * feed the L2 VPC construct and/or L1 CfnSubnet resources.
     */
    readonly subnetConfigs?: SubnetConfig[];

    /**
     * Whether to restrict the default security group
     * 
     * When set to true, the default security group will have no inbound or outbound rules.
     * This is a security best practice as the default security group is often forgotten and can
     * become a security risk if left with permissive rules.
     * 
     * Security Impact:
     * - Prevents accidental exposure through the default security group
     * - Forces explicit security group creation and configuration
     * - Reduces the attack surface of your VPC
     * 
     * @default false
     */
    readonly restrictDefaultSecurityGroup?: boolean;

    /**
     * VPC Flow Logs configuration
     * 
     * When enabled, VPC Flow Logs will capture information about the IP traffic going to and from network interfaces in your VPC.
     * Flow log data is stored using CloudWatch Logs.
     * 
     * Benefits:
     * - Network monitoring and troubleshooting
     * - Security analysis
     * - Network performance optimization
     * 
     * Note: Enabling Flow Logs may incur additional costs for CloudWatch Logs storage and data transfer.
     * 
     * @example
     * ```typescript
     * flowLogs: {
     *   s3: {
     *     destination: ec2.FlowLogDestination.toS3(bucket),
     *     trafficType: ec2.FlowLogTrafficType.ALL
     *   }
     * }
     * ```
     */
    readonly flowLogs?: { [key: string]: ec2.FlowLogOptions };
}

/**
 * SubnetConfig extends the L2 subnet properties with additional properties.
 */
export interface SubnetConfig extends ec2.SubnetProps {
    /**
     * A friendly name for the subnet group or resource ID prefix.
     */
    readonly name: string;

    /**
     * Tags to apply to the Subnet
     */
    readonly tags?: { [key: string]: string };
}
