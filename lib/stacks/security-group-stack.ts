import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroupsConfig, SecurityGroupConfig, L2SecurityGroupRule } from '../schemas/securityGroup';
import { Tags } from 'aws-cdk-lib';

export interface SecurityGroupStackProps extends cdk.StackProps {
    vpc: ec2.IVpc;
    securityGroupsConfig: SecurityGroupsConfig;
}

export class SecurityGroupStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: SecurityGroupStackProps) {
        super(scope, id, props);

        const { securityGroups } = props.securityGroupsConfig;
        const batchSize = 480; // CloudFormation resource limit with buffer

        // If no security groups to process, return early
        if (securityGroups.length === 0) {
            cdk.Annotations.of(this).addInfo('No security groups to process');
            return;
        }

        // Build batches dynamically based on actual resource count
        const batches = this.buildBatches(securityGroups, batchSize);

        // If only one batch, create security groups directly in this stack
        if (batches.length === 1) {
            const [start, end] = batches[0];
            for (let i = start; i < end; i++) {
                this.createSecurityGroup(this, securityGroups[i], i, props.vpc);
            }
            return;
        }

        // Create nested stacks for each batch
        batches.forEach(([start, end], batchIndex) => {
            const nestedStack = new cdk.NestedStack(this, `security-group-stack-${batchIndex}`, {
                description: `Security Group Stack ${batchIndex + 1} of ${batches.length}`
            });

            for (let i = start; i < end; i++) {
                this.createSecurityGroup(nestedStack, securityGroups[i], i, props.vpc);
            }
        });
    }

    private createSecurityGroup(scope: Construct, sgConfig: SecurityGroupConfig, index: number, vpc: ec2.IVpc): void {
        // Deconstruct the security group config
        const { ingress, egress, l1Ingress, l1Egress, ...securityGroupProps } = sgConfig;

        // Create the security group
        const securityGroup = new ec2.SecurityGroup(scope, sgConfig.securityGroupName || `SecurityGroup-${index}`, {
            ...securityGroupProps,
            vpc
        });

        // Add L2 rules
        this.addL2Rules(securityGroup, ingress, egress);

        // Add L1 rules as children of the security group
        this.addL1Rules(securityGroup, l1Ingress, l1Egress);

        // Add tags if defined
        if (sgConfig.tags) {
            Object.entries(sgConfig.tags).forEach(([key, value]) => {
                Tags.of(securityGroup).add(key, value);
            });
        }
    }

    private addL2Rules(
        securityGroup: ec2.SecurityGroup,
        ingress?: L2SecurityGroupRule[],
        egress?: L2SecurityGroupRule[]
    ): void {
        // Add ingress rules if defined
        if (ingress) {
            ingress.forEach(rule => {
                securityGroup.addIngressRule(
                    rule.peer,
                    rule.port,
                    rule.description
                );
            });
        }

        // Add egress rules if defined
        if (egress) {
            egress.forEach(rule => {
                securityGroup.addEgressRule(
                    rule.peer,
                    rule.port,
                    rule.description
                );
            });
        }
    }

    private addL1Rules(
        securityGroup: ec2.SecurityGroup,
        l1Ingress?: ec2.CfnSecurityGroupIngressProps[],
        l1Egress?: ec2.CfnSecurityGroupEgressProps[]
    ): void {
        // Add L1 ingress rules as children of the security group
        if (l1Ingress) {
            l1Ingress.forEach((rule, index) => {
                new ec2.CfnSecurityGroupIngress(securityGroup, `L1Ingress-${index}`, {
                    ...rule,
                    groupId: securityGroup.securityGroupId
                });
            });
        }

        // Add L1 egress rules as children of the security group
        if (l1Egress) {
            l1Egress.forEach((rule, index) => {
                new ec2.CfnSecurityGroupEgress(securityGroup, `L1Egress-${index}`, {
                    ...rule,
                    groupId: securityGroup.securityGroupId
                });
            });
        }
    }

    private buildBatches(securityGroups: SecurityGroupConfig[], batchSize: number): [number, number][] {
        const batches: [number, number][] = [];
        let currentStart = 0;
        let currentResourceCount = 0;

        for (let i = 0; i < securityGroups.length; i++) {
            const sg = securityGroups[i];
            const sgResourceCount = 1 + (sg.l1Ingress?.length || 0) + (sg.l1Egress?.length || 0);

            // If adding this SG would exceed batch size, start a new batch
            if (currentResourceCount + sgResourceCount > batchSize && currentStart < i) {
                batches.push([currentStart, i]);
                currentStart = i;
                currentResourceCount = 0;
            }

            currentResourceCount += sgResourceCount;
        }

        // Add the final batch
        if (currentStart < securityGroups.length) {
            batches.push([currentStart, securityGroups.length]);
        }

        return batches;
    }
} 