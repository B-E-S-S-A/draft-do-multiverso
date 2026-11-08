// Testes do Arquivo Secreto: as pistas são verdadeiras e vão fechando o cerco, os pontos batem e as partidas terminam.
import { createRequire } from 'module'
import assert from 'assert'
const require = createRequire(import.meta.url)
globalThis.window = globalThis
require('../site/data.js')
require('../site/js/impostor-nomes.js')
require('../site/js/grade-dados.js')
require('../site/js/arquivo-motor.js')
const G = globalThis.GradeDados
const M = globalThis.ArquivoMotor

let somaResta = 0, conta = 0, unicos = 0
for (const versao of ['hq', 'ambos', 'tela']) {
  const lista = M.candidatos(versao)
  assert(lista.length >= 60, `${versao}: poucos personagens (${lista.length})`)
  const pool = G.poolDa(versao)
  for (const key of lista) {
    const p = M.montarPistas(key, versao)
    assert.strictEqual(p.length, 6, `${key}: ${p.length} pistas`)
    assert.strictEqual(p[5].t, 'letra', `${key}: a última é a letra`)
    assert(/^[A-Z0-9]$/.test(p[5].pt) && /^[A-Z0-9]$/.test(p[5].en), `${key}: letra ruim ${p[5].pt}/${p[5].en}`)
    let resta = pool
    const grupos = new Set()
    for (const x of p.filter((y) => y.t === 'tema')) {
      const c = G.porId[x.id]
      assert(G.categoriasDa(versao).includes(c), `${versao}: tema de fora da versão (${x.id})`)
      assert(G.membros(c, versao).has(key), `${key}: pista falsa (${x.id})`)
      assert(!grupos.has(c.grupo), `${key}: dois temas do mesmo grupo`)
      grupos.add(c.grupo)
      resta = resta.filter((k) => G.membros(c, versao).has(k))
    }
    assert(resta.includes(key))
    somaResta += resta.length; conta += 1; if (resta.length === 1) unicos += 1
  }
}

// a ficha não entrega o nome em nenhum lugar antes da hora: pistas só têm id de tema, iniciais e letras
{
  const J = M.novoJogo({ versao: 'ambos', jogadores: [{ nome: 'a' }, { nome: 'b' }] })
  assert.strictEqual(new Set(J.fichas.map((f) => f.key)).size, M.FICHAS, 'personagem repetido na partida')
  for (const f of J.fichas) assert(!JSON.stringify(f.pistas).includes('"' + f.key + '"'), 'a pista entrega a chave')
}

// junto: acertar cedo vale mais, o primeiro leva +1, errar tira 1 e bloqueia até a próxima pista
{
  const J = M.novoJogo({ versao: 'ambos', modo: 'junto', jogadores: [{ nome: 'a' }, { nome: 'b' }, { nome: 'c' }] })
  const k = M.ficha(J).key
  const outra = G.chaves.find((x) => x !== k)
  assert(!M.chutar(J, 0, outra).ok)
  assert.strictEqual(J.js[0].pts, -1)
  assert.strictEqual(M.chutar(J, 0, k), null, 'já tentou nesta pista')
  assert.strictEqual(J.pista, 0, 'ainda falta gente decidir')
  assert.strictEqual(M.chutar(J, 1, k).ganho, 7, '6 da 1ª pista + 1 do primeiro')
  assert.strictEqual(J.fase, 'pista')
  M.passar(J, 2)
  assert.strictEqual(J.pista, 1, 'todos decidiram: próxima pista')
  assert.strictEqual(M.chutar(J, 0, k).ganho, 5, '2ª pista, sem bônus')
  assert.strictEqual(M.chutar(J, 2, k).ganho, 5)
  assert.strictEqual(J.fase, 'revela', 'todos acertaram')
  assert.strictEqual(J.js[0].pts, 4)
  M.seguir(J)
  assert.strictEqual(J.n, 1)
  assert.strictEqual(J.pista, 0)
  assert.strictEqual(J.js[0].pts, 4, 'pontos continuam')
}

// turno: cada pista é de um; acertou, acaba a ficha; ninguém acertou nas 6, revela sem ponto
{
  const J = M.novoJogo({ versao: 'tela', modo: 'turno', jogadores: [{ nome: 'a' }, { nome: 'b' }] })
  const k = M.ficha(J).key
  assert.strictEqual(M.chutar(J, 1, k), null, 'fora da vez')
  M.passar(J, 0)
  assert.strictEqual(J.vez, 1)
  assert.strictEqual(M.chutar(J, 1, k).ganho, 5, 'sem bônus de primeiro no celular só')
  assert.strictEqual(J.fase, 'revela')
  M.seguir(J)
  assert.strictEqual(J.vez, 1, 'a próxima ficha começa com o outro')
  for (let i = 0; i < 6; i++) M.passar(J, J.vez)
  assert.strictEqual(J.fase, 'revela')
  assert.strictEqual(J.js[0].pts + J.js[1].pts, 5)
}

// já errou com esse nome: não perde de novo
{
  const J = M.novoJogo({ versao: 'hq', modo: 'junto', jogadores: [{ nome: 'a' }, { nome: 'b' }] })
  const k = M.ficha(J).key
  const outra = G.chaves.find((x) => x !== k)
  M.chutar(J, 0, outra); M.passar(J, 1)
  assert.strictEqual(J.pista, 1)
  assert(M.chutar(J, 0, outra).repetido)
  assert.strictEqual(J.js[0].pts, -1)
}

// partidas inteiras de bots
let fim = 0
for (const versao of ['hq', 'ambos', 'tela']) for (let g = 0; g < 20; g++) {
  const J = M.novoJogo({ versao, modo: 'junto', jogadores: [1, 2, 3, 4].map((n) => ({ nome: 'b' + n, bot: true })) })
  let passos = 0
  while (J.fase !== 'fim' && passos++ < 2000) {
    if (J.fase === 'revela') { M.seguir(J); continue }
    let agiu = false
    for (let j = 0; j < 4 && J.fase === 'pista'; j++) {
      if (!M.podeChutar(J, j)) continue
      const b = M.botAcao(J, j)
      const r = b.passar ? M.passar(J, j) : M.chutar(J, j, b.key)
      assert(r, 'jogada do bot recusada')
      agiu = true
    }
    if (!agiu) M.tempo(J)
  }
  assert.strictEqual(J.fase, 'fim')
  assert.strictEqual(M.ranking(J).length, 4)
  fim += 1
}
console.log(`ok · ${conta} fichas conferidas · sobram em média ${(somaResta / conta).toFixed(1)} suspeitos antes das iniciais/letra (${unicos} já únicos) · ${fim} partidas de bots`)
