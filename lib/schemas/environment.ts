/**
 * Environment configuration schema
 */

export interface EnvironmentConfig {
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