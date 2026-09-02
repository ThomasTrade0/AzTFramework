import { LOG_LEVELS, isLevelEnabled, type LogLevel } from "./levels.js";
import { jsonTransport, type LogFields, type LogRecord, type Transport } from "./transports.js";

export interface LoggerOptions {
  /** Minimum level that will be written. Defaults to "info". */
  level?: LogLevel;
  /** Logical name for the logger (e.g. module or service name). */
  name?: string;
  /** Fields merged into every record emitted by this logger. */
  fields?: LogFields;
  /** Where records are written. Defaults to {@link jsonTransport}. */
  transport?: Transport;
  /** Clock override, primarily for tests. */
  now?: () => Date;
}

export interface Logger {
  readonly level: LogLevel;
  trace(message: string, fields?: LogFields): void;
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  fatal(message: string, fields?: LogFields): void;
  isLevelEnabled(level: LogLevel): boolean;
  /** Returns a new logger that merges `fields` into every record it emits. */
  child(fields: LogFields, options?: Pick<LoggerOptions, "name">): Logger;
}

class LoggerImpl implements Logger {
  readonly level: LogLevel;
  private readonly name?: string;
  private readonly fields: LogFields;
  private readonly transport: Transport;
  private readonly now: () => Date;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.name = options.name;
    this.fields = options.fields ?? {};
    this.transport = options.transport ?? jsonTransport();
    this.now = options.now ?? (() => new Date());
  }

  isLevelEnabled(level: LogLevel): boolean {
    return isLevelEnabled(level, this.level);
  }

  private write(level: LogLevel, message: string, fields?: LogFields): void {
    if (!this.isLevelEnabled(level)) return;
    const record: LogRecord = {
      level,
      message,
      time: this.now().toISOString(),
      name: this.name,
      fields: fields ? { ...this.fields, ...fields } : this.fields,
    };
    this.transport(record);
  }

  trace(message: string, fields?: LogFields): void {
    this.write("trace", message, fields);
  }
  debug(message: string, fields?: LogFields): void {
    this.write("debug", message, fields);
  }
  info(message: string, fields?: LogFields): void {
    this.write("info", message, fields);
  }
  warn(message: string, fields?: LogFields): void {
    this.write("warn", message, fields);
  }
  error(message: string, fields?: LogFields): void {
    this.write("error", message, fields);
  }
  fatal(message: string, fields?: LogFields): void {
    this.write("fatal", message, fields);
  }

  child(fields: LogFields, options: Pick<LoggerOptions, "name"> = {}): Logger {
    return new LoggerImpl({
      level: this.level,
      name: options.name ?? this.name,
      fields: { ...this.fields, ...fields },
      transport: this.transport,
      now: this.now,
    });
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  return new LoggerImpl(options);
}

export { LOG_LEVELS };
