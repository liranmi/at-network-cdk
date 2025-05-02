import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { CfnSubnetProps, SubnetType, SubnetConfiguration } from 'aws-cdk-lib/aws-ec2';

export interface VpcConfig extends ec2.CfnVPCProps {
  /**
   * Subnet definitions. Each entry is processed via splitSubnetConfigs to
   * feed the L2 VPC construct and/or L1 CfnSubnet resources.
   */

  readonly subnetConfigs?: SubnetConfig[];
  readonly maxAzs?: number;
}

/* export interface VpcConfig {
  vpcId?: string;
  cidr?: string;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
  defaultInstanceTenancy?: ec2.DefaultInstanceTenancy;
  maxAzs?: number;
  ipv4IpamPoolId?: string;
  ipv4NetmaskLength?: number;
  tags?: Record<string, string>;
} */

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

/**
 * Splits an array of SubnetConfig into:
 *  - l2Configs: SubnetConfiguration[] suitable for Vpc.subnetConfiguration
 *  - l1Configs: SubnetConfig[] suitable for later CfnSubnet creation
 */
export function splitSubnetConfigs(
  configs: SubnetConfig[]
): {
  l2Configs: SubnetConfiguration[];
  l1Configs: SubnetConfig[];
} {
  const l2Configs: SubnetConfiguration[] = [];
  const l1Configs: SubnetConfig[] = [];

  for (const cfg of configs) {
    const hasAdvanced =
      cfg.ipv6CidrBlock !== undefined ||
      cfg.assignIpv6AddressOnCreation !== undefined ||
      cfg.enableDns64 !== undefined ||
      cfg.outpostArn !== undefined;

    if (hasAdvanced) {
      // Defer advanced cases to L1 (CfnSubnet)
      l1Configs.push(cfg);
    } else {
      // Translate L1 props to L2 SubnetConfiguration
      // Extract mask from cidrBlock, e.g. '10.0.1.0/24'
      const [_, maskStr] = cfg.cidrBlock!.split('/');
      const cidrMask = parseInt(maskStr, 10);

      const subnetConfig: SubnetConfiguration = {
        name: cfg.name,
        subnetType: cfg.subnetType,
        cidrMask,
        // L2 mapPublicIpOnLaunch matches Cfn's mapPublicIpOnLaunch
        mapPublicIpOnLaunch: cfg.mapPublicIpOnLaunch as boolean,
        // If user set assignIpv6AddressOnCreation, translate to ipv6AssignAddressOnCreation
        ipv6AssignAddressOnCreation: cfg.assignIpv6AddressOnCreation,
      };

      l2Configs.push(subnetConfig);
    }
  }

  return { l2Configs, l1Configs };
}
