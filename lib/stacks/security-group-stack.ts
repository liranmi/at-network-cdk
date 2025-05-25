import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroupsConfig, SecurityGroupConfig } from '../schemas/securityGroup';
import { logger } from '../utils/logger';

export interface SecurityGroupStackProps extends cdk.StackProps {
    vpc: ec2.IVpc;
    securityGroupsConfig: SecurityGroupsConfig;
}

export class SecurityGroupStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: SecurityGroupStackProps) {
        super(scope, id, props);

        const { securityGroups } = props.securityGroupsConfig;
        const batchSize = 499; // CloudFormation resource limit with buffer

        // If no security groups to process, return early
        if (securityGroups.length === 0) {
            logger.info('No security groups to process');
            return;
        }

        // Calculate number of batches needed
        const batches = Math.ceil(securityGroups.length / batchSize);

        // If only one batch, create security groups directly in this stack
        if (batches === 1) {
            securityGroups.forEach((sgConfig, index) => {
                this.createSecurityGroup(this, sgConfig, index, props.vpc);
            });
            return;
        }

        // Create nested stacks for each batch
        for (let i = 0; i < batches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, securityGroups.length);
            const batch = securityGroups.slice(start, end);

            const nestedStack = new cdk.NestedStack(this, `security-group-stack-${i}`, {
                description: `Security Group Stack ${i + 1} of ${batches}`
            });

            batch.forEach((sgConfig, index) => {
                this.createSecurityGroup(nestedStack, sgConfig, start + index, props.vpc);
            });
        }
    }

    private createSecurityGroup(scope: Construct, sgConfig: SecurityGroupConfig, index: number, vpc: ec2.IVpc): void {
        // Deconstruct the security group config
        const { ingress, egress, ...securityGroupProps } = sgConfig;

        // Create the security group
        const securityGroup = new ec2.SecurityGroup(scope, sgConfig.securityGroupName || `SecurityGroup-${index}`, {
            ...securityGroupProps,
            vpc
        });

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
} 