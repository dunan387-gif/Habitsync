// Simple logging utility to control console output
class Logger {
  private isEnabled: boolean = false; // Set to false to disable all logs
  private isDebugEnabled: boolean = false; // Set to false to disable debug logs

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  enableDebug() {
    this.isDebugEnabled = true;
  }

  disableDebug() {
    this.isDebugEnabled = false;
  }

  log(...args: any[]) {
    if (this.isEnabled) {
      console.log(...args);
    }
  }

  debug(...args: any[]) {
    if (this.isEnabled && this.isDebugEnabled) {
      console.log('[DEBUG]', ...args);
    }
  }

  warn(...args: any[]) {
    if (this.isEnabled) {
      console.warn(...args);
    }
  }

  error(...args: any[]) {
    // Always log errors regardless of settings
    console.error(...args);
  }
}

export const logger = new Logger();

// Export convenience functions
export const log = (...args: any[]) => logger.log(...args);
export const debug = (...args: any[]) => logger.debug(...args);
export const warn = (...args: any[]) => logger.warn(...args);
export const error = (...args: any[]) => logger.error(...args);
