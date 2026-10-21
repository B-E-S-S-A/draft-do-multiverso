// Copia site/ para docs/ (a pasta que o GitHub Pages publica) e completa o index.html
// com <!doctype> e <head>, que no Claude são colocados automaticamente.
// Uso: node scripts/pages.mjs
import { cp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..')
const SITE = path.join(ROOT, 'site')
const DOCS = path.join(ROOT, 'docs')

await rm(DOCS, { recursive: true, force: true })
await cp(SITE, DOCS, { recursive: true, filter: (src) => !path.basename(src).startsWith('__') })
const body = await readFile(path.join(SITE, 'index.html'), 'utf8')
const head = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>' +
  '</head><body>'
await writeFile(path.join(DOCS, 'index.html'), head + body + '</body></html>\n')
await writeFile(path.join(DOCS, '.nojekyll'), '')
console.log('docs/ pronto')
