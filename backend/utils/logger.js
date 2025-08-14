const winston = require('winston');

// Create a custom format for console logging
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// Create a custom format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat,
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // Write all logs to 'combined.log'
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ],
  // Don't exit on handled exceptions
  exitOnError: false
});

module.exports = logger;
