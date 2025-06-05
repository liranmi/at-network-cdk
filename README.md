# at-network-cdk

## Prerequisites

Before you begin, make sure to install the required dependencies:

```sh
# Install CDK CLI globally
npm install -g aws-cdk@latest

# Install project dependencies
npm install aws-cdk-lib@latest constructs@latest

# Install development dependencies
npm install --save-dev jest@latest ts-jest@latest @types/jest@latest
```

Create a `package.json` file with the following content:

```json
{
  "name": "at-network-cdk",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "jest",
    "build": "tsc",
    "cdk": "cdk"
  }
}
```

This will ensure you have the necessary libraries for AWS CDK, constructs, and testing.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Project Blueprint

This project is a modular, schema-driven AWS CDK solution for defining and deploying network infrastructure (VPCs, NACLs, Security Groups) using environment-specific, generated configuration files.

### Key Components

#### 1. **Configuration as Code**
- All environment-specific network settings are defined as TypeScript objects in the `network-config/` directory
- These configs are validated against TypeScript interfaces (schemas) in `lib/schemas/`
- The environment to deploy is selected via `environment-config.ts`
- Supports multiple environments with different AWS accounts and regions

#### 2. **Schema-Driven Infrastructure**
- Schemas in `lib/schemas/` define the structure and allowed properties for VPCs, NACLs, and Security Groups
- Built-in security best practices like Flow Logs and restricted default security groups
- Version control for configurations to ensure compatibility

#### 3. **Stacks and Constructs**
- **VPC Stack (`lib/stacks/vpc-stack.ts`):**  
  Deploys a VPC using a factory function that selects the correct construct version based on the config
  Supports multiple environments with different configurations
- **Security Group Stack (`lib/stacks/security-group-stack.ts`):**  
  Deploys Security Groups with automatic batching for large configurations
  Optional deployment based on configuration presence
- **Custom Constructs:**  
  Located in `lib/code/vpc/` and `lib/code/nacl/`, these implement reusable logic for VPCs and NACLs

#### 4. **Aspects**
- **NamingConventionAspect (`aspects/naming-convention-aspect.ts`):**  
  Enforces naming conventions on CloudFormation resources with configurable patterns

#### 5. **Entry Point**
- **`bin/at-network-cdk.ts`:**  
  - Loads the environment and tags from `environment-config.ts`
  - Supports multiple environment deployments in a single CDK app
  - Validates configuration versions and presence
  - Applies global and environment-specific tags
  - Uses CDK Annotations for informative synthesis output

#### 6. **Testing**
- Tests are located in the `tests/` directory
- Uses Jest for unit and integration testing
- Run tests with `npm test`

### Example Flow

1. **Define your environment config:**  
   Edit `environment-config.ts` to set the target environments, accounts, regions, and tags:
   ```ts
   export const environmentConfig = {
     globalTags: {
       Project: 'my-project',
       ManagedBy: 'cdk'
     },
     environments: {
       dev: {
         account: '123456789012',
         region: 'us-east-1',
         tags: {
           Environment: 'dev'
         }
       },
       prod: {
         account: '210987654321',
         region: 'us-west-2',
         tags: {
           Environment: 'prod'
         }
       }
     }
   };
   ```

2. **Edit or generate your network config:**  
   Example: `network-config/dev/vpc-config.ts`
   ```ts
   export const devVpcConfig: VpcConfig = {
     cidrBlock: '10.0.0.0/16',
     enableDnsHostnames: true,
     enableDnsSupport: true,
     flowLogs: {
       cloudwatch: {
         trafficType: ec2.FlowLogTrafficType.ALL
       }
     },
     restrictDefaultSecurityGroup: true,
     subnetConfigs: [
       {
         name: 'private',
         subnetType: ec2.SubnetType.PRIVATE,
         availabilityZone: 'us-east-1a',
         cidrBlock: '10.0.0.0/24'
       }
     ],
     tags: {
       Environment: 'dev',
       Project: 'my-project'
     },
     version: 'v1'
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
├── aspects/                # CDK Aspects (e.g., naming conventions)
├── bin/                    # Entry point for CDK app
├── environment-config.ts   # Environment and account configuration
├── lib/
│   ├── code/              # Custom constructs/factories for VPC, NACL, etc.
│   ├── schemas/           # TypeScript interfaces (schemas) for config validation
│   ├── stacks/            # CDK Stacks (VPC, Security Groups)
│   └── utils/             # Utility functions
├── network-config/        # Environment-specific config objects
├── tests/                 # Unit and integration tests
├── cdk.json              # CDK configuration
├── package.json          # Project dependencies
└── tsconfig.json         # TypeScript configuration
```

## Security Best Practices

The project implements several security best practices:

1. **VPC Flow Logs**
   - Configurable through the `flowLogs` property
   - Supports both CloudWatch and S3 destinations
   - Helps with network monitoring and security analysis

2. **Default Security Group Restriction**
   - Optional `restrictDefaultSecurityGroup` property
   - Prevents accidental exposure through default security group
   - Forces explicit security group configuration

3. **Private Subnets by Default**
   - All subnets are private unless explicitly configured as public
   - Enhanced security for sensitive workloads

4. **Naming Conventions**
   - Enforced through the NamingConventionAspect
   - Configurable patterns (prefix, suffix, contains)
   - Helps maintain consistent resource naming

5. **Environment Isolation**
   - Separate configurations for different environments
   - Support for different AWS accounts and regions
   - Environment-specific tagging

6. **Version Control**
   - Configuration version validation
   - Ensures compatibility between infrastructure and configurations
   - Prevents deployment with incompatible versions

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
