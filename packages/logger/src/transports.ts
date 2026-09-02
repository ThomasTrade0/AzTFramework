import type { LogLevel } from "./levels.js";

export type LogFields = Record<string, unknown>;

export interface LogRecord {
  level: LogLevel;
  message: string;
  time: string;
  name?: string;
  fields: LogFields;
}

export type Transport = (record: LogRecord) => void;

/** Writes each record as a single line of JSON — the default, suited to log aggregators. */
export function jsonTransport(write: (line: string) => void = (l) => console.log(l)): Transport {
  return (record) => {
    write(
      JSON.stringify({
        time: record.time,
        level: record.level,
        name: record.name,
        message: record.message,
        ...record.fields,
      }),
    );
  };
}

const LEVEL_LABEL: Record<LogLevel, string> = {
  trace: "TRACE",
  debug: "DEBUG",
  info: "INFO ",
  warn: "WARN ",
  error: "ERROR",
  fatal: "FATAL",
};

/** Writes a human-readable line per record — suited to local development. */
export function prettyTransport(write: (line: string) => void = (l) => console.log(l)): Transport {
  return (record) => {
    const scope = record.name ? ` [${record.name}]` : "";
    const extra = Object.keys(record.fields).length > 0 ? ` ${JSON.stringify(record.fields)}` : "";
    write(`${record.time} ${LEVEL_LABEL[record.level]}${scope} ${record.message}${extra}`);
  };
}
