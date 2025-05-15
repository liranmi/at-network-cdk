import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as v1 from './v1';
import { VpcConfig as V1VpcConfig } from '../../schemas/vpc';

/**
 * Factory function to create the appropriate version of the CustomVpc construct
 * based on the version specified in the config.
 */
export function createVpc(scope: Construct, id: string, props: { vpcConfig: any }): {
    vpc: ec2.Vpc;
} {
    // Determine which version to use based on the config
    // Default to v1 if no version is specified
    const version = props.vpcConfig.version || 'v1';

    switch (version) {
        case 'v1':
            return new v1.CustomVpc(scope, id, {
                vpcConfig: props.vpcConfig as V1VpcConfig
            });
        default:
            // Default to v1 for unknown versions
            console.warn(`Unknown VPC version: ${version}. Using v1 as fallback.`);
            return new v1.CustomVpc(scope, id, {
                vpcConfig: props.vpcConfig as V1VpcConfig
            });
    }
}

// Re-export the v1 implementation for backward compatibility
export { CustomVpc } from './v1'; 