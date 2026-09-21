import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { level, message, details } = body;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });

    if (level === 'error') {
      console.error(`\n\x1b[41m\x1b[37m[NEXT DEV UPLOAD ERROR ${time}]\x1b[0m \x1b[31m${message}\x1b[0m`);
    } else if (level === 'warn') {
      console.warn(`\n\x1b[43m\x1b[30m[NEXT DEV UPLOAD WARNING ${time}]\x1b[0m \x1b[33m${message}\x1b[0m`);
    } else if (level === 'success') {
      console.log(`\n\x1b[42m\x1b[30m[NEXT DEV UPLOAD SUCCESS ${time}]\x1b[0m \x1b[32m${message}\x1b[0m`);
    } else {
      console.log(`\n\x1b[44m\x1b[37m[NEXT DEV UPLOAD LOG ${time}]\x1b[0m \x1b[36m${message}\x1b[0m`);
    }

    if (details) {
      console.log('\x1b[90m' + (typeof details === 'object' ? JSON.stringify(details, null, 2) : details) + '\x1b[0m');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to parse log' }, { status: 400 });
  }
}
