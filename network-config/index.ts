// network-config/index.ts
import { devVpcConfig } from './dev/vpc-config';
import { testVpcConfig } from './test/vpc-config';
import { prodVpcConfig } from './prod/vpc-config';
import { devSecurityGroupsConfig } from './dev/security-group-config';
import { testSecurityGroupsConfig } from './test/security-group-config';
import { prodSecurityGroupsConfig } from './prod/security-group-config';

export const vpcConfigs = {
    dev: devVpcConfig,
    test: testVpcConfig,
    prod: prodVpcConfig,
} as const;

export const securityGroupConfigs = {
    dev: devSecurityGroupsConfig,
    test: testSecurityGroupsConfig,
    prod: prodSecurityGroupsConfig,
} as const;

export type EnvName = keyof typeof vpcConfigs;
