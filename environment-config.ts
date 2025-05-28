/**
 * Project version - used to track template compatibility
 */
export const AT_NETWORK_L2_VERSION = 'v1' as const;

interface EnvironmentConfig {
    environments: {
        [key: string]: {
            account: string | null;
            region: string | null;
        };
    };
    tags: {
        project: string;
        owner: string;
        environment: string;
    };
}

export const environmentConfig: EnvironmentConfig = {
    environments: {
        dev: {
            account: null,
            region: null
        },
        test: {
            account: null,
            region: null
        }/* ,
        prod: {
            account: null,
            region: null
        } */
    },
    tags: {
        project: 'liran-lab',
        owner: 'liran',
        environment: 'prod'
    }
}; 