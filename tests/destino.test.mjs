// Testes dos Dias de Destino: o desafio é o mesmo pra todos, os pontos batem e a patente sobe.
import { createRequire } from 'module'
import assert from 'assert'
import { readFileSync } from 'fs'
const require = createRequire(import.meta.url)
globalThis.window = globalThis
require('../site/data.js')
require('../site/js/impostor-nomes.js')
require('../site/js/grade-dados.js')
require('../site/js/grade-motor.js')
require('../site/js/arquivo-fatos.js')
require('../site/js/arquivo-motor.js')
require('../site/js/lab-elenco.js')
require('../site/js/lab-motor.js')
require('../site/js/destino-motor.js')
const M = globalThis.DestinoMotor
const G = globalThis.GradeDados

// o calendário
assert.strictEqual(M.TOTAL, 40)
assert.strictEqual(M.dataDo(0), M.INICIO)
assert.strictEqual(M.dataDo(M.TOTAL - 1), M.FIM)
assert.strictEqual(M.diaDe(Date.parse('2026-11-09T02:59:00Z')), '2026-11-08', 'ainda é dia 8 em Brasília')
assert.strictEqual(M.diaDe(Date.parse('2026-11-09T03:01:00Z')), '2026-11-09', 'virou o dia em Brasília')
assert(M.paraAmanha(Date.parse('2026-11-09T02:59:00Z')) === 60000, 'falta 1 minuto')
assert(!M.noPeriodo('2026-12-18') && M.noPeriodo('2026-12-17') && !M.noPeriodo('2026-11-07'))

// todos os 40 desafios: tipos variam, são válidos, e ficha não repete
const fichas = new Set()
let nFicha = 0, minimo = 99
for (let i = 0; i < M.TOTAL; i++) {
  const d = M.desafio(i)
  assert.strictEqual(d.tipo, M.tipoDe(i))
  if (d.tipo === 'ficha') {
    nFicha += 1
    fichas.add(d.key)
    assert.strictEqual(d.pistas.length, 6)
    for (const p of d.pistas.filter((x) => x.t === 'tema')) assert(G.porId[p.id].m.has(d.key), `dia ${i}: pista falsa`)
  }
  if (d.tipo === 'grade') for (let c = 0; c < 9; c++) { const n = M.respostasDaCasa(d, c).length; minimo = Math.min(minimo, n); assert(n >= 3, `dia ${i}: casa ${c} com ${n} respostas`) }
  if (d.tipo === 'lab') { assert.strictEqual(d.baralho.length, 8); assert.strictEqual(new Set(d.baralho).size, 8) }
}
assert.strictEqual(fichas.size, nFicha, 'ficha repetida')
assert.strictEqual(M.desafio(M.TOTAL - 1).key, 'doctor-doom', 'na estreia é o Destino')
assert.strictEqual(M.tipoDe(0), 'ficha'); assert.strictEqual(M.tipoDe(1), 'grade'); assert.strictEqual(M.tipoDe(2), 'lab')

// ficha: acertar cedo vale mais, errar tira 5 e abre a próxima pista
{
  const i = 0
  const k = M.desafio(i).key
  const outra = G.chaves.find((x) => x !== k)
  let st = M.novo(i)
  assert(M.chutarFicha(st, k).ok)
  assert.strictEqual(M.pontosFicha(st), 100)
  st = M.novo(i)
  assert(!M.chutarFicha(st, outra).ok)
  assert.strictEqual(st.pista, 1)
  assert.strictEqual(M.chutarFicha(st, outra), null, 'mesmo erro não conta de novo')
  M.pularFicha(st)
  M.chutarFicha(st, k)
  assert.strictEqual(M.pontosFicha(st), 55, '3ª pista (60) menos 1 erro')
  st = M.novo(i)
  for (let n = 0; n < 6; n++) M.pularFicha(st)
  assert(st.fim && !st.acertou)
  assert.strictEqual(M.pontosFicha(st), 0)
}

// grade: 3 vidas, personagem não repete, grid completo ganha bônus
{
  const i = 1
  const d = M.desafio(i)
  let st = M.novo(i)
  const errado = (c) => G.poolDa('ambos').find((k) => !M.respostasDaCasa(d, c).includes(k))
  for (let v = 0; v < 3; v++) assert(!M.chutarGrade(st, 0, errado(0)).ok)
  assert(st.fim, 'acabaram as vidas')
  st = M.novo(i)
  // preenche casa a casa, sem repetir personagem
  const usados = new Set()
  function preenche(c) { if (c === 9) return true; for (const k of M.respostasDaCasa(d, c)) { if (usados.has(k)) continue; usados.add(k); if (preenche(c + 1)) { st.casas[c] = k; return true } usados.delete(k) } return false }
  assert(preenche(0), 'o grid tem solução')
  const certas = [...st.casas]
  st = M.novo(i)
  certas.forEach((k, c) => assert(M.chutarGrade(st, c, k).ok))
  assert(st.fim)
  assert(M.pontosGrade(st) >= 100)
  const st2 = M.novo(i)
  M.chutarGrade(st2, 0, certas[0])
  assert.strictEqual(M.chutarGrade(st2, 1, certas[0]), null, 'personagem repetido')
}

// laboratório: coloca na ordem do baralho e vale sempre o mesmo
{
  const i = 2
  const st = M.novo(i)
  for (let t = 0; t < 8; t++) assert.strictEqual(M.colocarLab(st, t), M.desafio(i).baralho[t])
  assert(st.fim)
  assert.strictEqual(M.colocarLab(st, 0), null)
  assert.strictEqual(M.pontosDe(st), M.PT_LAB)
}

// sequência dá bônus, faltar zera a sequência mas não tira ponto; patente sobe
{
  const dias = {}
  let r = M.registrar(dias, M.dataDo(0), 'ficha', 100)
  assert.deepStrictEqual([r.seq, r.bonus, r.total], [1, 0, 100])
  assert.strictEqual(M.registrar(dias, M.dataDo(0), 'ficha', 100), null, 'o mesmo dia não conta duas vezes')
  r = M.registrar(dias, M.dataDo(1), 'grade', 60)
  assert.deepStrictEqual([r.seq, r.bonus, r.total], [2, 5, 165])
  assert(r.subiu, 'chegou em Agente')
  assert.strictEqual(r.patente.pt, 'Agente')
  r = M.registrar(dias, M.dataDo(3), 'ficha', 40)
  assert.deepStrictEqual([r.seq, r.bonus, r.total], [1, 0, 205], 'faltou um dia: sequência volta a 1, pontos ficam')
  for (let i = 4; i < 14; i++) r = M.registrar(dias, M.dataDo(i), 'lab', 50)
  assert.strictEqual(r.seq, 11)
  assert.strictEqual(r.bonus, 30, 'bônus tem teto')
  assert.strictEqual(M.patente(0).pt, 'Recruta')
  assert.strictEqual(M.patente(2600).proxima, null, 'última patente')
  // quem joga tudo bem chega na última patente
  const todos = {}
  for (let i = 0; i < M.TOTAL; i++) M.registrar(todos, M.dataDo(i), 'ficha', 70)
  assert.strictEqual(M.patente(M.total(todos)).pt, 'Sobrevivente de Doomsday')
}

// o cofre: nada legível no arquivo, e código errado não abre nem libera nada
{
  const guardado = {}
  globalThis.localStorage = { getItem: (k) => guardado[k] ?? null, setItem: (k, v) => { guardado[k] = v } }
  globalThis.document = { currentScript: null }
  require('../site/js/cofre.js')
  require('../site/js/cofre-dados.js')
  const texto = readFileSync(new URL('../site/js/cofre-dados.js', import.meta.url), 'utf8')
  assert(!texto.includes('data:image') && !/admin|asgard/i.test(texto), 'o cofre está legível')
  for (const errado of ['', 'abc', 'codigo-errado-1234', 'NOS-SOMOS-ADMIN', 'OURO-DE-ASGARD']) assert.strictEqual(await globalThis.Cofre.tentar(errado), null, `abriu com ${errado}`)
  assert.strictEqual(globalThis.Cofre.foto(), '')
  assert(!globalThis.Cofre.tem('ouro'))
}
console.log(`ok · ${M.TOTAL} dias · ${nFicha} fichas · grid mais apertado com ${minimo} respostas`)
