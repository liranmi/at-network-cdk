# at-network-cdk

## Prerequisites

Before you begin, make sure to install the required dependencies:

```sh
npm install aws-cdk@latest
npm install aws-cdk-lib constructs
npm install --save-dev @types/node

npm install --save-dev jest@latest @types/jest@latest ts-jest@latest
```

This will ensure you have the necessary libraries for AWS CDK, constructs, and testing.

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
- Built-in security best practices like Flow Logs and restricted default security groups.

#### 3. **Stacks and Constructs**
- **VPC Stack (`lib/stacks/vpc-stack.ts`):**  
  Deploys a VPC using a factory function that selects the correct construct version based on the config.
- **Security Group Stack (`lib/stacks/security-group-stack.ts`):**  
  Deploys Security Groups with automatic batching for large configurations.
- **Custom Constructs:**  
  Located in `lib/code/vpc/` and `lib/code/nacl/`, these implement reusable logic for VPCs and NACLs.

#### 4. **Aspects**
- **NamingConventionAspect (`aspects/naming-convention-aspect.ts`):**  
  Enforces naming conventions on CloudFormation resources with configurable patterns.

#### 5. **Entry Point**
- **`bin/at-network-cdk.ts`:**  
  - Loads the environment and tags from `environment-config.json`.
  - Loads the appropriate config objects from `network-config/`.
  - Instantiates the VPC and Security Group stacks with these configs.
  - Uses CDK Annotations for informative synthesis output.

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
     enableDnsHostnames: true,
     enableDnsSupport: true,
     // Enable Flow Logs for network monitoring
     flowLogs: {
       cloudwatch: {
         trafficType: ec2.FlowLogTrafficType.ALL
       }
     },
     // Restrict default security group for enhanced security
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
├── environment-config.json # Selects environment and tags
├── lib/
│   ├── code/               # Custom constructs/factories for VPC, NACL, etc.
│   ├── schemas/            # TypeScript interfaces (schemas) for config validation
│   ├── stacks/             # CDK Stacks (VPC, Security Groups)
│   └── utils/              # Utility functions
├── network-config/         # Environment-specific config objects
├── tests/                  # Unit and integration tests
└── ...
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

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
