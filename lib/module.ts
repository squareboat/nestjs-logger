import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { LoggerConsoleCommands } from './console';
import { LoggerConstants } from './constant';
import { SqbLoggerAsyncOptions, SqbLoggerAsyncOptionsFactory, SqbLoggerOptions } from './interfaces';
import { LoggerService } from './service';

@Module({
  providers: [LoggerService, LoggerConsoleCommands],
  exports: [LoggerService],
})
export class LoggerModule {
  /**
    * Register options
    * @param options
    */
  static register(options: SqbLoggerOptions): DynamicModule {
    return {
      global: options.isGlobal || false,
      module: LoggerModule,
      imports: [],
      providers: [
        LoggerService, LoggerConsoleCommands,
        { provide: LoggerConstants.loggerOptions, useValue: options }
      ],
    };
  }

  static registerAsync(options: SqbLoggerAsyncOptions): DynamicModule {
    return {
      global: options.isGlobal || false,
      module: LoggerModule,
      imports: [],
      providers: [
        LoggerService,
        LoggerConsoleCommands,
        this.createLoggerOptions(options),
      ],
    };
  }

  private static createLoggerOptions(
    options: SqbLoggerAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        provide: LoggerConstants.loggerOptions,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = [
      (options.useClass || options.useExisting) as Type<SqbLoggerOptions>,
    ];

    return {
      provide: LoggerConstants.loggerOptions,
      useFactory: async (optionsFactory: SqbLoggerAsyncOptionsFactory) =>
        await optionsFactory.createLoggerOptions(),
      inject,
    };
  }
}
