// Servidor estático mínimo para testar a pasta site/ no navegador.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', 'site')
const PORT = Number(process.env.PORT || 5190)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' }

http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  const file = path.join(ROOT, url === '/' ? 'index.html' : url)
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return }
  try {
    let body = await readFile(file)
    // A página publicada ganha <!doctype> e <head> automaticamente; aqui imitamos isso.
    if (file.endsWith('index.html')) {
      body = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + body + '</body></html>'
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
    res.end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(PORT, () => console.log('http://localhost:' + PORT))
