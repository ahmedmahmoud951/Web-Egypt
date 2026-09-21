import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const colors: Record<string, string> = {
  info: '\x1b[36m',
  ok: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  step: '\x1b[34m',
};
const reset = '\x1b[0m';

/** Dev logs from the browser → appear in `npm run dev` terminal. */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const body = await req.json();
    const level = String(body.level || 'info');
    const scope = String(body.scope || 'app');
    const message = String(body.message || '');
    const path = String(body.path || '');
    const data = body.data;
    const color = colors[level] || colors.info;
    const icon =
      level === 'ok' ? '✓' : level === 'warn' ? '⚠' : level === 'error' ? '✗' : level === 'step' ? '→' : 'ℹ';

    const header = `${color}${icon} [TodayInEgypt][${scope}]${reset} ${message}${path ? `  (${path})` : ''}`;
    if (data !== undefined && data !== null) {
      console.log(header, typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.log(header);
    }
  } catch (err) {
    console.warn('[TodayInEgypt][dev-log] failed to parse body', err);
  }

  return NextResponse.json({ ok: true });
}
