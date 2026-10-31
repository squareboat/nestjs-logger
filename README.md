# Nestjs Logger

A simplified winston logger for your Nestjs applications

## Description

This package provides a NestJS logger wrapper around the Winston logger library. It allows you to easily configure and use Winston logger within your NestJS application

## Table Of Content

- [Nestjs Logger](#nestjs-logger)
  - [Table of Content](#table-of-content)
  - [Description](#description)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
    - [Static Registration](#static-registration)
    - [Recommended Way](#recommended-way)
  - [Knowing about Transports](#knowing-about-transports)
  - [Usage](#usage)
  - [Shutdown](#shutdown)
  - [Available Commands](#available-commands)
  - [About Us](#about-us)
  - [License](#license)

## Installation

To install the package, run

```bash
npm install @squareboat/nestjs-logger
```

OR

```bash
yarn add @squareboat/nestjs-logger
```

## Getting Started

To register `LoggerModule` with your app, import the module inside `AppModule`.

## Static Registration

To register the module statically you can do

```typescript
import { Module } from '@nestjs/common'
import { LoggerModule } from '@squareboat/nestjs-logger'
import winston from 'winston'

@Module({
  imports: [
    LoggerModule.register({
      isGlobal: true,
      default: 'properties',
      disableConsole: false,
      loggers: {
        properties: {
          level: 'error',
          transports: [new winston.transports.Console()],
        },
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

## Recommended Way

### 1. Create logger.ts file

Use `ConfigModule` provided by NestJS to load configurations. To learn about ConfigModule, [Click here.](https://docs.nestjs.com/techniques/configuration)

```typescript
// config/logger.ts
import { registerAs } from '@nestjs/config'
import winston from 'winston'
import path from 'path'
const { combine, timestamp, printf } = winston.format

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`
})

export default registerAs('logger', () => {
  return {
    default: 'payments',
    disableConsole: process.env.APP_ENV == 'local' ? false : true,
    loggers: {
      payments: {
        level: 'error',
        format: combine(timestamp(), myFormat),
        transports: [
          new winston.transports.File({
            filename: path.join(process.cwd(), 'log', '/payments.log'),
            level: 'error',
          }),
        ],
      },
    },
  }
})
```

By setting `disableConsole` to true you can restrict your console logs to be printed in production or other enviroments.
`Note that you can define multiple transports for the same logger`

### 2. Register Logger Module

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { LoggerModule, SqbLoggerOptions } from '@squareboat/nestjs-logger'
import logger from './config/logger'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [logger] }),
    LoggerModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => config.getOrThrow<SqbLoggerOptions>('logger'),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### Knowing about Transports

Transports are the mechanisms by which log messages are delivered to their intended destinations, such as the console, files, or remote servers such as CloudWatch.

> To read about other transports that you can use [refer to Winston docs.](https://github.com/winstonjs/winston/blob/master/docs/transports.md#winston-core)

1. Console transport
   The `Console` transport sends log messages to the console.

```typescript
import winston from 'winston'

const transports = [new winston.transports.Console()]
```

2. File transport
   The `File` transport writes log messages to a file.
   `It is recommended to create your log files inside the root directory under the 'log' folder.`

```typescript
import winston from 'winston'
import path from 'path'

const transports = [
  new winston.transports.File({
    filename: path.join(process.cwd(), 'log', 'payments.log'),
  }),
]
```

### Usage

First import Logger from `@squareboat/nestjs-logger`

```typescript
import { Logger } from '@squareboat/nestjs-logger'
```

To use the logger named "payments" in your application and log an "info" level message, you can use the following code:

```typescript
Logger('payments').info('Payment successful!!')
```

`Logger()` returns a `winston.Logger`; without a name it returns the `default` logger.

To know more about other logging levels [refer here.](https://github.com/winstonjs/winston#logging-levels)

### Shutdown

When the app shuts down (`await app.close()`, or a signal with `app.enableShutdownHooks()`), the loggers are
ended and shutdown waits until the transports have written every buffered line, so nothing is lost when the
process exits. It waits at most `shutdownTimeout` milliseconds (default `5000`):

```typescript
import { LoggerModule } from '@squareboat/nestjs-logger'

LoggerModule.register({
  isGlobal: true,
  default: 'app',
  disableConsole: false,
  shutdownTimeout: 10000,
  loggers: { app: { level: 'info' } },
})
```

Lines logged after the app has shut down are dropped. Transports are closed with their logger, so if you
create several apps in one process (for example one per test), create the transports in a factory
(`registerAsync` with `useFactory`, or `registerAs` as shown above) so every app gets new ones.

## Available Commands

We have added some useful commands which we think will add value to your workflow.

### node cli logger:rotate-log

You can use this command to create a zip of all `.logs` file under your root log directory.

## Contributing

To know about contributing to this package, read the guidelines [here](./CONTRIBUTING.md)

## About Us

We are a bunch of dreamers, designers, and futurists. We are high on collaboration, low on ego, and take our happy hours seriously. We'd love to hear more about your product. Let's talk and turn your great ideas into something even greater! We have something in store for everyone. [☎️ 📧 Connect with us!](https://squareboat.com/contact)

We are hiring! Apply now at [careers](https://squareboat.com/careers) page

## License

The MIT License. Please see License File for more information. Copyright © 2023 SquareBoat.

Made with ❤️ by [Squareboat](https://squareboat.com)
