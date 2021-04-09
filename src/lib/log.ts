enum Level {
  ESSENTIAL,
  VERBOSE,
}

let verboseLogging = false;
let lastTimestamp: number | undefined;

/**
 * Sets the logging verbosity: true to log
 * verbose statements.
 * 
 * @param value The flag's value.
 */
export function setVerbose(value: boolean) {
  verboseLogging = value;
}

function log(level: Level, ...data: unknown[]): void {
  if (!verboseLogging && level === Level.VERBOSE) {
    return;
  }
  if (level !== Level.VERBOSE) {
    const now = performance.now();
    if (lastTimestamp) {
      data.push(`+${now - lastTimestamp}ms`);
    }
    lastTimestamp = now;
  }
  console.error(...data);
}

/**
 * Log an essential message.
 * 
 * @param message The message to log.
 */
export function essential(...data: unknown[]): void {
  log(Level.ESSENTIAL, ...data);
}

/**
 * Log a verbose message.
 * 
 * @param message The message to log.
 */
export function verbose(...data: unknown[]): void {
  log(Level.VERBOSE, ...data);
}
