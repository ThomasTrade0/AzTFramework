export const LOG_LEVELS = ["trace", "debug", "info", "warn", "error", "fatal"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const LEVEL_RANK: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

export function levelRank(level: LogLevel): number {
  return LEVEL_RANK[level];
}

export function isLevelEnabled(level: LogLevel, threshold: LogLevel): boolean {
  return levelRank(level) >= levelRank(threshold);
}
