import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../../lib/stacks/vpc-stack';
import { devVpcConfig } from '../config/examples/vpc-examples';


describe('CdkStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('creates a VPC', () => {


    const stack = new VpcStack(app, 'TestVpcStack', {
      vpcConfig: devVpcConfig
    });

    // Synthesize the stack
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });
}); 