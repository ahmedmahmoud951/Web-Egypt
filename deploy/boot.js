'use strict';
const http = require('http');
const port = process.env.PORT || 3000;
const host = process.env.HOSTNAME || '127.0.0.1';
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('BOOT_OK url=' + req.url + '\n');
}).listen(port, host);
