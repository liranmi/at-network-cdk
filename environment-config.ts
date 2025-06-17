/**
 * Project version - used to track template compatibility
 */
export const AT_NETWORK_L2_VERSION = 'v1' as const;

interface EnvironmentConfig {
    environments: {
        [key: string]: {
            account: string | null;
            region: string | null;
            stackNames?: {
                vpcStack?: string;
                securityGroupStack?: string;
            };
            tags?: {
                [key: string]: string; // Allow additional environment-specific tags
            };
            synthesizer?: {
                fileAssetsBucketName?: string;
                bucketPrefix?: string;
            };
        };
    };
    globalTags?: {
        [key: string]: string; // Allow additional global tags
    };
}

export const environmentConfig: EnvironmentConfig = {
    environments: {
        default: {
            account: null,
            region: 'eu-west-1'
        }
    }
}; 