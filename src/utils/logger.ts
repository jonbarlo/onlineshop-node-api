import winston from 'winston';
import path from 'path';
import { config } from '@/config';

// Create logs directory if it doesn't exist
const logDir = path.dirname(config.logging.file);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'simpleshop-api' },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // Write all logs to file in production
    ...(config.nodeEnv === 'production' ? [
      new winston.transports.File({
        filename: config.logging.file,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ] : []),
  ],
});

// Create a stream object for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
