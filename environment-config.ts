import { EnvironmentConfig } from './lib/schemas/environment';

/**
 * Project version - used to track template compatibility
 */
export const AT_NETWORK_L2_VERSION = 'v1' as const;

export const environmentConfig: EnvironmentConfig = {
    environments: {
        default: {
            account: null,
            region: 'eu-west-1'
        }
    }
}; 