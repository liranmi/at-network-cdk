import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config, AppConfig } from '../../config';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface CdkStackProps extends cdk.StackProps {
  appConfig: AppConfig;
}

export class CdkStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    // VPC
    this.vpc = new ec2.Vpc(this, 'MainVpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        }
      ]
    });

    // Security Groups
    props.appConfig.securityGroups.forEach((sgConf) => {
      new ec2.SecurityGroup(this, sgConf.name, {
        vpc: this.vpc,
        description: sgConf.description,
        allowAllOutbound: sgConf.allowAllOutbound,
        securityGroupName: sgConf.name,
      });
    });
  }
}
