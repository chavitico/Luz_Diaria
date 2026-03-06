// Minimal logger: debug/info only in dev; warn/error always.
// Usage: import logger from '@/lib/logger';
//        logger.debug('[Tag] message', optionalData);

const IS_DEV = process.env.EXPO_PUBLIC_APP_ENV === 'dev' || !process.env.EXPO_PUBLIC_APP_ENV;

const logger = {
  debug: IS_DEV ? console.log.bind(console) : () => {},
  info:  IS_DEV ? console.log.bind(console) : () => {},
  warn:  console.warn.bind(console),
  error: console.error.bind(console),
};

export default logger;
