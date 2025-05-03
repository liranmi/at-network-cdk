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
 * Classifies raw subnet descriptions into:
 *  – l2Configs   → safe to pass to Vpc.addSubnet() (SubnetConfiguration)
 *  – l1Configs   → must be created as CfnSubnet to preserve all flags
 */
export function splitSubnetConfigs(
  configs: SubnetConfig[],
): {
  l2Configs: SubnetConfiguration[];
  l1Configs: SubnetConfig[];
} {
  // Props that SubnetConfiguration understands today
  const SIMPLE_KEYS = new Set([
    'name',                          // logical name
    'subnetType',                    // PUBLIC | PRIVATE_ISOLATED | PRIVATE_WITH_EGRESS
    'cidrBlock',                     // required by L2
    'mapPublicIpOnLaunch',           // same meaning in both layers
    'assignIpv6AddressOnCreation',   // ↔︎ ipv6AssignAddressOnCreation
    'ipv6CidrBlock',                 // optional dual‑stack
  ]);

  const l2Configs: SubnetConfiguration[] = [];
  const l1Configs: SubnetConfig[] = [];

  for (const cfg of configs) {
    const keys = Object.keys(cfg).filter(
      k => (cfg as any)[k] !== undefined,           // keep only set props
    );

    const l2Safe =
      cfg.cidrBlock !== undefined &&                // L2 insists on IPv4 block
      keys.every(k => SIMPLE_KEYS.has(k));          // only simple fields present

    if (!l2Safe) {
      // Anything exotic (IPAM, enableDns64, ipv6Native, Outposts, …) falls back to L1
      l1Configs.push(cfg);
      continue;
    }

    // ---------- translate to SubnetConfiguration ----------
    const cidrMask = parseInt(cfg.cidrBlock.split('/')[1], 10);

    l2Configs.push({
      name: cfg.name,
      subnetType: cfg.subnetType,
      cidrMask,
      mapPublicIpOnLaunch: cfg.mapPublicIpOnLaunch as boolean,
      ipv6AssignAddressOnCreation: cfg.assignIpv6AddressOnCreation as boolean,
    });
  }

  return { l2Configs, l1Configs };
}

