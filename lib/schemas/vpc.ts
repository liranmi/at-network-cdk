import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';

export interface VpcConfig extends ec2.VpcProps {
    /**
     * Subnet definitions. Each entry is processed via splitSubnetConfigs to
     * feed the L2 VPC construct and/or L1 CfnSubnet resources.
     */
    readonly subnetConfigs?: SubnetConfig[];

    /**
     * Version identifier for the config
     */
    readonly version?: 'v1';

    /**
     * Tags to apply to the VPC
     */
    readonly tags?: { [key: string]: string };

    /**
     * Maximum number of AZs to use
     */
    readonly maxAzs?: number;
}

/**
 * SubnetConfig extends the L2 subnet properties with additional properties.
 */
export interface SubnetConfig extends ec2.SubnetProps {
    /**
     * A friendly name for the subnet group or resource ID prefix.
     */
    readonly name: string;
}
