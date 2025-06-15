import { vpcConfig as defaultVpcConfig } from './default/vpc-config';
import { securityGroupConfig as defaultSecurityGroupConfig } from './default/security-group-config';

export const vpcConfigs = {
    default: defaultVpcConfig,
} as const;

export const securityGroupConfigs = {
    default: defaultSecurityGroupConfig,
} as const;

export type EnvName = keyof typeof vpcConfigs;
