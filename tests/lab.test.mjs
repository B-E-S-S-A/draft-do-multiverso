// Testes do Laboratório: cartas bem formadas, a mão de cada um, o voto (ninguém vota em si) e o mata-mata até sobrar um.
import { createRequire } from 'module'
import assert from 'assert'
const require = createRequire(import.meta.url)
globalThis.window = globalThis
require('../site/data.js')
require('../site/js/lab-dados.js')
require('../site/js/lab-motor.js')
const L = globalThis.LabDados
const M = globalThis.LabMotor

for (const [nome, lista] of [['poderes', L.PODERES], ['fraquezas', L.FRAQUEZAS], ['nomes', L.NOMES]]) {
  for (const x of lista) assert(x.length === 2 && x[0] && x[1], `${nome}: falta língua em ${x}`)
  assert.strictEqual(new Set(lista.map((x) => x[0])).size, lista.length, `${nome}: carta repetida`)
}
assert(L.PODERES.length >= M.MAX * 3 && L.FRAQUEZAS.length >= M.MAX * 3, 'carta suficiente pra sala cheia')

const gente = (n) => Array.from({ length: n }, (_, i) => ({ nome: 'p' + i }))
const monta = (J, j, nome) => { const m = J.js[j].mao; return M.montar(J, j, { corpo: m.corpos[0], poder: m.poderes[0], fraqueza: m.fraquezas[0], nome }) }

// mão: 3 de cada no modo escolhe, 1 no sorteio, e ninguém recebe carta igual
{
  const J = M.novoJogo({ jogadores: gente(8) })
  assert.strictEqual(J.js[0].mao.corpos.length, 3)
  assert.strictEqual(new Set(J.js.flatMap((p) => p.mao.poderes)).size, 24)
  assert.strictEqual(new Set(J.js.flatMap((p) => p.mao.fraquezas)).size, 24)
  assert.strictEqual(new Set(J.js.flatMap((p) => p.mao.corpos)).size, 24)
  const S = M.novoJogo({ modo: 'sorteio', jogadores: gente(3) })
  assert.strictEqual(S.js[1].mao.poderes.length, 1)
}

// só vale carta da própria mão; nome vazio ganha um pronto; nome é cortado
{
  const J = M.novoJogo({ jogadores: gente(3) })
  const m = J.js[0].mao
  assert.strictEqual(M.montar(J, 0, { corpo: J.js[1].mao.corpos[0], poder: m.poderes[0], fraqueza: m.fraquezas[0], nome: 'x' }), null, 'carta dos outros')
  assert(monta(J, 0, '   ').pronto >= 0)
  assert.strictEqual(monta(J, 0, 'de novo'), null, 'já montou')
  assert.strictEqual(monta(J, 1, 'a'.repeat(80)).nome.length, 26)
  assert.strictEqual(J.fase, 'montar')
  monta(J, 2, 'Fulano')
  assert.strictEqual(J.fase, 'duelo', 'todos prontos: começa o mata-mata')
}

// com 3: 1 duelo, um passa direto; quem está no duelo não vota; os outros decidem
{
  const J = M.novoJogo({ jogadores: gente(3) })
  ;[0, 1, 2].forEach((j) => monta(J, j, 'H' + j))
  const { a, b } = J.duelo
  const fora = [0, 1, 2].find((j) => j !== a && j !== b)
  assert.strictEqual(M.votar(J, a, 'a'), null, 'não vota no próprio duelo')
  assert(M.votar(J, fora, 'b'))
  assert.strictEqual(J.fase, 'resultado')
  assert.strictEqual(J.duelo.ganhou, b)
  M.seguir(J)
  assert.strictEqual(J.fase, 'duelo', 'a final')
  assert(new Set([J.duelo.a, J.duelo.b]).has(b) && new Set([J.duelo.a, J.duelo.b]).has(fora))
  M.votar(J, a, 'a')
  assert.strictEqual(J.fase, 'resultado')
  assert(M.votantes(J).includes(a), 'quem caiu continua votando')
  M.seguir(J)
  assert.strictEqual(J.fase, 'fim')
  assert.strictEqual(J.campeao, J.historia[1].ganhou)
}

// empate: alguém ganha mesmo assim, marcado como desempate
{
  const J = M.novoJogo({ jogadores: gente(4) })
  ;[0, 1, 2, 3].forEach((j) => monta(J, j, 'H' + j))
  const [v1, v2] = M.votantes(J)
  M.votar(J, v1, 'a'); M.votar(J, v2, 'b')
  assert.strictEqual(J.fase, 'resultado')
  assert(J.duelo.desempate)
  assert([J.duelo.a, J.duelo.b].includes(J.duelo.ganhou))
}

// partidas inteiras de 3 a 8, com e sem cartas: sempre um campeão, e cada herói só perde uma vez
let partidas = 0, empates = 0
for (let n = M.MIN; n <= M.MAX; n++) for (const modo of ['escolhe', 'sorteio']) for (let g = 0; g < 15; g++) {
  const J = M.novoJogo({ modo, jogadores: gente(n) })
  let passos = 0
  while (J.fase !== 'fim' && passos++ < 500) {
    if (J.fase === 'resultado') { M.seguir(J); continue }
    M.forcar(J)
  }
  assert.strictEqual(J.fase, 'fim', `${n} jogadores: terminou`)
  assert(J.campeao >= 0 && J.campeao < n)
  assert.strictEqual(J.historia.length, n - 1, 'mata-mata tem n-1 duelos')
  const perderam = J.historia.map((d) => (d.ganhou === d.a ? d.b : d.a))
  assert.strictEqual(new Set(perderam).size, n - 1, 'ninguém perde duas vezes')
  assert(!perderam.includes(J.campeao), 'o campeão não perdeu')
  empates += J.historia.filter((d) => d.desempate).length
  partidas += 1
}
console.log(`ok · ${L.PODERES.length} poderes · ${L.FRAQUEZAS.length} fraquezas · ${partidas} partidas · ${empates} desempates do Vigia`)
