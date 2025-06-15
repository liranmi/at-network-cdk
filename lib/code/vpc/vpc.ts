import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Tags } from 'aws-cdk-lib';
import { VpcConfig } from '../../schemas/vpc';
import * as cdk from 'aws-cdk-lib';
import { overrideLogicalId } from '../helpers/logical-id';

export interface CustomVpcProps {
    vpcConfig: VpcConfig;
}

export class CustomVpc extends Construct {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props: CustomVpcProps) {
        super(scope, id);

        const { subnetConfigs, version, tags: vpcTags, maxAzs = 1, name, ...vpcProps } = props.vpcConfig;

        // Create the VPC
        this.vpc = new ec2.Vpc(this, name || 'Vpc', {
            ...vpcProps,
            subnetConfiguration: [],
            maxAzs,
        });

        // Export the VPC ID
        new cdk.CfnOutput(this, 'VpcId', {
            value: this.vpc.vpcId,
            description: 'The ID of the VPC',
            exportName: `${id}-vpc-id`
        });

        // Add tags to the VPC
        if (vpcTags) {
            Object.entries(vpcTags).forEach(([key, value]) => {
                Tags.of(this.vpc).add(key, value);
            });
        }

        // Override the logical ID of the VPC
        overrideLogicalId(this.vpc, name || 'Vpc');

        // Create subnets
        if (subnetConfigs) {
            for (const subnetConfig of subnetConfigs) {
                const { vpcId: _ignored, tags: subnetTags, ...subnetProps } = subnetConfig;
                const subnet = new ec2.Subnet(this, subnetConfig.name, {
                    ...subnetProps,
                    vpcId: this.vpc.vpcId,
                });
                // Add tags to the subnet
                if (subnetTags) {
                    Object.entries(subnetTags).forEach(([key, value]) => {
                        Tags.of(subnet).add(key, value);
                    });
                }
                // Export the subnet ID
                new cdk.CfnOutput(this, `${subnetConfig.name}-SubnetId`, {
                    value: subnet.subnetId,
                    description: `The ID of the ${subnetConfig.name} subnet`,
                    exportName: `${id}-${subnetConfig.name}-subnet-id`
                });
                // Override the logical ID of the subnet
                overrideLogicalId(subnet, subnetConfig.name);
            }
        }

    }
} 