type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.getCurrentUserId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;

    try {
      const user = localStorage.getItem('svenska_bro_user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.id;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (typeof window !== 'undefined') {
      try {
        const recentLogs = this.logs.slice(-100);
        localStorage.setItem('app_logs', JSON.stringify(recentLogs));
      } catch (e) {
        console.error('Failed to save logs to localStorage', e);
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('debug', message, context);
    this.addLog(entry);

    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('info', message, context);
    this.addLog(entry);

    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('warn', message, context);
    this.addLog(entry);

    console.warn(`[WARN] ${message}`, context || '');
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    const entry = this.createLogEntry('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
    this.addLog(entry);

    console.error(`[ERROR] ${message}`, error, context || '');
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app_logs');
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
