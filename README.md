# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Project Blueprint

This project is a modular, schema-driven AWS CDK solution for defining and deploying network infrastructure (VPCs, NACLs, etc.) using environment-specific, generated configuration files.

### Key Components

#### 1. **Configuration as Code**
- All environment-specific network settings are defined as TypeScript objects in the `network-config/` directory (e.g., `dev/vpc-config.ts`).
- These configs are validated against TypeScript interfaces (schemas) in `lib/schemas/`.
- The environment to deploy is selected via `environment-config.json`.

#### 2. **Schema-Driven Infrastructure**
- Schemas in `lib/schemas/` define the structure and allowed properties for VPCs, NACLs, and more.
- Example: `VpcConfig` interface ensures all VPC configs have the required fields and structure.

#### 3. **Stacks and Constructs**
- **VPC Stack (`lib/stacks/vpc-stack.ts`):**  
  Deploys a VPC using a factory function that selects the correct construct version based on the config.
- **NACL Stack (`lib/stacks/nacl-stack.ts`):**  
  Deploys Network ACLs, handling AWS resource limits by splitting into intervals/nested stacks if needed.
- **Custom Constructs:**  
  Located in `lib/code/vpc/` and `lib/code/nacl/`, these implement reusable logic for VPCs and NACLs.

#### 4. **Aspects**
- **TaggingAspect (`aspects/tagging-aspect.ts`):**  
  Automatically applies tags from `environment-config.json` to all resources, unless already tagged.

#### 5. **Entry Point**
- **`bin/at-network-cdk.ts`:**  
  - Loads the environment and tags from `environment-config.json`.
  - Loads the appropriate config objects from `network-config/`.
  - Instantiates the VPC and NACL stacks with these configs.

#### 6. **Testing**
- Tests are located in the `tests/` directory and can be run with `npm test`.

### Example Flow

1. **Define your environment config:**  
   Edit `environment-config.json` to set the target environment and tags.

2. **Edit or generate your network config:**  
   Example: `network-config/dev/vpc-config.ts`
   ```ts
   export const devVpcConfig: VpcConfig = {
     cidrBlock: '10.0.0.0/16',
     // ...other properties
   };
   ```

3. **Deploy:**  
   ```sh
   npx cdk synth   # Synthesize the CloudFormation template
   npx cdk deploy  # Deploy to AWS
   ```

### Directory Structure

```
.
├── aspects/                # CDK Aspects (e.g., tagging)
├── bin/                    # Entry point for CDK app
├── environment-config.json # Selects environment and tags
├── lib/
│   ├── code/               # Custom constructs/factories for VPC, NACL, etc.
│   ├── schemas/            # TypeScript interfaces (schemas) for config validation
│   ├── stacks/             # CDK Stacks (VPC, NACL)
│   └── utils/              # Utility functions (e.g., logger)
├── network-config/         # Environment-specific config objects
├── tests/                  # Unit and integration tests
└── ...
```

## Configuration Flow

This project uses environment-specific, generated network configuration files as input. These configuration files are TypeScript objects located in the `network-config/` directory and follow schemas defined in `lib/schemas`.

The CDK app consumes these configs to synthesize and deploy AWS infrastructure.

### Example: VPC Config for Dev Environment

```ts
// network-config/dev/vpc-config.ts
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { VpcConfig } from '../../lib/schemas/vpc';

export const devVpcConfig: VpcConfig = {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  instanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
  subnetConfigs: [
    {
      name: 'public',
      subnetType: ec2.SubnetType.PUBLIC,
      availabilityZone: 'us-east-1a',
      cidrBlock: '10.0.0.0/24',
      mapPublicIpOnLaunch: true,
      enableDns64: true,
      enableLniAtDeviceIndex: 0,
      privateDnsNameOptionsOnLaunch: {
        EnableResourceNameDnsARecord: true,
        HostnameType: 'ip-name'
      }
    }
  ],
  tags: [
    { key: 'Environment', value: 'dev' },
    { key: 'Project', value: 'my-project' },
  ],
  version: 'v1',
};
```

### Example: How the Config is Used

In the CDK app (e.g., `bin/at-network-cdk.ts`):

```ts
import { vpcConfigs } from '../network-config';

const envName = 'dev'; // or from your environment-config.json
const vpcConfig = vpcConfigs[envName];

new VpcStack(app, 'VpcStack', {
  vpcConfig,
  env
});
```

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
