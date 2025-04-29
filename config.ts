// Configuration for VPC, Security Groups, and NACLs
export interface VpcConfig {
  cidr: string;
  maxAzs: number;
}

export interface SecurityGroupConfig {
  name: string;
  description: string;
  allowAllOutbound: boolean;
}

export interface NaclConfig {
  name: string;
  subnetSelection: string;
}

export interface AppConfig {
  vpc: VpcConfig;
  securityGroups: SecurityGroupConfig[];
  nacls: NaclConfig[];
}

export const config: AppConfig = {
  vpc: {
    cidr: '10.0.0.0/16',
    maxAzs: 2,
  },
  securityGroups: [
    {
      name: 'default-sg',
      description: 'Default security group',
      allowAllOutbound: true,
    },
  ],
  nacls: [
    {
      name: 'default-nacl',
      subnetSelection: 'all',
    },
  ],
};
