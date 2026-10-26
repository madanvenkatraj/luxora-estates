/**
 * Tiny structured JSON-line logger for the LUXORA ESTATES API.
 *
 * Written via process.stdout.write — ESLint bans bare console.log here,
 * and a plain formatter keeps the log greppable.
 *
 * Log lines carry: event, method, path, status, durationMs and (when the
 * response is an error envelope) the error code — never request bodies or
 * stack traces.
 */

export interface Logger {
  info(event: string, fields?: Record<string, unknown>): void;
  warn(event: string, fields?: Record<string, unknown>): void;
  error(event: string, fields?: Record<string, unknown>): void;
}

function writeLine(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ level, event, ...fields });
  process.stdout.write(`${line}\n`);
}

export function createLogger(): Logger {
  return {
    info: (event, fields) => writeLine("info", event, fields),
    warn: (event, fields) => writeLine("warn", event, fields),
    error: (event, fields) => writeLine("error", event, fields),
  };
}

export const logger = createLogger();