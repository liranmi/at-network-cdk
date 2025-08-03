import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroupsConfig, SecurityGroupConfig, L2SecurityGroupRule } from '../schemas/securityGroup';
import { Tags } from 'aws-cdk-lib';

export interface SecurityGroupTwoPhaseProcessorProps extends cdk.StackProps {
    vpc: ec2.IVpc;
    securityGroupsConfig: SecurityGroupsConfig;
}

export class SecurityGroupTwoPhaseProcessor extends cdk.Stack {
    public readonly phase1Stacks: cdk.NestedStack[] = [];
    public readonly phase2Stacks: cdk.NestedStack[] = [];
    public readonly securityGroups: Map<string, ec2.ISecurityGroup> = new Map();
    private readonly stackEnvironment: cdk.Environment | undefined;

    constructor(scope: Construct, id: string, props: SecurityGroupTwoPhaseProcessorProps) {
        super(scope, id, props);

        this.stackEnvironment = props.env;

        const { securityGroupsConfig } = props;
        const { securityGroups } = securityGroupsConfig;

        // Step 1: Create stacks for all security groups (Phase 1)
        this.createPhase1Stacks(securityGroups, props.vpc);

        // Step 2: Collect L1 rules that reference other security groups
        const allL1Rules = this.collectL1Rules(securityGroups);

        // Step 3: Post-process L1 rules and add groupId and source/dest
        const processedL1Rules = this.processL1Rules(allL1Rules);

        // Step 4: Create stacks for L1 rules (Phase 2)
        this.createPhase2Stacks(processedL1Rules);

        // Step 5: Add dependencies between stacks using dependsOn
        this.addStackDependencies();
    }

    private collectL1Rules(securityGroups: SecurityGroupConfig[]): Array<{
        sourceSecurityGroupName: string;
        destinationSecurityGroupName: string;
        l1Ingress?: ec2.CfnSecurityGroupIngressProps;
        l1Egress?: ec2.CfnSecurityGroupEgressProps;
        tags?: { [key: string]: string };
    }> {
        const l1Rules: Array<{
            sourceSecurityGroupName: string;
            destinationSecurityGroupName: string;
            l1Ingress?: ec2.CfnSecurityGroupIngressProps;
            l1Egress?: ec2.CfnSecurityGroupEgressProps;
            tags?: { [key: string]: string };
        }> = [];

        // Collect all security group names for validation
        const allSecurityGroupNames = new Set(securityGroups.map(sg => sg.securityGroupName || 'unknown'));

        securityGroups.forEach((sgConfig, index) => {
            const sgName = sgConfig.securityGroupName || `SecurityGroup-${index}`;

            // Process L1 ingress rules that reference other security groups
            if (sgConfig.l1Ingress) {
                sgConfig.l1Ingress.forEach((l1Rule, ruleIndex) => {
                    // Check if this rule references another security group
                    if (l1Rule.sourceSecurityGroupId) {
                        const referencedSgName = this.extractSecurityGroupNameFromId(l1Rule.sourceSecurityGroupId);
                        if (referencedSgName && allSecurityGroupNames.has(referencedSgName)) {
                            l1Rules.push({
                                sourceSecurityGroupName: referencedSgName,  // The SG that's allowed to connect
                                destinationSecurityGroupName: sgName,        // The SG that receives the connection
                                l1Ingress: l1Rule,  // Only ingress rule, no egress
                                tags: sgConfig.tags
                            });
                        } else {
                            cdk.Annotations.of(this).addWarning(
                                `Skipping L1 ingress rule for '${sgName}': invalid reference to '${l1Rule.sourceSecurityGroupId}'`
                            );
                        }
                    }
                });
            }

            // Process L1 egress rules that reference other security groups
            if (sgConfig.l1Egress) {
                sgConfig.l1Egress.forEach((l1Rule, ruleIndex) => {
                    // Check if this rule references another security group
                    if (l1Rule.destinationSecurityGroupId) {
                        const referencedSgName = this.extractSecurityGroupNameFromId(l1Rule.destinationSecurityGroupId);
                        if (referencedSgName && allSecurityGroupNames.has(referencedSgName)) {
                            l1Rules.push({
                                sourceSecurityGroupName: sgName,            // The SG that initiates the connection
                                destinationSecurityGroupName: referencedSgName,  // The SG that receives the connection
                                l1Egress: l1Rule,  // Only egress rule, no ingress
                                tags: sgConfig.tags
                            });
                        } else {
                            cdk.Annotations.of(this).addWarning(
                                `Skipping L1 egress rule for '${sgName}': invalid reference to '${l1Rule.destinationSecurityGroupId}'`
                            );
                        }
                    }
                });
            }
        });

        cdk.Annotations.of(this).addInfo(`Collected ${l1Rules.length} L1 rules for Phase 2`);
        return l1Rules;
    }

    private extractSecurityGroupNameFromId(securityGroupId: string): string | undefined {
        // Direct mapping: security group ID is the security group name
        // This works because each security group has a unique name in the schema
        return securityGroupId;
    }

    private createPhase1Stacks(securityGroups: SecurityGroupConfig[], vpc: ec2.IVpc): void {
        const batchSize = 400; // Maximum security groups per stack
        
        // Filter out security groups with invalid L1 references
        const validSecurityGroups = securityGroups.filter(sgConfig => {
            const sgName = sgConfig.securityGroupName || `SecurityGroup-${securityGroups.indexOf(sgConfig)}`;
            
            // Check L1 ingress rules for invalid references
            if (sgConfig.l1Ingress) {
                for (const rule of sgConfig.l1Ingress) {
                    if (rule.sourceSecurityGroupId) {
                        const referencedSgName = this.extractSecurityGroupNameFromId(rule.sourceSecurityGroupId);
                        if (!referencedSgName || !securityGroups.some(sg => sg.securityGroupName === referencedSgName)) {
                            cdk.Annotations.of(this).addWarning(
                                `Skipping security group '${sgName}': invalid L1 ingress reference to '${rule.sourceSecurityGroupId}'`
                            );
                            return false;
                        }
                    }
                }
            }
            
            // Check L1 egress rules for invalid references
            if (sgConfig.l1Egress) {
                for (const rule of sgConfig.l1Egress) {
                    if (rule.destinationSecurityGroupId) {
                        const referencedSgName = this.extractSecurityGroupNameFromId(rule.destinationSecurityGroupId);
                        if (!referencedSgName || !securityGroups.some(sg => sg.securityGroupName === referencedSgName)) {
                            cdk.Annotations.of(this).addWarning(
                                `Skipping security group '${sgName}': invalid L1 egress reference to '${rule.destinationSecurityGroupId}'`
                            );
                            return false;
                        }
                    }
                }
            }
            
            return true;
        });
        
        const batches = this.buildBatches(validSecurityGroups, batchSize);

        batches.forEach((batch, batchIndex) => {
            const phase1Stack = new SecurityGroupPhase1Stack(this, `Phase1Stack-${batchIndex}`, {
                vpc,
                securityGroups: batch
            });

            this.phase1Stacks.push(phase1Stack);

            // Store security groups for Phase 2 reference
            batch.forEach((sgConfig, index) => {
                const sgName = sgConfig.securityGroupName || `SecurityGroup-${index}`;
                const securityGroup = phase1Stack.getSecurityGroup(sgName);
                if (securityGroup) {
                    this.securityGroups.set(sgName, securityGroup);
                }
            });
        });

        cdk.Annotations.of(this).addInfo(`Created ${this.phase1Stacks.length} Phase 1 stacks with ${validSecurityGroups.length} valid security groups`);
    }

    private processL1Rules(l1Rules: Array<{
        sourceSecurityGroupName: string;
        destinationSecurityGroupName: string;
        l1Ingress?: ec2.CfnSecurityGroupIngressProps;
        l1Egress?: ec2.CfnSecurityGroupEgressProps;
        tags?: { [key: string]: string };
    }>): Array<{
        sourceSecurityGroup: ec2.ISecurityGroup;
        destinationSecurityGroup: ec2.ISecurityGroup;
        l1Ingress?: ec2.CfnSecurityGroupIngressProps;
        l1Egress?: ec2.CfnSecurityGroupEgressProps;
        tags?: { [key: string]: string };
    }> {
        const processedRules: Array<{
            sourceSecurityGroup: ec2.ISecurityGroup;
            destinationSecurityGroup: ec2.ISecurityGroup;
            l1Ingress?: ec2.CfnSecurityGroupIngressProps;
            l1Egress?: ec2.CfnSecurityGroupEgressProps;
            tags?: { [key: string]: string };
        }> = [];

        l1Rules.forEach(rule => {
            const sourceSecurityGroup = this.securityGroups.get(rule.sourceSecurityGroupName);
            const destinationSecurityGroup = this.securityGroups.get(rule.destinationSecurityGroupName);

            if (sourceSecurityGroup && destinationSecurityGroup) {
                processedRules.push({
                    sourceSecurityGroup,
                    destinationSecurityGroup,
                    l1Ingress: rule.l1Ingress,
                    l1Egress: rule.l1Egress,
                    tags: rule.tags
                });
            } else {
                cdk.Annotations.of(this).addWarning(
                    `Skipping L1 rule: Security group not found - ${rule.sourceSecurityGroupName} or ${rule.destinationSecurityGroupName}`
                );
            }
        });

        return processedRules;
    }

    private createPhase2Stacks(processedL1Rules: Array<{
        sourceSecurityGroup: ec2.ISecurityGroup;
        destinationSecurityGroup: ec2.ISecurityGroup;
        l1Ingress?: ec2.CfnSecurityGroupIngressProps;
        l1Egress?: ec2.CfnSecurityGroupEgressProps;
        tags?: { [key: string]: string };
    }>): void {
        if (processedL1Rules.length === 0) {
            cdk.Annotations.of(this).addInfo('No L1 rules to process in Phase 2');
            return;
        }

        const batchSize = 200; // Maximum L1 rules per stack
        const batches = this.buildRuleBatches(processedL1Rules, batchSize);

        batches.forEach((batch, batchIndex) => {
            const phase2Stack = new SecurityGroupPhase2Stack(this, `Phase2Stack-${batchIndex}`, {
                l1Rules: batch
            });

            this.phase2Stacks.push(phase2Stack);
        });

        cdk.Annotations.of(this).addInfo(`Created ${this.phase2Stacks.length} Phase 2 stacks`);
    }

    private addStackDependencies(): void {
        // Add dependencies: Phase 2 stacks depend on Phase 1 stacks
        this.phase2Stacks.forEach(phase2Stack => {
            this.phase1Stacks.forEach(phase1Stack => {
                phase2Stack.addDependency(phase1Stack);
            });
        });

        cdk.Annotations.of(this).addInfo(`Added dependencies between ${this.phase1Stacks.length} Phase 1 and ${this.phase2Stacks.length} Phase 2 stacks`);
    }

    private buildBatches(securityGroups: SecurityGroupConfig[], batchSize: number): SecurityGroupConfig[][] {
        const batches: SecurityGroupConfig[][] = [];
        let currentBatch: SecurityGroupConfig[] = [];

        securityGroups.forEach(sg => {
            if (currentBatch.length >= batchSize) {
                batches.push(currentBatch);
                currentBatch = [];
            }
            currentBatch.push(sg);
        });

        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }

        return batches;
    }

    private buildRuleBatches(rules: any[], batchSize: number): any[][] {
        const batches: any[][] = [];
        let currentBatch: any[] = [];

        rules.forEach(rule => {
            if (currentBatch.length >= batchSize) {
                batches.push(currentBatch);
                currentBatch = [];
            }
            currentBatch.push(rule);
        });

        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }

        return batches;
    }
}

// Phase 1 Stack: Creates security groups with inline rules only
class SecurityGroupPhase1Stack extends cdk.NestedStack {
    private readonly securityGroupsMap: Map<string, ec2.ISecurityGroup> = new Map();

    constructor(scope: Construct, id: string, props: {
        vpc: ec2.IVpc;
        securityGroups: SecurityGroupConfig[];
    }) {
        super(scope, id);

        props.securityGroups.forEach((sgConfig, index) => {
            // Create security group with all properties (including L1 rules, but we won't process them here)
            const securityGroup = new ec2.SecurityGroup(this, sgConfig.securityGroupName || `SecurityGroup-${index}`, {
                ...sgConfig,
                vpc: props.vpc
            });

            // Add L2 rules (inline rules) only
            this.addL2Rules(securityGroup, sgConfig.ingress, sgConfig.egress);

            // Store security group
            const sgName = sgConfig.securityGroupName || `SecurityGroup-${index}`;
            this.securityGroupsMap.set(sgName, securityGroup);

            // Add tags
            if (sgConfig.tags) {
                Object.entries(sgConfig.tags).forEach(([key, value]) => {
                    Tags.of(securityGroup).add(key, value);
                });
            }

            cdk.Annotations.of(this).addInfo(`Created security group: ${sgName} (Phase 1)`);
        });
    }

    private addL2Rules(
        securityGroup: ec2.SecurityGroup,
        ingress?: L2SecurityGroupRule[],
        egress?: L2SecurityGroupRule[]
    ): void {
        if (ingress) {
            ingress.forEach(rule => {
                securityGroup.addIngressRule(rule.peer, rule.port, rule.description);
            });
        }

        if (egress) {
            egress.forEach(rule => {
                securityGroup.addEgressRule(rule.peer, rule.port, rule.description);
            });
        }
    }

    public getSecurityGroup(name: string): ec2.ISecurityGroup | undefined {
        return this.securityGroupsMap.get(name);
    }
}

// Phase 2 Stack: Creates L1 rules with cross-stack dependencies
class SecurityGroupPhase2Stack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: {
        l1Rules: Array<{
            sourceSecurityGroup: ec2.ISecurityGroup;
            destinationSecurityGroup: ec2.ISecurityGroup;
            l1Ingress?: ec2.CfnSecurityGroupIngressProps;
            l1Egress?: ec2.CfnSecurityGroupEgressProps;
            tags?: { [key: string]: string };
        }>;
    }) {
        super(scope, id);

        props.l1Rules.forEach((rule, index) => {
            // Create ingress rule if specified
            if (rule.l1Ingress) {
                const ingressRule = new ec2.CfnSecurityGroupIngress(this, `L1Ingress-${index}`, {
                    ...rule.l1Ingress,
                    groupId: rule.destinationSecurityGroup.securityGroupId,  // The SG that receives the connection
                    sourceSecurityGroupId: rule.sourceSecurityGroup.securityGroupId  // The SG that's allowed to connect
                });

                if (rule.tags) {
                    Object.entries(rule.tags).forEach(([key, value]) => {
                        Tags.of(ingressRule).add(key, value);
                    });
                }

                cdk.Annotations.of(this).addInfo(
                    `Created L1 ingress rule: ${rule.sourceSecurityGroup.securityGroupId} → ${rule.destinationSecurityGroup.securityGroupId} (Phase 2)`
                );
            }

            // Create egress rule if specified
            if (rule.l1Egress) {
                const egressRule = new ec2.CfnSecurityGroupEgress(this, `L1Egress-${index}`, {
                    ...rule.l1Egress,
                    groupId: rule.sourceSecurityGroup.securityGroupId,  // The SG that initiates the connection
                    destinationSecurityGroupId: rule.destinationSecurityGroup.securityGroupId  // The SG that receives the connection
                });

                if (rule.tags) {
                    Object.entries(rule.tags).forEach(([key, value]) => {
                        Tags.of(egressRule).add(key, value);
                    });
                }

                cdk.Annotations.of(this).addInfo(
                    `Created L1 egress rule: ${rule.sourceSecurityGroup.securityGroupId} → ${rule.destinationSecurityGroup.securityGroupId} (Phase 2)`
                );
            }
        });
    }
}