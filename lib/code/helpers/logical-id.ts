import { CfnResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Overrides the logical ID of a CDK construct to match L1 construct naming.
 * This is useful when you want to maintain consistent resource names across deployments
 * or match existing CloudFormation templates.
 * 
 * @param construct The CDK construct to override
 * @param logicalId The desired logical ID
 * @returns The construct with overridden logical ID
 */
export function overrideLogicalId(construct: Construct, logicalId: string): Construct {
    const cfnResource = construct.node.defaultChild as CfnResource;
    if (cfnResource) {
        cfnResource.overrideLogicalId(logicalId);
    }
    return construct;
}

/**
 * Overrides the logical IDs of multiple CDK constructs to match L1 construct naming.
 * This is useful when you want to maintain consistent resource names across deployments
 * or match existing CloudFormation templates.
 * 
 * @param constructs Array of constructs and their desired logical IDs
 */
export function overrideLogicalIds(constructs: Array<{ construct: Construct; logicalId: string }>): void {
    constructs.forEach(({ construct, logicalId }) => {
        overrideLogicalId(construct, logicalId);
    });
}

/**
 * Type guard to check if a construct is a CfnResource
 * @param construct The construct to check
 * @returns True if the construct is a CfnResource
 */
export function isCfnResource(construct: Construct): construct is CfnResource {
    return construct instanceof CfnResource;
} 