import { NaclConfig } from '../../lib/schemas/nacl';

export const devNaclConfigs = [
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
        subnetIds: []  // User will need to fill these in
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
        subnetIds: []  // User will need to fill these in
    }
] as NaclConfig[]; 