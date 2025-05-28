import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Tags } from 'aws-cdk-lib';
import { VpcConfig } from '../../schemas/vpc';
import * as cdk from 'aws-cdk-lib';

export interface CustomVpcProps {
    vpcConfig: VpcConfig;
}

export class CustomVpc extends Construct {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props: CustomVpcProps) {
        super(scope, id);

        const { subnetConfigs, version, tags, maxAzs = 1, ...vpcProps } = props.vpcConfig;

        // Prevent auto subnet creation by passing an empty subnetConfiguration and set maxAzs to 1
        const vpc = new ec2.Vpc(this, 'Resource', {
            ...vpcProps,
            subnetConfiguration: [],
            maxAzs,
        });

        // Export the VPC ID
        new cdk.CfnOutput(this, 'VpcId', {
            value: vpc.vpcId,
            description: 'The ID of the VPC',
            exportName: `${id}-vpc-id`
        });


        // Create subnets
        if (subnetConfigs) {
            for (const subnetConfig of subnetConfigs) {
                const subnet = new ec2.Subnet(this, subnetConfig.name, subnetConfig);
                // Export the subnet ID
                new cdk.CfnOutput(this, `${subnetConfig.name}-SubnetId`, {
                    value: subnet.subnetId,
                    description: `The ID of the ${subnetConfig.name} subnet`,
                    exportName: `${id}-${subnetConfig.name}-subnet-id`
                });
            }
        }

        if (tags) {
            Object.entries(tags).forEach(([key, value]) => {
                Tags.of(this.vpc).add(key, value);
            });
        }
    }

} 