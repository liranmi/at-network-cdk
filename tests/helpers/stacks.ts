import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Template } from 'aws-cdk-lib/assertions';

/**
 * Recursively collects all Stack instances (including nested stacks) under the given root stack.
 * @param root The root Stack to start traversal from.
 * @returns An array of all Stack instances found (including the root).
 */
export function getAllStacks(root: Stack): Stack[] {
    const stacks: Stack[] = [];
    function recurse(construct: Construct) {
        if (construct instanceof Stack) {
            stacks.push(construct);
        }
        for (const child of construct.node.children) {
            recurse(child as Construct);
        }
    }
    recurse(root);
    return stacks;
}

/**
 * Counts the total number of resources of a given type across all provided stacks.
 * @param stacks Array of Stack instances to search.
 * @param resourceType The CloudFormation resource type (e.g., 'AWS::EC2::SecurityGroup').
 * @returns The total count of resources of the given type.
 */
export function countResourcesAcrossStacks(stacks: Stack[], resourceType: string): number {
    return stacks.reduce((sum, stack) => {
        const template = Template.fromStack(stack);
        return sum + Object.keys(template.findResources(resourceType)).length;
    }, 0);
}
