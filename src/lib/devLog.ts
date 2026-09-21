/**
 * Dev-only logger — prints in browser console AND pipes to `npm run dev` terminal.
 */
const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'info' | 'ok' | 'warn' | 'error' | 'step';

const styles: Record<LogLevel, string> = {
  info: 'color:#2A6B78;font-weight:700',
  ok: 'color:#047857;font-weight:700',
  warn: 'color:#B45309;font-weight:700',
  error: 'color:#A11D2E;font-weight:700',
  step: 'color:#1D4ED8;font-weight:700',
};

const icons: Record<LogLevel, string> = {
  info: 'ℹ',
  ok: '✓',
  warn: '⚠',
  error: '✗',
  step: '→',
};

function safeData(data: unknown): unknown {
  if (data === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(data, (_k, v) => {
      if (typeof v === 'string' && v.length > 400) return `${v.slice(0, 400)}…`;
      if (_k.toLowerCase().includes('password') || _k.toLowerCase().includes('token')) {
        return typeof v === 'string' && v.length > 0 ? `[redacted:${v.length}]` : v;
      }
      return v;
    }));
  } catch {
    return String(data);
  }
}

function pipeToDevServer(level: LogLevel, scope: string, message: string, data?: unknown) {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({
      level,
      scope,
      message,
      data: safeData(data),
      path: window.location.pathname,
      ts: new Date().toISOString(),
    });
    // Fire-and-forget so it shows in the `npm run dev` terminal
    void fetch('/internal/dev-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

function emit(level: LogLevel, scope: string, message: string, data?: unknown) {
  if (!isDev) return;
  const prefix = `[TodayInEgypt][${scope}]`;
  const line = `${icons[level]} ${prefix} ${message}`;
  const payload = safeData(data);
  const args: unknown[] = [`%c${line}`, styles[level]];
  if (payload !== undefined) args.push(payload);

  switch (level) {
    case 'error':
      console.error(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    default:
      console.log(...args);
  }

  pipeToDevServer(level, scope, message, data);
}

export const devLog = {
  info: (scope: string, message: string, data?: unknown) => emit('info', scope, message, data),
  ok: (scope: string, message: string, data?: unknown) => emit('ok', scope, message, data),
  warn: (scope: string, message: string, data?: unknown) => emit('warn', scope, message, data),
  error: (scope: string, message: string, data?: unknown) => emit('error', scope, message, data),
  step: (scope: string, message: string, data?: unknown) => emit('step', scope, message, data),
};
