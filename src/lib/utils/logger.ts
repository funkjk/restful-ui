// import winston from "winston";
// import BrowserConsole from "winston-transport-browserconsole";

// const { combine, timestamp, prettyPrint, colorize, errors,  } = winston.format;

export const isBrowser = typeof window !== 'undefined';


export const transports = isBrowser ? [
    // new BrowserConsole(
    //     {
    //         format: combine(
    //             errors({ stack: true }), // <-- use errors format
    //             colorize(),
    //             timestamp(),
    //             prettyPrint()
    //         )
    //     }
    // )
] : [
    // new winston.transports.Console(),
    // new winston.transports.File({ filename: '/Users/kenji.funaki/projects/prv/product/restful-ui/mcp-configs/mcp-logger.log' })
]

export function createLogger(category?: string) {
    return {
        info: (message: any) => {
            console.log(message);
        },
        error: (message: any) => {
            console.error(message);
        },
        warn: (message: any) => {
            console.warn(message);
        },
        debug: (message: any) => {
            console.debug(message);
        },
        trace: (message: any) => {
            console.trace(message);
        }
    }
}

export const defaultLogger = createLogger()
