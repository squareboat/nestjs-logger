import { Inject, Injectable } from '@nestjs/common'
import { SqbLoggerOptions } from './interfaces'
import winston from 'winston'
import { LoggerConstants } from './constant'
import TransportStream from 'winston-transport'

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
    let options = LoggerService.config.loggers[conn]
    if (LoggerService.config.disableConsole) {
      let transports = options.transports as TransportStream[]
      options.transports = transports.filter(
        (transport) => !(transport instanceof winston.transports.Console)
      )
    }
    return winston.createLogger(options as any)
  }
}
