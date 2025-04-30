import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface VpcConfig {
  name?: string;
  cidr?: string;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
  defaultInstanceTenancy?: ec2.DefaultInstanceTenancy;
  maxAzs?: number;
  ipv4IpamPoolId?: string;
  ipv4NetmaskLength?: number;
  tags?: Record<string, string>;
}