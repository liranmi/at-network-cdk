export interface NaclRuleConfig {
    ruleNumber: number;
    protocol: number;
    action: 'allow' | 'deny';
    cidr: string;
    fromPort?: number;
    toPort?: number;
    egress?: boolean;
}

export interface NaclConfig {
    name: string;
    rules: NaclRuleConfig[];
    subnetIds?: string[];
    /**
     * Version identifier for the config
     */
    version?: 'v1';
} 