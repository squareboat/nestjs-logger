import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common'
import { SqbLoggerOptions } from './interfaces'
import winston, { Logger as WinstonLogger } from 'winston'
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

/** How long shutdown waits for the loggers to flush, by default. */
const DEFAULT_SHUTDOWN_TIMEOUT = 5000

function hasEnded(stream: any): boolean {
  return !!(stream?.writableEnded || stream?._writableState?.ended)
}

/**
 * Resolves once a File transport's underlying fs stream has written
 * everything. winston 3.19 already waits for it before 'finish'; older copies
 * (an app that pins its own winston) emit 'finish' before the data is on disk.
 */
function fileWritten(transport: any): Promise<void> {
  const dest = transport?._dest
  if (!dest || typeof dest.once !== 'function' || dest.writableFinished || dest.destroyed) {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    dest.once('finish', resolve)
    dest.once('close', resolve)
    dest.once('error', resolve)
  })
}

/**
 * Ends a logger and waits until its transports have written everything,
 * for at most `timeoutMs`.
 */
async function endLogger(logger: WinstonLogger, timeoutMs: number): Promise<void> {
  const transports = logger.transports.slice()
  // Console transports write synchronously, so there is nothing to flush. Detach
  // them instead of ending them: they keep working if the same options are used
  // for another app in this process (e.g. one app per test).
  for (const transport of transports.filter(isConsoleTransport)) {
    logger.remove(transport)
  }
  // Lines logged after shutdown are dropped instead of crashing the process
  // with an unhandled "write after end" error.
  logger.on('error', (err: any) => {
    if (err?.code === 'ERR_STREAM_WRITE_AFTER_END') return
    console.error('[@squareboat/nestjs-logger]', err)
  })

  const flushed = new Promise<void>((resolve) => {
    if ((logger as any)._writableState?.finished) return resolve()
    logger.once('finish', () => resolve())
    if (!hasEnded(logger)) logger.end()
  }).then(() => Promise.all(transports.map(fileWritten)))

  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs)
    timer.unref()
  })
  await Promise.race([flushed, timeout])
  clearTimeout(timer)
}

@Injectable()
export class LoggerService implements OnApplicationShutdown {
  private static config: SqbLoggerOptions
  private static options: Record<string, WinstonLogger> = {}
  private readonly loggers: WinstonLogger[] = []

  constructor(
    @Inject(LoggerConstants.loggerOptions) readonly config: SqbLoggerOptions
  ) {
    LoggerService.config = config
    for (const conn in LoggerService.config.loggers) {
      const logger = LoggerService.createLogger(conn)
      LoggerService.options[conn] = logger
      this.loggers.push(logger)
    }
  }

  /**
   * Ends the loggers when the app shuts down (`app.close()`, or a signal with
   * `enableShutdownHooks()`), so buffered lines reach files and other
   * transports before the process exits. Waits at most `shutdownTimeout` ms.
   */
  async onApplicationShutdown(): Promise<void> {
    const timeout = this.config.shutdownTimeout ?? DEFAULT_SHUTDOWN_TIMEOUT
    await Promise.all(this.loggers.map((logger) => endLogger(logger, timeout)))
  }

  static getConnection(conn?: string): WinstonLogger {
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

  static createLogger(conn: string): WinstonLogger {
    const options = LoggerService.config.loggers[conn]
    // `transports` may be one transport, an array or missing
    const configured = options.transports
    let transports: TransportStream[] =
      configured === undefined ? [] : Array.isArray(configured) ? configured : [configured]

    if (LoggerService.config.disableConsole) {
      transports = transports.filter((transport) => !isConsoleTransport(transport))
    }

    // A transport that was ended when an earlier app shut down cannot be
    // written to again (and would crash the process), so leave it out.
    if (transports.some(hasEnded)) {
      console.warn(
        `[@squareboat/nestjs-logger] logger '${conn}': skipping transports that were closed when a previous app shut down. ` +
          'Create the transports in a factory (registerAsync with useFactory) to get new ones for every app.'
      )
      transports = transports.filter((transport) => !hasEnded(transport))
    }

    return winston.createLogger({ ...options, transports })
  }
}
