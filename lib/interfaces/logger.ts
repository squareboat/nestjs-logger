import { ModuleMetadata, Type } from '@nestjs/common';
import { LoggerOptions } from 'winston'

export interface SqbLoggerOptions {
  isGlobal: boolean
  default: string;
  disableConsole: boolean;
  loggers: {
    [key: string]: LoggerOptions
  }
}

export interface SqbLoggerAsyncOptionsFactory {
  createLoggerOptions(): Promise<SqbLoggerOptions> | SqbLoggerOptions;
}

export interface SqbLoggerAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  name?: string;
  isGlobal: boolean;
  useExisting?: Type<SqbLoggerOptions>;
  useClass?: Type<SqbLoggerAsyncOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<SqbLoggerOptions> | SqbLoggerOptions;
  inject?: any[];
}

