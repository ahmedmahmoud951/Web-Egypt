'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const port = process.env.PORT || 3000;
const host = process.env.HOSTNAME || '127.0.0.1';

function exists(rel) {
  return fs.existsSync(path.join(__dirname, rel));
}

function basic() {
  const lines = [
    'node=' + process.version,
    'browser-logs=' + exists(path.join('node_modules', 'next', 'dist', 'server', 'dev', 'browser-logs', 'file-logger.js')),
  ];
  try {
    require('next/dist/server/lib/start-server');
    lines.push('require:start-server=OK');
  } catch (e) {
    lines.push('require:start-server=FAIL ' + (e && e.message));
  }
  return lines.join('\n') + '\n';
}

function tryNext(cb) {
  const chunks = [];
  const nextPort = 39999;
  const child = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: Object.assign({}, process.env, {
      PORT: String(nextPort),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
    }),
    windowsHide: true,
  });
  child.stdout.on('data', (d) => chunks.push(d.toString('utf8')));
  child.stderr.on('data', (d) => chunks.push(d.toString('utf8')));
  child.on('error', (e) => chunks.push('spawn-error: ' + e.message));

  let settled = false;
  const finish = (extra) => {
    if (settled) return;
    settled = true;
    try {
      child.kill();
    } catch (_) {}
    cb(chunks.join('') + (extra || ''));
  };

  setTimeout(() => {
    http
      .get({ hostname: '127.0.0.1', port: nextPort, path: '/', timeout: 15000 }, (res) => {
        let body = '';
        res.on('data', (c) => {
          body += c;
          if (body.length > 500) body = body.slice(0, 500);
        });
        res.on('end', () => {
          finish(
            '\n--- http / ---\nstatus=' +
              res.statusCode +
              '\nbodyPreview=' +
              body.replace(/\n/g, ' ') +
              '\n'
          );
        });
      })
      .on('error', (e) => {
        finish('\n--- http / ---\nREQ_ERR=' + e.message + '\n');
      });
  }, 4000);

  setTimeout(() => finish('\n(timeout 20s)\n'), 20000);
  child.on('exit', (code, signal) => {
    chunks.push('\nexitCode=' + code + ' signal=' + signal + '\n');
    finish('');
  });
}

http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    if ((req.url || '').indexOf('try-next') >= 0) {
      tryNext((out) => res.end(basic() + '\n--- try server.js ---\n' + out));
      return;
    }
    res.end(basic() + 'health=OK\n');
  })
  .listen(port, host);
