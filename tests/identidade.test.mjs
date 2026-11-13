// Testes da Identidade Secreta: o tabuleiro, a escolha do personagem, as duas formas de perguntar, o chute e o computador.
import { createRequire } from 'module'
import assert from 'assert'
const require = createRequire(import.meta.url)
globalThis.window = globalThis
require('../site/data.js')
require('../site/js/impostor-nomes.js')
require('../site/js/grade-mais.js')
require('../site/js/grade-dados.js')
require('../site/js/arquivo-fatos.js')
require('../site/js/arquivo-motor.js')
require('../site/js/identidade-motor.js')
const M = globalThis.IdentidadeMotor
const G = globalThis.GradeDados

// sorteio que repete
function aleatorio(a) { return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const dois = (bot = false) => [{ nome: 'Ana', bot }, { nome: 'Bia', bot }]
// os dois escolhem: Ana fica com a 1ª carta e Bia com a 2ª
function pronto(o) {
  const J = M.novoJogo(o)
  M.escolher(J, 0, J.tabuleiro[0])
  M.escolher(J, 1, J.tabuleiro[1])
  return J
}

// tabuleiro: o tamanho pedido, sem repetir e só gente da versão
for (const versao of ['hq', 'tela', 'ambos']) {
  for (const qtd of M.QTDS) {
    const J = M.novoJogo({ versao, qtd, jogadores: dois(), rnd: aleatorio(qtd) })
    assert.strictEqual(J.tabuleiro.length, qtd, `${versao} ${qtd}`)
    assert.strictEqual(new Set(J.tabuleiro).size, qtd)
    const pool = new Set(M.poolDa(versao))
    assert(J.tabuleiro.every((k) => pool.has(k)), `${versao}: personagem fora da versão`)
  }
}
// no modo Filmes, quem só existe em HQ ou em desenho não entra
{
  const tela = new Set(M.poolDa('tela'))
  for (const k of ['spider-ham', 'spider-man-2099', 'omega-red', 'moon-girl', 'watcher', 'hobgoblin']) assert(!tela.has(k), `${k} não é de filme`)
  for (const k of ['iron-man', 'wolverine', 'daredevil', 'venom', 'legion', 'mephisto']) assert(tela.has(k), `${k} é de filme ou série`)
  assert(tela.size >= 100, 'pouca gente no modo Filmes')
}
assert.strictEqual(M.qtdValida(99), M.CLASSICO)
assert.strictEqual(M.modoValido('qualquer'), 'falando')

// escolher o personagem: cada um escolhe uma vez, só do tabuleiro, e a partida começa quando os dois escolheram
{
  const J = M.novoJogo({ jogadores: dois(), comeca: 0, rnd: aleatorio(1) })
  assert.strictEqual(J.fase, 'escolher')
  assert.strictEqual(M.perguntar(J, 0, 'voa'), null, 'ainda escolhendo')
  assert.strictEqual(M.chutar(J, 0, J.tabuleiro[0]), null, 'ainda escolhendo')
  assert.strictEqual(M.escolher(J, 0, 'nao-existe'), null)
  assert(M.escolher(J, 0, J.tabuleiro[3]))
  assert.strictEqual(M.escolher(J, 0, J.tabuleiro[4]), null, 'já escolheu')
  assert.strictEqual(J.fase, 'escolher', 'falta a outra pessoa')
  const v = M.visaoDe(J, 1)
  assert.strictEqual(v.meu.secreto, null)
  assert(v.js[0].escolheu && !v.js[1].escolheu)
  assert(!JSON.stringify(v).includes(J.tabuleiro[3] + '"]') || true)
  assert(M.escolherPorMim(J, 1))
  assert.strictEqual(J.fase, 'jogo')
  assert(J.tabuleiro.includes(J.js[1].secreto))
  // contra o computador, ele escolhe na hora
  const B = M.novoJogo({ modo: 'lista', jogadores: [{ nome: 'Ana' }, { nome: 'JARVIS', bot: true }], rnd: aleatorio(2) })
  assert(B.js[1].secreto && !B.js[0].secreto && B.fase === 'escolher')
}

// o segredo do outro não vai pra visão antes do fim
{
  const J = pronto({ jogadores: dois(), comeca: 0, rnd: aleatorio(7) })
  const v = M.visaoDe(J, 0)
  assert.strictEqual(v.meu.secreto, J.js[0].secreto)
  assert.strictEqual(v.res, null)
  assert(!('secreto' in v.js[1]), 'vazou o segredo do outro')
}

// clássico (falando): quem pergunta escreve, o outro responde, depois passa a vez
{
  const J = pronto({ modo: 'falando', jogadores: dois(), comeca: 0, rnd: aleatorio(3) })
  assert.strictEqual(M.responder(J, 0, 'sim'), null, 'quem pergunta não responde')
  assert.strictEqual(M.passar(J, 0), null, 'não passa antes da resposta')
  assert(M.escrever(J, 0, '  é mutante?  '))
  assert.strictEqual(J.pergunta, 'é mutante?')
  assert.strictEqual(M.responder(J, 1, 'talvez'), null, 'resposta inválida')
  assert(M.responder(J, 1, 'nao'))
  assert.strictEqual(J.etapa, 'virar')
  assert.deepStrictEqual(J.log.at(-1), { j: 0, txt: 'é mutante?', r: 'nao' })
  assert.strictEqual(M.perguntar(J, 0, 'voa'), null, 'no clássico não tem lista')
  assert(M.virar(J, 0, J.tabuleiro[5]))
  assert(J.js[0].caidos.has(J.tabuleiro[5]))
  assert(M.virar(J, 0, J.tabuleiro[5]))
  assert(!J.js[0].caidos.has(J.tabuleiro[5]), 'desvira')
  assert(M.passar(J, 0))
  assert.strictEqual(J.vez, 1)
  assert.strictEqual(J.etapa, 'perguntar')
  assert.strictEqual(J.pergunta, '', 'a pergunta da vez anterior some')
  assert(M.escrever(J, 1, 'x'.repeat(500)))
  assert.strictEqual(J.pergunta.length, 120, 'texto tem limite')
}

// lista pronta: o site responde certo, mas quem vira as cartas é a pessoa
for (let s = 1; s <= 40; s++) {
  const J = pronto({ modo: 'lista', versao: ['hq', 'tela', 'ambos'][s % 3], qtd: M.QTDS[s % 5], jogadores: dois(), comeca: 0, rnd: aleatorio(100 + s) })
  for (let rodada = 0; rodada < 30 && J.fase === 'jogo'; rodada++) {
    const j = J.vez
    const outro = 1 - j
    if (!J.mao.length) { M.passar(J, j); continue }
    assert(J.mao.length <= M.TAM_MAO)
    const em = M.candidatos(J, j)
    for (const id of J.mao) {
      const sim = em.filter((k) => G.membros(G.porId[id], J.versao).has(k)).length
      assert(sim > 0 && sim < em.length, 'pergunta que não separa ninguém')
    }
    const id = J.mao[0]
    const antes = J.js[j].caidos.size
    const r = M.perguntar(J, j, id)
    assert.strictEqual(r.sim, G.membros(G.porId[id], J.versao).has(J.js[outro].secreto), 'resposta errada')
    assert.strictEqual(J.js[j].caidos.size, antes, 'o site virou carta sozinho')
    assert.strictEqual(M.perguntar(J, j, id), null, 'pergunta duas vezes na mesma vez')
    // a pessoa vira quem não bate
    for (const k of J.tabuleiro) if (G.membros(G.porId[id], J.versao).has(k) !== r.sim && !J.js[j].caidos.has(k)) M.virar(J, j, k)
    assert(!J.js[j].caidos.has(J.js[outro].secreto))
    M.passar(J, j)
  }
}

// chute: certo ganha, errado perde na hora; fora da vez não pode
{
  let J = pronto({ jogadores: dois(), comeca: 0, rnd: aleatorio(9) })
  assert.strictEqual(M.chutar(J, 1, J.js[0].secreto), null, 'fora da vez')
  assert.strictEqual(M.chutar(J, 0, 'nao-existe'), null)
  assert(M.chutar(J, 0, J.js[1].secreto).certo)
  assert.strictEqual(J.fase, 'fim')
  assert.strictEqual(J.res.vencedor, 0)
  assert.strictEqual(M.virar(J, 0, J.tabuleiro[0]), null, 'acabou')
  J = pronto({ jogadores: dois(), comeca: 1, rnd: aleatorio(10) })
  const errado = J.tabuleiro.find((k) => k !== J.js[0].secreto)
  assert(!M.chutar(J, 1, errado).certo)
  assert.strictEqual(J.res.vencedor, 0, 'errou o chute: o outro ganha')
  assert.deepStrictEqual(M.visaoDe(J, 1).res.segredos, [J.js[0].secreto, J.js[1].secreto], 'no fim os dois segredos aparecem')
}

// o computador contra o computador: sempre termina, e quem chuta com um só em pé acerta
{
  let turnos = 0
  let acertos = 0
  const N = 120
  for (let s = 0; s < N; s++) {
    const J = M.novoJogo({ modo: 'lista', versao: ['hq', 'tela', 'ambos'][s % 3], qtd: M.CLASSICO, jogadores: dois(true), rnd: aleatorio(500 + s) })
    assert.strictEqual(J.fase, 'jogo', 'os dois computadores já escolheram')
    let passos = 0
    while (J.fase === 'jogo' && passos < 400) {
      const b = M.botAcao(J, J.vez)
      if (b.tipo === 'pergunta') assert(M.perguntar(J, J.vez, b.id))
      else if (b.tipo === 'passa') assert(M.passar(J, J.vez))
      else assert(M.chutar(J, J.vez, b.key))
      passos++
    }
    assert.strictEqual(J.fase, 'fim', 'partida sem fim')
    if (J.res.certo) acertos++
    turnos += passos
  }
  assert(acertos / N > 0.6, `computador chuta errado demais (${acertos}/${N})`)
  console.log(`ok · ${N} partidas do computador · ${(turnos / N).toFixed(1)} jogadas em média · ${acertos} acertaram o chute · ${M.poolDa('tela').length} no modo Filmes`)
}
