// Minimal proxy for DashScope API in production
// Usage: node proxy.js
// Then set your frontend base URL to http://localhost:3000

const http = require('http')
const https = require('https')

const PORT = process.env.PORT || 3000
const TARGET = 'dashscope.aliyuncs.com'

const server = http.createServer((req, res) => {
  const auth = req.headers['authorization']

  const options = {
    hostname: TARGET,
    path: req.url.replace('/api/qwen', '/api/v1').replace('/api/wanxiang', '/api/v1'),
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth || ''
    }
  }

  const proxy = https.request(options, (pres) => {
    res.writeHead(pres.statusCode, pres.headers)
    pres.pipe(res)
  })

  proxy.on('error', (err) => {
    res.writeHead(502)
    res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }))
  })

  req.pipe(proxy)
})

server.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`)
})
