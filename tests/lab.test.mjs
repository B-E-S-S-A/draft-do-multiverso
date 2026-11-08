// Testes do Laboratório: todos recebem os mesmos personagens, ninguém troca nem repete tópico, o voto (ninguém vota em si) e o mata-mata.
import { createRequire } from 'module'
import assert from 'assert'
const require = createRequire(import.meta.url)
globalThis.window = globalThis
require('../site/data.js')
require('../site/js/lab-elenco.js')
require('../site/js/lab-motor.js')
const M = globalThis.LabMotor
const T = M.PADRAO
const EL = globalThis.LabElenco
const DD = globalThis.DRAFT_DATA

// o elenco: ninguém repetido, e todo mundo tem de onde tirar a capa
assert.strictEqual(new Set(EL.chaves).size, EL.chaves.length, 'personagem repetido no elenco')
assert(EL.chaves.length >= 240, `elenco pequeno (${EL.chaves.length})`)
for (const x of Object.values(EL.extras)) { assert(DD.works[x.w], `${x.key}: obra ${x.w} não existe`); assert(x.n && x.en, `${x.key}: falta nome`) }

const gente = (n) => Array.from({ length: n }, (_, i) => ({ nome: 'p' + i }))
// todos colocam os personagens nos tópicos, na ordem
function monta(J) { for (let r = 0; r < T.length; r++) for (let j = 0; j < J.js.length; j++) { if (J.modo === 'turno') J.vez = j; M.colocar(J, j, r) } }

assert.strictEqual(T.length, 8)
assert.strictEqual(new Set(T).size, 8)
// tópicos editados: vazios saem, texto é cortado, e com menos de 3 volta o padrão
assert.deepStrictEqual(M.limpaTopicos([' Fome ', '', 'Sono', 'x'.repeat(40)]), ['Fome', 'Sono', 'x'.repeat(14)])
assert.deepStrictEqual(M.limpaTopicos(['a', '']), T)
assert.deepStrictEqual(M.limpaTopicos(undefined), T)
assert.strictEqual(M.limpaTopicos(Array(20).fill('a')).length, M.MAX_TOPICOS)
{
  const J = M.novoJogo({ jogadores: gente(3), topicos: ['Fome', 'Sono', 'Fome'] })
  assert.strictEqual(J.topicos.length, 3, 'tópico repetido pode')
  assert.strictEqual(J.baralho.length, 3, 'um personagem por tópico')
  for (let r = 0; r < 3; r++) for (let j = 0; j < 3; j++) M.colocar(J, j, r)
  assert.strictEqual(J.fase, 'duelo')
}

// junto: todos veem o mesmo personagem, e ninguém anda antes dos outros
{
  const J = M.novoJogo({ jogadores: gente(3) })
  assert.strictEqual(new Set(J.baralho).size, 8, 'personagem repetido')
  const k = M.daVez(J, 0)
  assert(k && k === M.daVez(J, 1) && k === M.daVez(J, 2), 'mesmo personagem pra todos')
  assert.strictEqual(M.colocar(J, 0, 99), null, 'tópico que não existe')
  assert.strictEqual(M.colocar(J, 0, 2), k)
  assert.strictEqual(M.daVez(J, 0), null, 'espera os outros')
  assert.strictEqual(M.colocar(J, 0, 0), null, 'não anda sozinho')
  M.colocar(J, 1, 0); M.colocar(J, 2, 1)
  const k2 = M.daVez(J, 0)
  assert(k2 && k2 !== k, 'veio o próximo')
  assert.strictEqual(M.colocar(J, 0, 2), null, 'não pode trocar nem repetir tópico')
  assert.strictEqual(J.js[0].heroi[2], k)
}

// turno: um monta o herói inteiro e passa pro próximo, com os mesmos personagens
{
  const J = M.novoJogo({ modo: 'turno', jogadores: gente(3) })
  const k = J.baralho[0]
  assert.strictEqual(M.daVez(J, 1), null, 'não é a vez dele')
  for (let i = 0; i < 8; i++) M.colocar(J, 0, i)
  assert.strictEqual(J.vez, 1)
  assert.strictEqual(M.daVez(J, 1), k, 'o próximo recebe os mesmos')
  for (let i = 0; i < 8; i++) M.colocar(J, 1, i)
  for (let i = 7; i >= 0; i--) M.colocar(J, 2, i)
  assert.strictEqual(J.fase, 'duelo', 'todos prontos: começa o mata-mata')
  assert.strictEqual(J.js[2].heroi[7], k, 'cada um pôs onde quis')
  assert.deepStrictEqual(new Set(Object.values(J.js[0].heroi)), new Set(J.baralho), 'os 8 no herói')
}

// com 3: 1 duelo, um passa direto; quem está no duelo não vota; quem caiu continua votando
{
  const J = M.novoJogo({ jogadores: gente(3) })
  monta(J)
  const { a, b } = J.duelo
  const fora = [0, 1, 2].find((j) => j !== a && j !== b)
  assert.strictEqual(M.votar(J, a, 'a'), null, 'não vota no próprio duelo')
  assert(M.votar(J, fora, 'b'))
  assert.strictEqual(J.fase, 'resultado')
  assert.strictEqual(J.duelo.ganhou, b)
  M.seguir(J)
  assert.strictEqual(J.fase, 'duelo', 'a final')
  assert(M.votantes(J).includes(a), 'quem caiu continua votando')
  M.votar(J, a, 'a')
  M.seguir(J)
  assert.strictEqual(J.fase, 'fim')
  assert.strictEqual(J.campeao, J.historia[1].ganhou)
}

// empate: alguém ganha mesmo assim, marcado como desempate
{
  const J = M.novoJogo({ jogadores: gente(4) })
  monta(J)
  const [v1, v2] = M.votantes(J)
  M.votar(J, v1, 'a'); M.votar(J, v2, 'b')
  assert(J.duelo.desempate)
  assert([J.duelo.a, J.duelo.b].includes(J.duelo.ganhou))
}

// partidas inteiras de 3 a 8, nos dois jeitos: sempre um campeão, e cada herói só perde uma vez
let partidas = 0, empates = 0
for (let n = M.MIN; n <= M.MAX; n++) for (const modo of ['junto', 'turno']) for (let g = 0; g < 15; g++) {
  const J = M.novoJogo({ modo, jogadores: gente(n) })
  let passos = 0
  while (J.fase !== 'fim' && passos++ < 2000) {
    if (J.fase === 'resultado') { M.seguir(J); continue }
    M.forcar(J)
  }
  assert.strictEqual(J.fase, 'fim', `${n} jogadores: terminou`)
  for (const p of J.js) assert.strictEqual(p.heroi.filter(Boolean).length, 8, 'herói completo')
  assert(J.campeao >= 0 && J.campeao < n)
  assert.strictEqual(J.historia.length, n - 1, 'mata-mata tem n-1 duelos')
  const perderam = J.historia.map((d) => (d.ganhou === d.a ? d.b : d.a))
  assert.strictEqual(new Set(perderam).size, n - 1, 'ninguém perde duas vezes')
  assert(!perderam.includes(J.campeao), 'o campeão não perdeu')
  empates += J.historia.filter((d) => d.desempate).length
  partidas += 1
}
console.log(`ok · ${partidas} partidas · ${empates} desempates do Vigia`)
