import { IAspect, CfnResource } from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

export class TaggingAspect implements IAspect {
    constructor(private readonly key: string, private readonly value: string) { }

    visit(node: IConstruct): void {
        if (!(node instanceof CfnResource)) return;

        // Avoid tagging if already tagged
        const tagManager = Tags.of(node);

        // 🔐 Internal tag check workaround
        const existingTags = (tagManager as any)._tags || [];
        const alreadyTagged = existingTags.some((tag: any) => tag.key === this.key);

        if (!alreadyTagged) {
            tagManager.add(this.key, this.value);
        }
    }
}