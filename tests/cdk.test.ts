import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/stacks/cdk-stack';
import { AppConfig } from '../config';

describe('CdkStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('creates a VPC', () => {
    const testConfig: AppConfig = {
      vpc: {
        cidr: '10.0.0.0/16',
        maxAzs: 2
      },
      securityGroups: [],
      nacls: []
    };

    const stack = new CdkStack(app, 'TestCdkStack', {
      appConfig: testConfig
    });

    // Synthesize the stack
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });
}); 