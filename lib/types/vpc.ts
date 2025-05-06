import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { CfnSubnetProps, SubnetType, SubnetConfiguration } from 'aws-cdk-lib/aws-ec2';

export interface VpcConfig extends ec2.CfnVPCProps {
  /**
   * Subnet definitions. Each entry is processed via splitSubnetConfigs to
   * feed the L2 VPC construct and/or L1 CfnSubnet resources.
   */

  readonly subnetConfigs?: SubnetConfig[];
}

/**
 * SubnetConfig mirrors all properties of the low-level CfnSubnet construct.
 * We can later layer on higher-level abstractions (e.g. maxAzs) around this base.
 */
export interface SubnetConfig extends CfnSubnetProps {
  /**
   * A friendly name for the subnet group or resource ID prefix.
   */
  readonly name: string;
  /**
   * L2 SubnetType hint. Must always be provided so we know how to categorize in L2.
   */
  readonly subnetType: SubnetType;
}

export function maskFromCidr(cidr: string): number {
  const parts = cidr.split('/');
  if (parts.length !== 2) {
    throw new Error(`invalid CIDR: ${cidr}`);
  }
  return parseInt(parts[1], 10);
}