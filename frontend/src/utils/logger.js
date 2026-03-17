/**
 * Centralised logger utility.
 *
 * - Development : all levels print normally.
 * - Production  : only `logger.error` prints; everything else is a no-op,
 *                 keeping the browser console clean for end users.
 *
 * Usage:
 *   import logger from '../utils/logger';
 *   logger.log('data loaded', data);
 *   logger.warn('retrying request');
 *   logger.error('API failure', err);   // always visible
 */

const isDev = process.env.NODE_ENV === 'development';

const noop = () => {};

const logger = {
  log:   isDev ? console.log.bind(console)   : noop,
  info:  isDev ? console.info.bind(console)  : noop,
  debug: isDev ? console.debug.bind(console) : noop,
  warn:  isDev ? console.warn.bind(console)  : noop,
  // errors are always surfaced so genuine problems are never silently swallowed
  error: console.error.bind(console),
};

export default logger;
