
import { prodVpcConfig } from './prod/vpc-config';

import { prodSecurityGroupsConfig } from './prod/security-group-config';

export const vpcConfigs = {
    prod: prodVpcConfig,
} as const;

export const securityGroupConfigs = {
    prod: prodSecurityGroupsConfig,
} as const;

export type EnvName = keyof typeof vpcConfigs;
