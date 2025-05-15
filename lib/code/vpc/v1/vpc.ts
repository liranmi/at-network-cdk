import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Tags } from 'aws-cdk-lib';
import { VpcConfig, maskFromCidr, SubnetConfig } from '../../../schemas/vpc';
import { CfnSubnet } from 'aws-cdk-lib/aws-ec2';

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

        // 1️⃣ Convert your SubnetConfig[] → L2 SubnetConfiguration[]
        const l2Configs: ec2.SubnetConfiguration[] = (props.vpcConfig.subnetConfigs ?? []).map(cfg => ({
            name: cfg.name,
            subnetType: cfg.subnetType,
            // Only use cidrMask for CIDR-based subnets
            cidrMask: props.vpcConfig.cidrBlock ? maskFromCidr(cfg.cidrBlock!) : undefined,
            // Optional L2-only configuration overrides
            mapPublicIpOnLaunch: cfg.mapPublicIpOnLaunch as boolean | undefined,
            ipv6AssignAddressOnCreation: cfg.assignIpv6AddressOnCreation as boolean | undefined,
        }));

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
                maxAzs: 1, // Currently hardcoded to 1 AZ
                subnetConfiguration: l2Configs as ec2.SubnetConfiguration[],
            };
        } else {
            // Use CIDR (validation ensures it exists)
            vpcProps = {
                ipAddresses: ec2.IpAddresses.cidr(props.vpcConfig.cidrBlock!),
                enableDnsSupport: props.vpcConfig.enableDnsSupport as boolean,
                enableDnsHostnames: props.vpcConfig.enableDnsHostnames as boolean,
                defaultInstanceTenancy: props.vpcConfig.instanceTenancy as ec2.DefaultInstanceTenancy,
                maxAzs: 1, // Currently hardcoded to 1 AZ
                subnetConfiguration: l2Configs as ec2.SubnetConfiguration[],
            };
        }

        // Create the VPC using the determined configuration
        this.vpc = new ec2.Vpc(this, 'Resource', vpcProps);

        if (props.vpcConfig.tags) {
            props.vpcConfig.tags.forEach((tag: { key: string; value: string }) => {
                Tags.of(this.vpc).add(tag.key, tag.value);
            });
        }

        // 3️⃣ Apply overrides for any L1-only props in each SubnetConfig
        this.applyL1Overrides(this.vpc, props.vpcConfig.subnetConfigs ?? []);
    }

    /**
     * Applies L1-only CfnSubnet properties via escape-hatch on the L2 Subnet
     */
    private applyL1Overrides(vpc: ec2.Vpc, subnetConfigs: SubnetConfig[]) {
        for (const cfg of subnetConfigs) {
            // pick the first subnet in that group
            const subnet = vpc.selectSubnets({ subnetGroupName: cfg.name }).subnets[0];
            const cfn = subnet.node.defaultChild as CfnSubnet;

            if (cfg.availabilityZoneId) {
                cfn.availabilityZone = undefined;
                cfn.availabilityZoneId = cfg.availabilityZoneId;
            }
            if (cfg.enableDns64 !== undefined) {
                cfn.enableDns64 = cfg.enableDns64;
            }
            if (cfg.enableLniAtDeviceIndex !== undefined) {
                cfn.enableLniAtDeviceIndex = cfg.enableLniAtDeviceIndex;
            }
            if (cfg.ipv4IpamPoolId) {
                cfn.ipv4IpamPoolId = cfg.ipv4IpamPoolId;
                cfn.ipv4NetmaskLength = cfg.ipv4NetmaskLength!;
            }
            if (cfg.ipv6IpamPoolId) {
                cfn.ipv6IpamPoolId = cfg.ipv6IpamPoolId;
                cfn.ipv6NetmaskLength = cfg.ipv6NetmaskLength!;
            }
            if (cfg.ipv6Native !== undefined) {
                cfn.ipv6Native = cfg.ipv6Native;
            }
            if (cfg.outpostArn) {
                cfn.outpostArn = cfg.outpostArn;
            }
            if (cfg.privateDnsNameOptionsOnLaunch) {
                cfn.addPropertyOverride('PrivateDnsNameOptionsOnLaunch', cfg.privateDnsNameOptionsOnLaunch);
            }
        }
    }
} 