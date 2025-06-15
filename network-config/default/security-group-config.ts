import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroupsConfig } from '../../lib/schemas/securityGroup';

/**
 * Default security group configuration that serves as a base template.
 * This configuration can be extended or overridden by environment-specific configs.
 */

export const securityGroupConfig: SecurityGroupsConfig = {
    version: 'v1',
    securityGroups: [],
    tags: {
        Environment: 'default'
    }
}; 