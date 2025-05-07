import { IAspect, CfnResource, Resource } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

export class NamingConventionAspect implements IAspect {
    constructor(private readonly prefix: string) { }

    visit(node: IConstruct): void {
        // Only enforce on low-level CloudFormation resources
        if (node instanceof CfnResource) {
            const logicalId = node.node.id;
            if (!logicalId.startsWith(this.prefix)) {
                console.warn(`Resource "${logicalId}" does not follow the naming convention.Expected prefix: "${this.prefix}"`);
            }
        }
    }
}