"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.morganStream = exports.logSecurity = exports.logAuth = exports.logCacheOperation = exports.logDatabaseOperation = exports.logUserActivity = exports.logError = exports.logRequest = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(logColors);
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
const fileLogFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const transports = [
    new winston_1.default.transports.Console({
        format: logFormat,
    }),
    new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'app.log'),
        format: fileLogFormat,
    }),
    new winston_1.default.transports.File({
        filename: path_1.default.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: fileLogFormat,
    }),
];
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: logLevels,
    format: fileLogFormat,
    transports,
    exitOnError: false,
});
exports.logger = logger;
const logRequest = (req, res, responseTime) => {
    const { method, url, ip } = req;
    const { statusCode } = res;
    const logLevel = statusCode >= 400 ? 'error' : 'http';
    const message = `${method} ${url} - ${statusCode} - ${responseTime}ms - ${ip}`;
    logger.log(logLevel, message);
};
exports.logRequest = logRequest;
const logError = (error, context) => {
    const message = context
        ? `[${context}] ${error.message}`
        : error.message;
    logger.error(message, {
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
    });
};
exports.logError = logError;
const logUserActivity = (userId, action, details) => {
    logger.info(`User Activity - ID: ${userId}, Action: ${action}`, {
        userId,
        action,
        details,
        timestamp: new Date().toISOString(),
    });
};
exports.logUserActivity = logUserActivity;
const logDatabaseOperation = (operation, table, duration) => {
    const message = duration
        ? `DB Operation: ${operation} on ${table} - ${duration}ms`
        : `DB Operation: ${operation} on ${table}`;
    logger.debug(message);
};
exports.logDatabaseOperation = logDatabaseOperation;
const logCacheOperation = (operation, key, hit) => {
    const hitStatus = hit !== undefined ? (hit ? 'HIT' : 'MISS') : '';
    const message = `Cache ${operation}: ${key} ${hitStatus}`.trim();
    logger.debug(message);
};
exports.logCacheOperation = logCacheOperation;
const logAuth = (event, userId, ip) => {
    const message = `Auth Event: ${event}`;
    logger.info(message, {
        event,
        userId,
        ip,
        timestamp: new Date().toISOString(),
    });
};
exports.logAuth = logAuth;
const logSecurity = (event, details, level = 'warn') => {
    logger.log(level, `Security Event: ${event}`, {
        event,
        details,
        timestamp: new Date().toISOString(),
    });
};
exports.logSecurity = logSecurity;
exports.morganStream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
exports.default = logger;
//# sourceMappingURL=logger.js.map