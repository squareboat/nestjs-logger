import { Inject, Injectable } from '@nestjs/common'
import { SqbLoggerOptions } from './interfaces'
import winston from 'winston'
import { LoggerConstants } from './constant'
import TransportStream from 'winston-transport'

/**
 * Console transports are matched by name, not with `instanceof`: an app that
 * pins another winston version has its own copy of the Console class.
 */
function isConsoleTransport(transport: any): boolean {
  return (
    transport instanceof winston.transports.Console ||
    transport?.name === 'console' ||
    transport?.constructor?.name === 'Console'
  )
}

@Injectable()
export class LoggerService {
  private static config: SqbLoggerOptions
  private static options: any = {}

  constructor(
    @Inject(LoggerConstants.loggerOptions) readonly config: SqbLoggerOptions
  ) {
    LoggerService.config = config
    for (const conn in LoggerService.config.loggers) {
      LoggerService.options[conn] = LoggerService.createLogger(conn)
    }
  }

  static getConnection(conn?: string) {
    conn = conn || LoggerService.config.default
    const availableLoggers = Object.keys(LoggerService.options)
    if (!availableLoggers.includes(conn as string)) {
      throw new Error(`Cannot find any loger with name: ${conn}`)
    }

    if (LoggerService.options[conn as string]) {
      return LoggerService.options[conn as string]
    }

    const connection = this.createLogger(conn as string)
    LoggerService.options[conn as string] = connection
    return connection
  }

  static createLogger(conn: string) {
    const options = LoggerService.config.loggers[conn]
    // `transports` may be one transport, an array or missing
    const configured = options.transports
    let transports: TransportStream[] =
      configured === undefined ? [] : Array.isArray(configured) ? configured : [configured]

    if (LoggerService.config.disableConsole) {
      transports = transports.filter((transport) => !isConsoleTransport(transport))
    }

    return winston.createLogger({ ...options, transports })
  }
}
