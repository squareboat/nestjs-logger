import type { Logger as WinstonLogger } from 'winston';
import { LoggerService } from './service';

/**
 * Returns the winston logger registered under `conn` (the default logger when omitted).
 */
export function Logger(conn?: string): WinstonLogger {
  return LoggerService.getConnection(conn);
}
