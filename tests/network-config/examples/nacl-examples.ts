import { NaclConfig } from '../../../lib/schemas/nacl';

/**
 * Example Network ACL configurations for different subnet types.
 * These are example configurations that demonstrate how to use the NACL construct.
 * In a real project, you would typically load configurations from environment-specific files
 * or external configuration sources.
 */

/**
 * Example NACL configurations for public and private subnets.
 * These examples show common NACL rules for different subnet types.
 */
export const naclConfigs: NaclConfig[] = [
    {
        name: 'public-nacl',
        version: 'v1',
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
        version: 'v1',
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