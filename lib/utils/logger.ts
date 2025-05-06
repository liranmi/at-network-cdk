type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    debug: boolean;
    info: boolean;
    warn: boolean;
    error: boolean;
}

class Logger {
    private static instance: Logger;
    private config: LoggerConfig;

    private constructor() {
        // Default configuration - can be overridden by environment variables
        this.config = {
            debug: process.env.LOG_LEVEL === 'debug',
            info: ['info', 'debug'].includes(process.env.LOG_LEVEL || ''),
            warn: ['warn', 'info', 'debug'].includes(process.env.LOG_LEVEL || ''),
            error: true // Always log errors
        };
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public setConfig(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    public debug(message: string): void {
        if (this.config.debug) {
            console.log(`[DEBUG] ${message}`);
        }
    }

    public info(message: string): void {
        if (this.config.info) {
            console.log(`[INFO] ${message}`);
        }
    }

    public warn(message: string): void {
        if (this.config.warn) {
            console.warn(`[WARN] ${message}`);
        }
    }

    public error(message: string): void {
        if (this.config.error) {
            console.error(`[ERROR] ${message}`);
        }
    }
}

export const logger = Logger.getInstance(); 