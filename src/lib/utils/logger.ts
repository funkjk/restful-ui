import winston from "winston";
import BrowserConsole from "winston-transport-browserconsole";

const { combine, timestamp, prettyPrint, colorize, errors,  } = winston.format;

export const isBrowser = typeof window !== 'undefined';

// ブラウザ環境用のシンプルなロガー
class BrowserLogger {
    private category?: string;

    constructor(category?: string) {
        this.category = category;
    }

    info(message: string, meta?: any) {
        const prefix = this.category ? `[${this.category}]` : '';
        console.log(`${prefix} ${message}`, meta || '');
    }

    error(message: string, meta?: any) {
        const prefix = this.category ? `[${this.category}]` : '';
        console.error(`${prefix} ${message}`, meta || '');
    }

    warn(message: string, meta?: any) {
        const prefix = this.category ? `[${this.category}]` : '';
        console.warn(`${prefix} ${message}`, meta || '');
    }

    debug(message: string, meta?: any) {
        const prefix = this.category ? `[${this.category}]` : '';
        console.debug(`${prefix} ${message}`, meta || '');
    }
}

export const transports = isBrowser ? [
    new BrowserConsole(
        {
            format: combine(
                errors({ stack: true }), // <-- use errors format
                colorize(),
                timestamp(),
                prettyPrint()
            )
        }
    )
] : [
    // new winston.transports.Console(),
    new winston.transports.File({ filename: './logs/mcp-logger.log' })
]

export function createLogger(category?: string) {
    if (isBrowser) {
        return new BrowserLogger(category);
    }
    
    return winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: transports
    })
}

export const defaultLogger = createLogger()