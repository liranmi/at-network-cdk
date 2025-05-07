// network-config/index.ts
import { devVpcConfig } from './dev/vpc-config';
import { devNaclConfigs } from './dev/nacl-config';
import { testVpcConfig } from './test/vpc-config';
import { testNaclConfigs } from './test/nacl-config';
import { prodVpcConfig } from './prod/vpc-config';
import { prodNaclConfigs } from './prod/nacl-config';

export const vpcConfigs = {
    dev: devVpcConfig,
    test: testVpcConfig,
    prod: prodVpcConfig,
} as const;

export const naclConfigsByEnv = {
    dev: devNaclConfigs,
    test: testNaclConfigs,
    prod: prodNaclConfigs,
} as const;

export type EnvName = keyof typeof vpcConfigs;
