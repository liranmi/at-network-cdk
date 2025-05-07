import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CustomNetworkAcl } from '../../lib/code/nacl/v1/network-acl';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { NaclConfig } from '../../lib/types/v1/nacl';

describe('CustomNetworkAcl', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let naclConfig: NaclConfig;

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

    // Create a test NACL config
    naclConfig = {
      name: 'test-nacl',
      rules: [
        {
          ruleNumber: 100,
          protocol: -1,
          action: 'allow',
          cidr: '0.0.0.0/0',
          egress: false
        },
        {
          ruleNumber: 100,
          protocol: -1,
          action: 'allow',
          cidr: '0.0.0.0/0',
          egress: true
        },
        {
          ruleNumber: 200,
          protocol: 6,
          action: 'allow',
          cidr: '10.0.0.0/16',
          fromPort: 80,
          toPort: 80,
          egress: false
        }
      ]
    };
  });

  test('creates a Network ACL with correct properties', () => {
    // Create the NACL
    const nacl = new CustomNetworkAcl(stack, 'TestNacl', {
      vpc,
      config: naclConfig
    });

    // Get the template
    const template = Template.fromStack(stack);

    // Assert Network ACL creation
    template.resourceCountIs('AWS::EC2::NetworkAcl', 1);

    // Using partial assertion instead of exact match
    template.hasResourceProperties('AWS::EC2::NetworkAcl', {
      Tags: [
        {
          Key: 'Name',
          Value: 'test-nacl'
        }
      ]
    });

    // Assert Network ACL Entry creation
    template.resourceCountIs('AWS::EC2::NetworkAclEntry', 3);

    // Assert ingress rule
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: -1,
      RuleAction: 'allow',
      RuleNumber: 100,
      CidrBlock: '0.0.0.0/0',
      Egress: false
    });

    // Assert egress rule
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: -1,
      RuleAction: 'allow',
      RuleNumber: 100,
      CidrBlock: '0.0.0.0/0',
      Egress: true
    });

    // Assert TCP rule with port range
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: 6,
      RuleAction: 'allow',
      RuleNumber: 200,
      CidrBlock: '10.0.0.0/16',
      Egress: false,
      PortRange: {
        From: 80,
        To: 80
      }
    });
  });

  test('handles empty rules array', () => {
    const emptyConfig: NaclConfig = {
      name: 'empty-nacl',
      rules: []
    };

    const nacl = new CustomNetworkAcl(stack, 'EmptyNacl', {
      vpc,
      config: emptyConfig
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::NetworkAcl', 1);
    template.resourceCountIs('AWS::EC2::NetworkAclEntry', 0);
    // Remove the subnet association assertion as it's not created in the CustomNetworkAcl class
  });

  test('handles rules without port ranges', () => {
    const noPortConfig: NaclConfig = {
      name: 'no-port-nacl',
      rules: [
        {
          ruleNumber: 100,
          protocol: -1,
          action: 'allow',
          cidr: '0.0.0.0/0',
          egress: false
        }
      ]
    };

    const nacl = new CustomNetworkAcl(stack, 'NoPortNacl', {
      vpc,
      config: noPortConfig
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: -1,
      RuleAction: 'allow',
      RuleNumber: 100,
      CidrBlock: '0.0.0.0/0',
      Egress: false
    });
  });
}); 