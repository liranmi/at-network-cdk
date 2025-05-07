# Configuration Directory

This directory contains example configurations for different AWS resources. These configurations are primarily used for testing and demonstration purposes.

## Directory Structure

```
network-config/           # Network configuration directory
└── README.md           # This file

tests/
└── config/
    └── examples/       # Example configurations for testing
        ├── vpc-examples.ts    # VPC configurations for different environments
        └── nacl-examples.ts   # Network ACL configurations
```

## Usage

The example configurations in the `tests/config/examples` directory are designed to:
1. Demonstrate how to use the CDK constructs
2. Provide test cases for the infrastructure code
3. Serve as reference implementations for different deployment scenarios

## Configuration Types

### VPC Configurations
- Development environment (dev)
- Production environment (prod)
- Testing environment (test)
- IPAM-based configuration

Each configuration includes:
- CIDR block allocation
- Subnet configurations
- Network settings
- Environment-specific tags

### Network ACL Configurations
- Default rules
- Environment-specific rules
- Custom rule sets

## Best Practices

1. Use these examples as templates for your own configurations
2. Customize the configurations based on your specific requirements
3. Always review and adjust security settings before deployment
4. Consider using IPAM for production environments

## Testing

The configurations in `tests/config/examples` are used by the test suite to verify the correct behavior of the CDK constructs. When adding new configurations, ensure they are covered by appropriate test cases. 