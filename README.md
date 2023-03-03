# Nestjs Logger

A simplified winston logger for your Nestjs applications

## Description
This package provides a NestJS logger wrapper around the Winston logger library. It allows you to easily configure and use Winston logger within your NestJS application

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
import { Module } from '@nestjs/common';
import { LoggerModule } from '@squareboat/nestjs-logger';
import winston from 'winston';

@Module({
  imports: [
    LoggerModule.register({
      isGlobal: true,
      default: 'properties',
      disableConsole: false,
      loggers: {
        properties: {
          level: 'error',
          transports: [
            new winston.transports.Console(),
          ],
        },
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }

```

## Recommended Way

### 1. Create logger.ts file

Use `ConfigModule` provided by NestJS to load configurations. To learn about ConfigModule, [Click here.](https://docs.nestjs.com/techniques/configuration)

```typescript
import { registerAs } from '@nestjs/config';
import winston from 'winston';
import path from 'path'
const { combine, timestamp, printf } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});


export default registerAs('logger', () => {
    return {
        default: 'payments',
        disableConsole: process.env.APP_ENV == 'local'? false: true,
        loggers: {
            payments: {
                level: 'error',
                format: combine(
                    timestamp(),
                    myFormat
                ),
                transports: [
                    new winston.transports.File({
                        filename: path.join(process.cwd(), 'log', '/payments.log'),
                        level: 'error'
                    }),
                ],
            }
        },
    };
});
```

By setting `disbaleConsole` to true you can restrict your console logs to be printed in production or other enviroments.
`Note that you can define multiple transports for the same logger`

### 2. Register Logger Module

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule } from '@squareboat/nestjs-logger'

@Module({
  imports: [
    LoggerModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => config.get('logger'),
      inject: [ConfigService],
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
```

### Knowing about Transports

Transports are the mechanisms by which log messages are delivered to their intended destinations, such as the console, files, or remote servers such as CloudWatch.

1. Console transport
The `Console` transport sends log messages to the console.

```typescript
transports: [new winston.transports.Console()]
```

2. File transport
The `File` transport writes log messages to a file.
`It is recommended to create your log files inside the root directory under the 'log' folder.`

```typescript
 transports: [
 new winston.transports.File({
 filename: path.join(process.cwd(), 'log', '/payments.log')
 })
 ]
```

To read about other transports that you can use [refer to Winston docs.](https://github.com/winstonjs/winston/blob/master/docs/transports.md#winston-core)

### Usage

First import Logger from `@squareboat/nestjs-logger`

```bash
import { Logger } from '@squareboat/nestjs-logger';
```
To use the logger named "payments" in your application and log an "info" level message, you can use the following code:

```bash
Logger('payments').info('Payment successful!!');
```

To know more about other logging levels [refer here.](https://github.com/winstonjs/winston#logging-levels)

## Available Commands

You can list all commands available in your application by 

```bash
node cli list
```

Under the available command you would see :
|logger:rotate-log | This command will create a zip of all the `.logs` files under your root log directory and save the zip in the directory itself.|
|:---|:---:|

You can run this command by ```node cli logger:rotate-log```

## Contributing

To know about contributing to this package, read the guidelines [here](./CONTRIBUTING.md)

## About Us

We are a bunch of dreamers, designers, and futurists. We are high on collaboration, low on ego, and take our happy hours seriously. We'd love to hear more about your product. Let's talk and turn your great ideas into something even greater! We have something in store for everyone. [☎️ 📧 Connect with us!](https://squareboat.com/contact)

We are hiring! Apply now at [careers](https://squareboat.com/careers) page

## License

The MIT License. Please see License File for more information. Copyright © 2023 SquareBoat.

Made with ❤️ by [Squareboat](https://squareboat.com)