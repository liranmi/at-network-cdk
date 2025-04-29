import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { CustomNetworkAcl } from '../code/nacl/network-acl';
import { NaclConfig } from '../../lib/types/nacl';

interface NaclInterval {
  start: number;
  end: number;
  totalResources: number;
  isPartOfLargeNacl: boolean;
  originalNaclIndex?: number;
  partNumber?: number;
}

export interface NaclStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  naclConfigs: NaclConfig[];
}

export class NaclStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NaclStackProps) {
    super(scope, id, props);

    console.log('\n=== Starting NACL Stack Creation ===');
    console.log(`Total NACLs to process: ${props.naclConfigs.length}`);

    // If no NACLs to process, return early
    if (props.naclConfigs.length === 0) {
      console.log('No NACLs to process, skipping stack creation');
      return;
    }

    // Build intervals of NACLs that fit within resource limits
    const intervals = this.buildNaclIntervals(props.vpc, props.naclConfigs);
    
    // If only one interval (total resources < 400), create a single non-nested stack
    if (intervals.length === 1) {
      console.log('\n=== Creating Single Non-Nested Stack ===');
      const interval = intervals[0];
      for (let i = interval.start; i <= interval.end; i++) {
        const naclConfig = props.naclConfigs[i];
        const naclName = interval.isPartOfLargeNacl 
          ? `${naclConfig.name}-part${interval.partNumber}`
          : naclConfig.name;

        console.log(`  Creating NACL: ${naclName}`);
        const nacl = new CustomNetworkAcl(this, naclName, {
          vpc: props.vpc,
          config: naclConfig,
        });
        if (naclConfig.subnetIds?.length) {
          // Associate the NACL with the specified subnets
          naclConfig.subnetIds.forEach((subnetId, index) => {
            const subnet = ec2.Subnet.fromSubnetId(this, `Subnet-${naclName}-${index}`, subnetId);
            console.log(`  Associating NACL with subnet: ${subnet.subnetId}`);
            new ec2.CfnSubnetNetworkAclAssociation(this, `SubnetNaclAssociation-${naclName}-${index}`, {
              networkAclId: nacl.networkAcl.ref,
              subnetId: subnet.subnetId
            });
          });
        }
      }
      return;
    }

    // Create nested stacks for each interval
    console.log(`\n=== Creating ${intervals.length} Nested Stacks ===`);
    intervals.forEach((interval, intervalIndex) => {
      console.log(`\nCreating nested stack ${intervalIndex}:`);
      console.log(`- Resources: ${interval.totalResources}`);
      console.log(`- NACLs: ${interval.end - interval.start + 1}`);
      
      const nestedStack = new cdk.NestedStack(this, `nacl-stack-${intervalIndex}`, {
        description: `Stack for NACL interval ${intervalIndex}`,
      });

      for (let i = interval.start; i <= interval.end; i++) {
        const naclConfig = props.naclConfigs[i];
        const naclName = interval.isPartOfLargeNacl 
          ? `${naclConfig.name}-part${interval.partNumber}`
          : naclConfig.name;

        console.log(`  Creating NACL: ${naclName}`);
        const nacl = new CustomNetworkAcl(nestedStack, naclName, {
          vpc: props.vpc,
          config: naclConfig,
        });
        if (naclConfig.subnetIds?.length) {
          // Associate the NACL with the specified subnets
          naclConfig.subnetIds.forEach((subnetId, index) => {
            const subnet = ec2.Subnet.fromSubnetId(nestedStack, `Subnet-${naclName}-${index}`, subnetId);
            console.log(`NESTED STACK: Associating NACL with subnet: ${subnet.subnetId}`);
            new ec2.CfnSubnetNetworkAclAssociation(nestedStack, `SubnetNaclAssociation-${naclName}-${index}`, {
              networkAclId: nacl.networkAcl.ref,
              subnetId: subnet.subnetId
            });
          });
        }
      }
    });
    console.log('\n=== NACL Stack Creation Complete ===\n');
  }

  private buildNaclIntervals(vpc: ec2.IVpc, naclConfigs: NaclConfig[]): NaclInterval[] {
    const intervals: NaclInterval[] = [];
    let currentInterval: NaclInterval = {
      start: 0,
      end: 0,
      totalResources: 0,
      isPartOfLargeNacl: false
    };

    console.log('\n=== Building NACL Intervals ===');
    console.log('----------------------------');

    naclConfigs.forEach((naclConfig, index) => {
      const naclResources = this.calculateNaclResources(naclConfig, vpc);
      console.log(`\nProcessing NACL ${index} (${naclConfig.name}):`);
      console.log(`- Resources: ${naclResources}`);
      console.log(`- Current interval resources: ${currentInterval.totalResources}`);
      
      // If NACL has more than 400 resources, split it into parts
      if (naclResources > 400) {
        console.log(`  NACL exceeds 400 resources, splitting into parts`);
        // If current interval is not empty, save it
        if (currentInterval.start !== currentInterval.end) {
          console.log(`  Saving current interval: [${currentInterval.start}, ${currentInterval.end}] with ${currentInterval.totalResources} resources`);
          intervals.push({ ...currentInterval });
        }

        // Split the large NACL into parts
        const parts = Math.ceil(naclResources / 400);
        console.log(`  Splitting into ${parts} parts`);
        for (let part = 0; part < parts; part++) {
          const partResources = Math.min(400, naclResources - (part * 400));
          console.log(`  Creating part ${part + 1} with ${partResources} resources`);
          intervals.push({
            start: index,
            end: index,
            totalResources: partResources,
            isPartOfLargeNacl: true,
            originalNaclIndex: index,
            partNumber: part + 1
          });
        }
        
        // Start a new interval
        currentInterval = {
          start: index + 1,
          end: index + 1,
          totalResources: 0,
          isPartOfLargeNacl: false
        };
      }
      // If adding this NACL would exceed 400 resources, start a new interval
      else if (currentInterval.totalResources + naclResources > 400) {
        console.log(`  Adding would exceed 400 resources, starting new interval`);
        if (currentInterval.start !== currentInterval.end) {
          console.log(`  Saving current interval: [${currentInterval.start}, ${currentInterval.end}] with ${currentInterval.totalResources} resources`);
          intervals.push({ ...currentInterval });
        }
        currentInterval = {
          start: index,
          end: index,
          totalResources: naclResources,
          isPartOfLargeNacl: false
        };
      } else {
        console.log(`  Adding to current interval`);
        currentInterval.end = index;
        currentInterval.totalResources += naclResources;
      }
    });

    // Add the last interval if it's not empty
    if (currentInterval.start !== currentInterval.end || currentInterval.totalResources > 0) {
      console.log(`\nSaving final interval: [${currentInterval.start}, ${currentInterval.end}] with ${currentInterval.totalResources} resources`);
      intervals.push(currentInterval);
    }

    console.log('\n=== Final Intervals ===');
    console.log('-------------------');
    intervals.forEach((interval, index) => {
      console.log(`\nInterval ${index}:`);
      console.log(`- Range: [${interval.start}, ${interval.end}]`);
      console.log(`- Resources: ${interval.totalResources}`);
      if (interval.isPartOfLargeNacl) {
        console.log(`- Part ${interval.partNumber} of large NACL ${naclConfigs[interval.originalNaclIndex!].name}`);
      } else {
        console.log('- NACLs:');
        for (let i = interval.start; i <= interval.end; i++) {
          console.log(`  - ${naclConfigs[i].name}`);
        }
      }
    });

    return intervals;
  }

  private calculateNaclResources(naclConfig: NaclConfig, vpc: ec2.IVpc): number {
    // Count resources:
    // 1. The NACL itself
    let total = 1;
    
    // 2. Each rule (both inbound and outbound)
    total += naclConfig.rules.length;
    
    // 3. Each subnet association
    total += naclConfig.subnetIds?.length ?? 0;
    
    return total;
  }
}