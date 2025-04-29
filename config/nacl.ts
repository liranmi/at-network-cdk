import { NaclConfig } from '../lib/types/nacl';

export const naclConfigs: NaclConfig[] = [
  {
    name: 'public-nacl',
    rules: [
      {
        ruleNumber: 100,
        protocol: -1,  // All traffic
        action: 'allow',
        cidr: '0.0.0.0/0',
        egress: false
      },
      {
        ruleNumber: 100,
        protocol: -1,  // All traffic
        action: 'allow',
        cidr: '0.0.0.0/0',
        egress: true
      }
    ],
    subnetIds: ['123456789']
  },
  {
    name: 'private-nacl',
    rules: [
      {
        ruleNumber: 100,
        protocol: 6,  // TCP
        action: 'allow',
        cidr: '10.0.0.0/16',
        fromPort: 0,
        toPort: 65535,
        egress: false
      }
    ],
    subnetIds: ['123456']
  }
];