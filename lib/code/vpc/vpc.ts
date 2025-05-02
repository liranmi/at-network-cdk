import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConfig } from '../../types/vpc';
import { Tags } from 'aws-cdk-lib';

export interface CustomVpcProps {
    vpcConfig: VpcConfig;
}

export class CustomVpc extends Construct {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props: CustomVpcProps) {
        super(scope, id);

        // Validate that either CIDR or IPAM configuration is provided
        if (!props.vpcConfig.cidrBlock && !(props.vpcConfig.ipv4IpamPoolId && props.vpcConfig.ipv4NetmaskLength)) {
            throw new Error('Either cidr or both ipv4IpamPoolId and ipv4NetmaskLength must be provided in VpcConfig');
        }

        // Determine IP addressing strategy
        let vpcProps: ec2.VpcProps;
        if (props.vpcConfig.ipv4IpamPoolId && props.vpcConfig.ipv4NetmaskLength) {
            // Use specified IPAM pool and netmask length
            vpcProps = {
                ipAddresses: ec2.IpAddresses.awsIpamAllocation({
                    ipv4IpamPoolId: props.vpcConfig.ipv4IpamPoolId,
                    ipv4NetmaskLength: props.vpcConfig.ipv4NetmaskLength,
                    defaultSubnetIpv4NetmaskLength: 24, // Using /24 as a common subnet size
                }),
                // When using IPAM, we need to specify a defaultCidrMask for subnets
                enableDnsSupport: props.vpcConfig.enableDnsSupport as boolean,
                enableDnsHostnames: props.vpcConfig.enableDnsHostnames as boolean,
                defaultInstanceTenancy: props.vpcConfig.instanceTenancy as ec2.DefaultInstanceTenancy,
                maxAzs: props.vpcConfig.maxAzs || 1, // Default to 1 AZ if not specified
            };
        } else {
            // Use CIDR (validation ensures it exists)
            vpcProps = {
                ipAddresses: ec2.IpAddresses.cidr(props.vpcConfig.cidrBlock!),
                enableDnsSupport: props.vpcConfig.enableDnsSupport as boolean,
                enableDnsHostnames: props.vpcConfig.enableDnsHostnames as boolean,
                defaultInstanceTenancy: props.vpcConfig.instanceTenancy as ec2.DefaultInstanceTenancy,
                maxAzs: props.vpcConfig.maxAzs || 1 // Default to 1 AZ if not specified
            };
        }

        // Create the VPC using the determined configuration
        this.vpc = new ec2.Vpc(this, 'Resource', vpcProps);
        if (props.vpcConfig.tags) {
            props.vpcConfig.tags.forEach((tag) => {
                Tags.of(this.vpc).add(tag.key, tag.value);
            });
        }
    }
} 