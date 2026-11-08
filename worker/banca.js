// Servidorzinho da banca (Cloudflare Worker, plano gratuito): conta visitas e guarda sugestões.
// Nenhuma inteligência artificial roda aqui: as mensagens só ficam guardadas até alguém pedir pra ler, então spam não gasta crédito nenhum.
// Filtros das sugestões, em ordem: tamanho do envio, armadilhas pra robô, conteúdo, limite por pessoa, repetida, limite do dia e da caixa.
export const LIMITES = { corpoMax: 4096, minMs: 3000, minTexto: 8, maxTexto: 500, porHora: 3, porDia: 6, diaTotal: 40, naoLidas: 300, batidasMin: 40 }
const ORIGENS_BASE = ['https://b-e-s-s-a.github.io']
const PAGINAS = new Set(['home', 'draft', 'impostor', 'aposto', 'grade', 'arquivo', 'lab', 'missao'])

const sem = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(com|net|org|io|br|ru|xyz|top|info|shop|site|online|club|link|ly|co|biz|app|dev)\b)/i
const CONTATO = /\S+@\S+\.\S+|(\+?\d[\s().-]*){9,}/
const INUTIL = /(.)\1{7,}/
const PROPAGANDA = /\b(viagra|casino|cassino|crypto|bitcoin|forex|porn|xxx|loan|seo|backlink|telegram|onlyfans|renda extra|ganhe dinheiro|make money|click here|clique aqui)\b/
// recado escrito pra enganar uma IA que vá ler depois: some sem aviso
const ORDEM_PRA_IA = /ignor\w* .{0,30}(instruc|instruct|prompt)|system prompt|prompt do sistema/

// o que tem de errado no texto ('' = nada). 'silencio' = joga fora fingindo que deu certo
export function problema(texto) {
  const n = sem(texto)
  if (n.length < LIMITES.minTexto) return 'curto'
  if (n.length > LIMITES.maxTexto) return 'longo'
  if (CONTATO.test(n)) return 'contato'
  if (LINK.test(n)) return 'link'
  if (ORDEM_PRA_IA.test(n) || PROPAGANDA.test(n)) return 'silencio'
  if (INUTIL.test(n)) return 'inutil'
  const letras = (n.match(/[a-z]/g) || []).length
  if (letras / n.length < 0.5) return 'inutil'
  return ''
}

async function resumo(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(b)].slice(0, 16).map((x) => x.toString(16).padStart(2, '0')).join('')
}

// freio rápido, em memória: segura rajada antes de encostar no banco
const batidas = new Map()
function rajada(ip, agora) {
  const min = Math.floor(agora / 60000)
  if (batidas.size > 5000) batidas.clear()
  const b = batidas.get(ip)
  if (!b || b.min !== min) { batidas.set(ip, { min, n: 1 }); return false }
  b.n += 1
  return b.n > LIMITES.batidasMin
}
export const zerarRajada = () => batidas.clear()

function resposta(dados, status, origem) {
  return new Response(dados === null ? null : JSON.stringify(dados), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': origem, 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type', vary: 'origin' } })
}

async function lerCorpo(req) {
  if (Number(req.headers.get('content-length') || 0) > LIMITES.corpoMax) return null
  const txt = await req.text()
  if (txt.length > LIMITES.corpoMax) return null
  try { const d = JSON.parse(txt); return d && typeof d === 'object' ? d : null } catch (e) { return null }
}

async function visita(d, env, agora) {
  const p = String(d.p || '')
  if (!PAGINAS.has(p)) return
  const dia = new Date(agora).toISOString().slice(0, 10)
  await env.DB.prepare('INSERT INTO contagem (dia, pagina, n) VALUES (?, ?, 1) ON CONFLICT (dia, pagina) DO UPDATE SET n = n + 1').bind(dia, p).run()
}

const conta = async (env, sql, ...args) => (await env.DB.prepare(sql).bind(...args).first()).c

// devolve o que o site mostra pra pessoa: { ok: true } ou { ok: false, erro }
export async function sugestao(d, env, ip, agora) {
  // armadilhas: robô preenche o campo escondido e envia na hora. Recebe "ok" e a mensagem some, pra ele não aprender
  if (d.site || !(Number(d.ms) >= LIMITES.minMs)) return { ok: true }
  const texto = String(d.texto || '').trim()
  const erro = problema(texto)
  if (erro === 'silencio') return { ok: true }
  if (erro) return { ok: false, erro }
  const iso = new Date(agora).toISOString()
  const dia = iso.slice(0, 10)
  const umaHora = new Date(agora - 3600000).toISOString()
  // o IP nunca é guardado: só um resumo embaralhado que muda todo dia
  const quem = await resumo((env.SAL || '') + '|' + dia + '|' + ip)
  if (await conta(env, 'SELECT COUNT(*) c FROM sugestao WHERE quem = ? AND quando >= ?', quem, umaHora) >= LIMITES.porHora) return { ok: false, erro: 'muitas' }
  if (await conta(env, 'SELECT COUNT(*) c FROM sugestao WHERE quem = ?', quem) >= LIMITES.porDia) return { ok: false, erro: 'muitas' }
  const digest = await resumo(sem(texto))
  if (await conta(env, 'SELECT COUNT(*) c FROM sugestao WHERE digest = ?', digest)) return { ok: true } // repetida: já temos
  if (await conta(env, 'SELECT COUNT(*) c FROM sugestao WHERE quando >= ?', dia) >= LIMITES.diaTotal) return { ok: false, erro: 'cheio' }
  if (await conta(env, 'SELECT COUNT(*) c FROM sugestao WHERE lida = 0') >= LIMITES.naoLidas) return { ok: false, erro: 'cheio' }
  const tipo = d.tipo === 'erro' ? 'erro' : 'sugestao'
  const pagina = PAGINAS.has(String(d.p || '')) ? String(d.p) : 'home'
  await env.DB.prepare('INSERT INTO sugestao (quando, tipo, pagina, texto, digest, quem) VALUES (?, ?, ?, ?, ?, ?)').bind(iso, tipo, pagina, texto, digest, quem).run()
  return { ok: true }
}

export default {
  async fetch(req, env) {
    const origem = req.headers.get('origin') || ''
    const aceitas = [...ORIGENS_BASE, ...String(env.ORIGENS || '').split(',').map((s) => s.trim()).filter(Boolean)]
    if (!aceitas.includes(origem)) return new Response(null, { status: 403 })
    if (req.method === 'OPTIONS') return resposta(null, 204, origem)
    const rota = new URL(req.url).pathname
    if (req.method !== 'POST' || !['/visita', '/sugestao'].includes(rota)) return resposta({ ok: false }, 404, origem)
    const ip = req.headers.get('cf-connecting-ip') || ''
    const agora = Date.now()
    if (rajada(ip, agora)) return resposta({ ok: false, erro: 'muitas' }, 429, origem)
    const d = await lerCorpo(req)
    if (!d) return resposta({ ok: false }, 400, origem)
    try {
      if (rota === '/visita') { await visita(d, env, agora); return resposta(null, 204, origem) }
      return resposta(await sugestao(d, env, ip, agora), 200, origem)
    } catch (e) {
      return resposta({ ok: false, erro: 'servidor' }, 500, origem)
    }
  },
}
