import { Command, ConsoleIO } from "@squareboat/nest-console"
import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
const { createGzip } = require('node:zlib');
const { pipeline } = require('node:stream');
const {
  createReadStream,
  createWriteStream,
} = require('node:fs');

const { promisify } = require('node:util');
const pipe = promisify(pipeline);

async function do_gzip(input: string, output: string) {
  const gzip = createGzip();
  const source = createReadStream(input);
  const destination = createWriteStream(output);
  await pipe(source, gzip, destination);
}


@Injectable()
export class LoggerConsoleCommands {
  /**
   * Command to zip the logs
   */
  @Command('logger:rotate-log', {
    desc: 'Command to rotate logs',
  })
  public async rotateLog(_cli: ConsoleIO): Promise<void> {
    const logsDir = path.join(process.cwd(), 'log');
    const zipDir = path.join(logsDir, 'zip');

    // Create the zip directory if it doesn't exist
    if (!fs.existsSync(zipDir)) {
      fs.mkdirSync(zipDir);
    }

    // Read all .log files in the logs directory
    const logFiles = fs.readdirSync(logsDir).filter((file) => {
      return path.extname(file) === '.log';
    });

    // Compress each log file and save it to the zip directory

    for (let logFile of logFiles) {
      try {
        const logFilePath = path.join(logsDir, logFile);
        const zipFilePath = path.join(zipDir, `${logFile}-${new Date()}.zip`);
        await do_gzip(logFilePath, zipFilePath);
        fs.readFileSync(logFilePath);

        //clear the log file
        fs.truncateSync(logFilePath);
      } catch (err) {
        console.error('An error occurred:', err);
        process.exitCode = 1;
      }
    };
  }
}
