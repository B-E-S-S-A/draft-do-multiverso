// Segunda tentativa para capas de HQ que faltaram: tenta outros títulos e,
// se a página não tiver imagem principal, usa o "image =" da ficha do personagem.
// Uso: node scripts/fix-missing.mjs
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..')
const RAW = path.join(ROOT, 'raw')
const UA = 'MultiversoDraft/1.0 (personal fan project)'
const API = 'https://en.wikipedia.org/w/api.php'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const TRY = {
  'captain-america': ['Captain America'],
  falcon: ['Falcon (comics)'],
  hercules: ['Hercules (Marvel Comics)'],
  namor: ['Namor'],
  mephisto: ['Mephisto (Marvel Comics)', 'Mephisto (comics)'],
  bullseye: ['Bullseye (Marvel Comics)', 'Bullseye (comics)'],
  clea: ['Clea (Marvel Comics)', 'Clea (comics)', 'Clea (character)'],
  wong: ['Wong (Marvel Comics)', 'Wong (comics)'],
  onslaught: ['Onslaught (Marvel Comics)', 'Onslaught (comics)'],
  agatha: ['Agatha Harkness'],
  'red-hulk': ['Red Hulk'],
  valkyrie: ['Valkyrie (Marvel Comics)'],
  'beta-ray-bill': ['Beta Ray Bill'],
  watcher: ['Uatu'],
}

async function get(url, json = true) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok) return json ? res.json() : Buffer.from(await res.arrayBuffer())
    const wait = Number(res.headers.get('retry-after')) || 0
    await sleep(Math.max(wait * 1000, 8000 * (i + 1)))
  }
  throw new Error('falhou ' + url)
}

const q = (o) => API + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...o })

async function lookup(title) {
  const j = await get(q({ action: 'query', redirects: '1', prop: 'pageimages|revisions|pageprops', piprop: 'thumbnail|name', pithumbsize: '400', pilicense: 'any', rvprop: 'content', rvslots: 'main', titles: title }))
  const p = j.query.pages[0]
  if (p.missing || (p.pageprops && 'disambiguation' in p.pageprops)) return null
  const wikitext = p.revisions ? p.revisions[0].slots.main.content : ''
  let thumb = p.thumbnail ? p.thumbnail.source : null
  if (!thumb) {
    const m = wikitext.match(/\|\s*image\s*=\s*(?:\[\[)?(?:File:|Image:)?([^|\]\n]+\.(?:jpe?g|png|gif|webp))/i)
    if (m) {
      await sleep(2500)
      const ii = await get(q({ action: 'query', prop: 'imageinfo', iiprop: 'url', iiurlwidth: '400', titles: 'File:' + m[1].trim() }))
      const info = ii.query.pages[0].imageinfo
      if (info) thumb = info[0].thumburl || info[0].url
    }
  }
  return thumb ? { resolved: p.title, thumb, wikitext } : null
}

function field(wt, name) {
  const m = wt.match(new RegExp('\\|\\s*' + name + '\\s*=([\\s\\S]*?)\\n\\s*\\|\\s*[a-z_ ]+\\s*=', 'i'))
  if (!m) return ''
  return m[1]
    .replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '').replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, ', ').replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{\s*(?:ubl|unbulleted list|plainlist|plain list|flatlist|hlist|nowrap)\s*\|([^{}]*)\}\}/gi, (_, x) => x.replace(/\|/g, ', '))
    .replace(/\{\{[^{}]*\}\}/g, '').replace(/[{}]/g, '').replace(/^\s*\*\s*/gm, ', ').replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/(,\s*)+/g, ', ').replace(/^[,\s]+|[,\s]+$/g, '').trim()
}

const metaPath = path.join(RAW, 'meta.json')
const meta = JSON.parse(await readFile(metaPath, 'utf8'))
for (const [key, titles] of Object.entries(TRY)) {
  if (meta.hq[key]) continue
  let hit = null
  for (const t of titles) {
    try { hit = await lookup(t) } catch (e) { console.log(key, e.message) }
    await sleep(2500)
    if (hit) { hit.title = t; break }
  }
  if (!hit) { console.log('sem capa:', key); continue }
  const ext = (hit.thumb.toLowerCase().match(/\.(jpe?g|png|gif|webp)(?:$|\?)/) || [, 'jpg'])[1].replace('jpeg', 'jpg')
  const file = path.join('img', 'hq', key + '.' + ext)
  try {
    await writeFile(path.join(RAW, file), await get(hit.thumb, false))
  } catch (e) { console.log(key, e.message); continue }
  meta.hq[key] = { title: hit.title, resolved: hit.resolved, thumb: hit.thumb, file, debut: field(hit.wikitext, 'debut'), creators: field(hit.wikitext, 'creators') }
  await writeFile(metaPath, JSON.stringify(meta, null, 1))
  console.log('ok:', key, '←', hit.resolved)
  await sleep(2500)
}
