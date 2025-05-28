import { IAspect, CfnResource, Resource, Annotations } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

/**
 * Type of naming convention to enforce
 */
export type NamingConventionType = 'prefix' | 'suffix' | 'contains';

/**
 * An aspect that enforces naming conventions on CloudFormation resources.
 * 
 * Usage:
 * ```typescript
 * const app = new cdk.App();
 * // Enforce prefix
 * Aspects.of(app).add(new NamingConventionAspect('MyApp', 'prefix'));
 * // Enforce suffix
 * Aspects.of(app).add(new NamingConventionAspect('Prod', 'suffix'));
 * // Enforce contains
 * Aspects.of(app).add(new NamingConventionAspect('Network', 'contains'));
 * ```
 */
export class NamingConventionAspect implements IAspect {
    constructor(
        private readonly pattern: string,
        private readonly type: NamingConventionType = 'prefix'
    ) { }

    visit(node: IConstruct): void {
        // Only enforce on low-level CloudFormation resources
        if (node instanceof CfnResource) {
            const logicalId = node.node.id;
            let isValid = false;

            switch (this.type) {
                case 'prefix':
                    isValid = logicalId.startsWith(this.pattern);
                    break;
                case 'suffix':
                    isValid = logicalId.endsWith(this.pattern);
                    break;
                case 'contains':
                    isValid = logicalId.includes(this.pattern);
                    break;
            }

            if (!isValid) {
                Annotations.of(node).addWarning(
                    `Resource does not follow the naming convention. Expected ${this.type}: "${this.pattern}"`
                );
            }
        }
    }
}