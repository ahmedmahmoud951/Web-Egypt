var http = require('http')
var fs = require('fs')
var path = require('path')

var logDir = path.join(__dirname, 'logs')
try {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)
  fs.appendFileSync(
    path.join(logDir, 'startup.log'),
    new Date().toISOString() +
      ' diag boot node=' +
      process.version +
      ' PORT=' +
      process.env.PORT +
      '\n'
  )
} catch (e) {}

http
  .createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(
      'MonsterASP Node OK\n' +
        'node=' +
        process.version +
        '\nPORT=' +
        process.env.PORT +
        '\ncwd=' +
        process.cwd() +
        '\n'
    )
  })
  .listen(process.env.PORT || 3000)
