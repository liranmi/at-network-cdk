import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Tags } from 'aws-cdk-lib';
import { VpcConfig, maskFromCidr, SubnetConfig } from '../../schemas/vpc';
import { CfnSubnet } from 'aws-cdk-lib/aws-ec2';

export interface CustomVpcProps {
    vpcConfig: VpcConfig;
}

export class CustomVpc extends Construct {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props: CustomVpcProps) {
        super(scope, id);

        const { subnetConfigs, version, tags, ...vpcProps } = props.vpcConfig;

        // Create the VPC using the determined configuration
        this.vpc = new ec2.Vpc(this, 'Resource', vpcProps);

        if (tags) {
            Object.entries(tags).forEach(([key, value]) => {
                Tags.of(this.vpc).add(key, value);
            });
        }
    }

} 