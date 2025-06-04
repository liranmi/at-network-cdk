import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConfig } from '../schemas/vpc';
import { CustomVpc } from '../code/vpc/vpc';

export interface VpcStackProps extends cdk.StackProps {
    vpcConfig: VpcConfig;
}

export class VpcStack extends cdk.Stack {
    // Expose the underlying ec2.Vpc if needed, but fetched from CustomVpc
    public readonly vpc: cdk.aws_ec2.IVpc;

    constructor(scope: Construct, id: string, props: VpcStackProps) {
        super(scope, id, props);

        // Create the VPC directly using the CustomVpc construct
        const customVpc = new CustomVpc(this, 'CustomVpc', {
            vpcConfig: props.vpcConfig,
        });

        // Assign the VPC created by the custom construct to the stack property
        this.vpc = customVpc.vpc;
    }
} 