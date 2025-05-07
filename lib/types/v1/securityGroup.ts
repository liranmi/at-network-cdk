export interface SecurityGroupConfig {
    name: string;
    description: string;
    allowAllOutbound: boolean;
    /**
     * Version identifier for the config
     */
    version?: 'v1';
} 