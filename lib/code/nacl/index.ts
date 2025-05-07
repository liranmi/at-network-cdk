import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as v1 from './v1';
import { NaclConfig as V1NaclConfig } from '../../types/v1/nacl';

/**
 * Factory function to create the appropriate version of the CustomNetworkAcl construct
 * based on the version specified in the config.
 */
export function createNetworkAcl(scope: Construct, id: string, props: {
    vpc: ec2.IVpc;
    config: any;
}): {
    networkAcl: ec2.CfnNetworkAcl;
} {
    // Determine which version to use based on the config
    // Default to v1 if no version is specified
    const version = props.config.version || 'v1';

    switch (version) {
        case 'v1':
            return new v1.CustomNetworkAcl(scope, id, {
                vpc: props.vpc,
                config: props.config as V1NaclConfig,
            });
        default:
            // Default to v1 for unknown versions
            console.warn(`Unknown NACL version: ${version}. Using v1 as fallback.`);
            return new v1.CustomNetworkAcl(scope, id, {
                vpc: props.vpc,
                config: props.config as V1NaclConfig,
            });
    }
}

// Re-export the v1 implementation for backward compatibility
export { CustomNetworkAcl } from './v1'; 