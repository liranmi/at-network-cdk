import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { NaclStack } from '../../lib/stacks/nacl-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { NaclConfig, NaclRuleConfig } from '../../config/nacl';

 describe('NaclStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let naclConfigs: NaclConfig[];

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    
    // Create a test VPC
    vpc = new ec2.Vpc(stack, 'TestVpc', {
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

    // Create test NACL configs
    naclConfigs = [
      {
        name: 'small-nacl',
        rules: [
          {
            ruleNumber: 100,
            protocol: -1,
            action: 'allow',
            cidr: '0.0.0.0/0',
            egress: false
          }
        ],
        subnetIds: ['subnet-12345678']
      },
      {
        name: 'medium-nacl',
        rules: Array(200).fill(null).map((_, i) => ({
          ruleNumber: i + 100,
          protocol: -1,
          action: 'allow',
          cidr: '0.0.0.0/0',
          egress: false
        })),
        subnetIds: ['subnet-87654321']
      },
      {
        name: 'large-nacl',
        rules: Array(380).fill(null).map((_, i) => ({
          ruleNumber: i + 300,
          protocol: -1,
          action: 'allow',
          cidr: '0.0.0.0/0',
          egress: false
        }))
      }
    ];
  });

   test('creates a single stack for small NACL', () => {
    const smallConfigs = [naclConfigs[0]];
    const naclStack = new NaclStack(app, 'SmallNaclStack', {
      vpc,
      naclConfigs: smallConfigs
    });

    // Synthesize the stack
    const template = Template.fromStack(naclStack);
    template.resourceCountIs('AWS::EC2::NetworkAcl', 1);
    template.resourceCountIs('AWS::EC2::NetworkAclEntry', 1);
  });

   test('creates single stack for medium NACL', () => {
    const mediumConfigs = [naclConfigs[1]];
    const naclStack = new NaclStack(app, 'MediumNaclStack', {
      vpc,
      naclConfigs: mediumConfigs
    });

    // Synthesize the stack
    const template = Template.fromStack(naclStack);
    // Zero nested stack 
    template.resourceCountIs('AWS::CloudFormation::Stack', 0);
  });

   test('creates nested stacks for multiple NACLs', () => {
    const naclStack = new NaclStack(app, 'MultipleNaclStack', {
      vpc,
      naclConfigs
    });

    // Synthesize the stack
    const template = Template.fromStack(naclStack);
    template.resourceCountIs('AWS::CloudFormation::Stack', 2);
  });

}); 

describe('NaclStack for 100 Subnets', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let naclConfigs: NaclConfig[];

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    
    // Create a test VPC
    vpc = new ec2.Vpc(stack, 'TestVpc', {
      // 1) make the VPC wide enough
      cidr: '10.0.0.0/16',
    
      // 2) don't replicate per-AZ — we'll pin everything into one AZ
      maxAzs: 1,
    
      // 3) generate exactly 200 subnets (all PUBLIC here; you can mix types if you like)
      subnetConfiguration: Array.from({ length: 100 }, (_, i) => ({
        name: `PrivateSubnet${i + 1}`,
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: 24,
      })),
    });

    // Create test NACL configs
    naclConfigs = Array.from({ length: 100 }, (_, i) => {
      // build 20 inbound rules
      const inbound: NaclRuleConfig[] = Array.from({ length: 20 }, (_, j) => ({
        ruleNumber: 100 + j,      // e.g. 100…119
        protocol: -1,
        action: 'allow',
        cidr: '0.0.0.0/0',
        egress: false,
      }));
    
      // build 20 outbound rules
      const outbound: NaclRuleConfig[] = Array.from({ length: 20 }, (_, j) => ({
        ruleNumber: 200 + j,      // e.g. 200…219
        protocol: -1,
        action: 'allow',
        cidr: '0.0.0.0/0',
        egress: true,
      }));
    
      return {
        name: `nacl-${i + 1}`,         // "nacl-1", "nacl-2", …, "nacl-200"
        subnetType: 'Isolated',          // will associate each ACL with one Private subnet
        rules: [...inbound, ...outbound]
      };
    });
  });

  test('creates nested stacks for multiple NACLs', () => {
    const naclStack = new NaclStack(app, 'MultipleNaclStack', {
      vpc,
      naclConfigs
    });

    // Synthesize the stack
    const template = Template.fromStack(naclStack);
    template.resourceCountIs('AWS::CloudFormation::Stack', 12);
  });

}); 

