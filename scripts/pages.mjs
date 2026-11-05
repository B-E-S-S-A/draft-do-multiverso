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
// o título e a descrição vão pro <head>, que é onde o Google lê (o <title> que fica no index.html sai do <body>)
const URL_SITE = 'https://b-e-s-s-a.github.io/draft-do-multiverso/'
const TITULO = 'Banca do Multiverso · jogos da Marvel pra jogar com os amigos'
const DESCRICAO = 'Jogos de festa com personagens da Marvel, de graça e sem cadastro: Draft (leilão de heróis), Impostor, Aposto Que Sei, Minas do Multiverso, Grade do Multiverso e Missão Secreta. Num celular só ou cada um no seu, online.'
const body = (await readFile(path.join(SITE, 'index.html'), 'utf8')).replace(/<title>[^<]*<\/title>\s*/, '')
const meta = (k, v, attr = 'name') => `<meta ${attr}="${k}" content="${v}">`
const head = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  `<title>${TITULO}</title>` + meta('description', DESCRICAO) + `<link rel="canonical" href="${URL_SITE}">` +
  meta('og:type', 'website', 'property') + meta('og:title', TITULO, 'property') + meta('og:description', DESCRICAO, 'property') + meta('og:url', URL_SITE, 'property') +
  meta('og:locale', 'pt_BR', 'property') + meta('theme-color', '#23744f') +
  '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>' +
  '</head><body>'
await writeFile(path.join(DOCS, 'index.html'), head + body + '</body></html>\n')
await writeFile(path.join(DOCS, '.nojekyll'), '')
// pro Google achar e entrar
await writeFile(path.join(DOCS, 'robots.txt'), `User-agent: *
Allow: /
Sitemap: ${URL_SITE}sitemap.xml
`)
await writeFile(path.join(DOCS, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${URL_SITE}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url></urlset>
`)
console.log('docs/ pronto')
