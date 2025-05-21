import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { NaclConfig, NaclRuleConfig } from '../../schemas/nacl';

export class CustomNetworkAcl extends Construct {
    public readonly networkAcl: ec2.CfnNetworkAcl;

    constructor(scope: Construct, id: string, props: {
        vpc: ec2.IVpc;
        config: NaclConfig;
    }) {
        super(scope, id);

        // Create the Network ACL using L1 construct
        this.networkAcl = new ec2.CfnNetworkAcl(this, `${props.config.name}-nacl`, {
            vpcId: props.vpc.vpcId,
            tags: [{ key: 'Name', value: props.config.name }]
        });

        // Add rules directly to the NACL
        props.config.rules.forEach((rule: NaclRuleConfig) => {
            new ec2.CfnNetworkAclEntry(this, `${rule.ruleNumber}-${rule.egress ? 'egress' : 'ingress'}`, {
                networkAclId: this.networkAcl.ref,
                protocol: rule.protocol,
                ruleAction: rule.action,
                ruleNumber: rule.ruleNumber,
                cidrBlock: rule.cidr,
                egress: rule.egress ?? false,
                portRange: rule.fromPort !== undefined ? {
                    from: rule.fromPort,
                    to: rule.toPort,
                } : undefined,
            });
        });
    }
} 