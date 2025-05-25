import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Tags } from 'aws-cdk-lib';
import { VpcConfig } from '../../schemas/vpc';

export interface CustomVpcProps {
    vpcConfig: VpcConfig;
}

export class CustomVpc extends Construct {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props: CustomVpcProps) {
        super(scope, id);

        const { subnetConfigs, version, tags, maxAzs = 1, ...vpcProps } = props.vpcConfig;

        // Prevent auto subnet creation by passing an empty subnetConfiguration and set maxAzs to 1
        this.vpc = new ec2.Vpc(this, 'Resource', {
            ...vpcProps,
            subnetConfiguration: [],
            maxAzs,
        });

        if (subnetConfigs) {
            for (const subnetConfig of subnetConfigs) {
                new ec2.Subnet(this, subnetConfig.name, subnetConfig);
            }
        }

        if (tags) {
            Object.entries(tags).forEach(([key, value]) => {
                Tags.of(this.vpc).add(key, value);
            });
        }
    }

} 