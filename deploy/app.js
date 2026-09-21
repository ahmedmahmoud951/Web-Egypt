/**
 * SiteASP / IIS entry (HttpPlatformHandler).
 * Writes logs/startup.log so empty HTTP 500 can be diagnosed from File Manager.
 */
const fs = require('fs')
const path = require('path')
const http = require('http')

const logsDir = path.join(__dirname, 'logs')
const logFile = path.join(logsDir, 'startup.log')

function log(msg) {
  const line = new Date().toISOString() + ' ' + msg + '\n'
  try {
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
    fs.appendFileSync(logFile, line)
  } catch (_) {}
  try {
    console.error(msg)
  } catch (_) {}
}

process.on('uncaughtException', (err) => {
  log('uncaughtException: ' + (err && err.stack ? err.stack : String(err)))
  process.exit(1)
})
process.on('unhandledRejection', (err) => {
  log('unhandledRejection: ' + (err && err.stack ? err.stack : String(err)))
})

const port = parseInt(process.env.PORT, 10) || 3000
if (!process.env.HOSTNAME || process.env.HOSTNAME === '0.0.0.0') {
  process.env.HOSTNAME = '127.0.0.1'
}

log(
  'boot node=' +
    process.version +
    ' PORT=' +
    process.env.PORT +
    ' HOSTNAME=' +
    process.env.HOSTNAME +
    ' cwd=' +
    process.cwd()
)

try {
  require('./server.js')
  log('server.js loaded')
} catch (err) {
  const stack = err && err.stack ? err.stack : String(err)
  log('require(server.js) failed: ' + stack)
  http
    .createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(
        'Node ' +
          process.version +
          ' is running, but Next.js server.js failed to load.\n\n' +
          stack
      )
    })
    .listen(port, process.env.HOSTNAME, () => {
      log('fallback HTTP server listening on ' + process.env.HOSTNAME + ':' + port)
    })
}
