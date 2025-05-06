import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { CustomNetworkAcl } from '../code/nacl/network-acl';
import { NaclConfig } from '../../lib/types/nacl';
import { logger } from '../utils/logger';

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

    logger.info('\n=== Starting NACL Stack Creation ===');
    logger.info(`Total NACLs to process: ${props.naclConfigs.length}`);

    // If no NACLs to process, return early
    if (props.naclConfigs.length === 0) {
      logger.info('No NACLs to process, skipping stack creation');
      return;
    }

    // Build intervals of NACLs that fit within resource limits
    const intervals = this.buildNaclIntervals(props.vpc, props.naclConfigs);

    // If only one interval (total resources < 400), create a single non-nested stack
    if (intervals.length === 1) {
      logger.info('\n=== Creating Single Non-Nested Stack ===');
      const interval = intervals[0];
      for (let i = interval.start; i <= interval.end; i++) {
        const naclConfig = props.naclConfigs[i];
        const naclName = interval.isPartOfLargeNacl
          ? `${naclConfig.name}-part${interval.partNumber}`
          : naclConfig.name;

        logger.debug(`  Creating NACL: ${naclName}`);
        const nacl = new CustomNetworkAcl(this, naclName, {
          vpc: props.vpc,
          config: naclConfig,
        });
        if (naclConfig.subnetIds?.length) {
          // Associate the NACL with the specified subnets
          naclConfig.subnetIds.forEach((subnetId, index) => {
            const subnet = ec2.Subnet.fromSubnetId(this, `Subnet-${naclName}-${index}`, subnetId);
            logger.debug(`  Associating NACL with subnet: ${subnet.subnetId}`);
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
    logger.info(`\n=== Creating ${intervals.length} Nested Stacks ===`);
    intervals.forEach((interval, intervalIndex) => {
      logger.info(`\nCreating nested stack ${intervalIndex}:`);
      logger.info(`- Resources: ${interval.totalResources}`);
      logger.info(`- NACLs: ${interval.end - interval.start + 1}`);

      const nestedStack = new cdk.NestedStack(this, `nacl-stack-${intervalIndex}`, {
        description: `Stack for NACL interval ${intervalIndex}`,
      });

      for (let i = interval.start; i <= interval.end; i++) {
        const naclConfig = props.naclConfigs[i];
        const naclName = interval.isPartOfLargeNacl
          ? `${naclConfig.name}-part${interval.partNumber}`
          : naclConfig.name;

        logger.debug(`  Creating NACL: ${naclName}`);
        const nacl = new CustomNetworkAcl(nestedStack, naclName, {
          vpc: props.vpc,
          config: naclConfig,
        });
        if (naclConfig.subnetIds?.length) {
          // Associate the NACL with the specified subnets
          naclConfig.subnetIds.forEach((subnetId, index) => {
            const subnet = ec2.Subnet.fromSubnetId(nestedStack, `Subnet-${naclName}-${index}`, subnetId);
            logger.debug(`NESTED STACK: Associating NACL with subnet: ${subnet.subnetId}`);
            new ec2.CfnSubnetNetworkAclAssociation(nestedStack, `SubnetNaclAssociation-${naclName}-${index}`, {
              networkAclId: nacl.networkAcl.ref,
              subnetId: subnet.subnetId
            });
          });
        }
      }
    });
    logger.info('\n=== NACL Stack Creation Complete ===\n');
  }

  private buildNaclIntervals(vpc: ec2.IVpc, naclConfigs: NaclConfig[]): NaclInterval[] {
    const intervals: NaclInterval[] = [];
    let currentInterval: NaclInterval = {
      start: 0,
      end: 0,
      totalResources: 0,
      isPartOfLargeNacl: false
    };

    logger.debug('\n=== Building NACL Intervals ===');
    logger.debug('----------------------------');

    naclConfigs.forEach((naclConfig, index) => {
      const naclResources = this.calculateNaclResources(naclConfig, vpc);
      logger.debug(`\nProcessing NACL ${index} (${naclConfig.name}):`);
      logger.debug(`- Resources: ${naclResources}`);
      logger.debug(`- Current interval resources: ${currentInterval.totalResources}`);

      // If NACL has more than 400 resources, split it into parts
      if (naclResources > 400) {
        logger.debug(`  NACL exceeds 400 resources, splitting into parts`);
        // If current interval is not empty, save it
        if (currentInterval.start !== currentInterval.end) {
          logger.debug(`  Saving current interval: [${currentInterval.start}, ${currentInterval.end}] with ${currentInterval.totalResources} resources`);
          intervals.push({ ...currentInterval });
        }

        // Split the large NACL into parts
        const parts = Math.ceil(naclResources / 400);
        logger.debug(`  Splitting into ${parts} parts`);
        for (let part = 0; part < parts; part++) {
          const partResources = Math.min(400, naclResources - (part * 400));
          logger.debug(`  Creating part ${part + 1} with ${partResources} resources`);
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
        logger.debug(`  Adding would exceed 400 resources, starting new interval`);
        if (currentInterval.start !== currentInterval.end) {
          logger.debug(`  Saving current interval: [${currentInterval.start}, ${currentInterval.end}] with ${currentInterval.totalResources} resources`);
          intervals.push({ ...currentInterval });
        }
        currentInterval = {
          start: index,
          end: index,
          totalResources: naclResources,
          isPartOfLargeNacl: false
        };
      } else {
        logger.debug(`  Adding to current interval`);
        currentInterval.end = index;
        currentInterval.totalResources += naclResources;
      }
    });

    // Add the last interval if it's not empty
    if (currentInterval.start !== currentInterval.end || currentInterval.totalResources > 0) {
      logger.debug(`\nSaving final interval: [${currentInterval.start}, ${currentInterval.end}] with ${currentInterval.totalResources} resources`);
      intervals.push(currentInterval);
    }

    logger.debug('\n=== Final Intervals ===');
    logger.debug('-------------------');
    intervals.forEach((interval, index) => {
      logger.debug(`\nInterval ${index}:`);
      logger.debug(`- Range: [${interval.start}, ${interval.end}]`);
      logger.debug(`- Resources: ${interval.totalResources}`);
      if (interval.isPartOfLargeNacl) {
        logger.debug(`- Part ${interval.partNumber} of large NACL ${naclConfigs[interval.originalNaclIndex!].name}`);
      } else {
        logger.debug('- NACLs:');
        for (let i = interval.start; i <= interval.end; i++) {
          logger.debug(`  - ${naclConfigs[i].name}`);
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