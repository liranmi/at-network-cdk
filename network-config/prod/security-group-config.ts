import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroupsConfig } from '../../lib/schemas/securityGroup';
/**
 * This is a sample Security Groups configuration file for the production environment.
 * This file serves as a placeholder to ensure CDK synthesis generates at least one stack.
 * 
 * IMPORTANT: This configuration should be replaced with actual production Security Groups settings
 * before deploying to production. The current values are minimal and not suitable
 * for production use.
 * 
 * Key points to consider when replacing this configuration:
 * - Define appropriate security groups for different application tiers (web, app, db)
 * - Configure proper ingress and egress rules
 * - Set up security group dependencies and references
 * - Review and adjust CIDR blocks and port ranges
 * - Consider implementing least privilege principle
 * 
 * Note: If no security groups are needed, keep the empty array in securityGroups property.
 */



export const prodSecurityGroupsConfig: SecurityGroupsConfig = {
    version: 'v1',
    securityGroups: []
};