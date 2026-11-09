// Motor do Arquivo Secreto: a ficha de um personagem vai sendo revelada, uma pista por vez. Quanto antes acertar, mais pontos.
// Errou: perde 1 ponto e pode tentar de novo na próxima pista. Sem tela nem internet aqui: só as regras (dá pra testar no Node).
// Dois jeitos: 'junto' (cada um no seu celular, todos chutam na mesma pista) e 'turno' (num celular só, cada pista é de um).
(function (raiz) {
  const G = () => raiz.GradeDados
  const D = () => raiz.DRAFT_DATA
  const PONTOS = [6, 5, 4, 3, 2, 1] // quanto vale acertar em cada pista
  const FICHAS = 6                  // quantos personagens por partida
  const PRAZO = 20000               // tempo de cada pista, no jogo em que todos chutam juntos

  const embaralha = (a, rnd) => { const v = [...a]; for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [v[i], v[j]] = [v[j], v[i]] } return v }
  const heroi = (key) => D().hq.find((h) => h.key === key)
  // o nome do personagem nas duas línguas, sem o "The" do começo
  const nomes = (key) => ({ pt: heroi(key).n, en: ((raiz.IMPOSTOR_EN || {})[key] || heroi(key).n).replace(/^The\s+/i, '') })
  const letra = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')[0]
  const tamanho = (s) => s.replace(/[^\p{L}\p{N}]/gu, '').length

  // iniciais do nome verdadeiro ("P. P."), se ele tiver nome e sobrenome. Nesses aqui, nas telas o nome é outro do que está na HQ.
  const SEM_INICIAIS_TELA = new Set(['wasp', 'taskmaster', 'magneto', 'rogue'])
  function iniciais(key, versao) {
    if (versao === 'tela' && SEM_INICIAIS_TELA.has(key)) return ''
    const partes = String(heroi(key).id || '').split(/\s+/)
    if (!/^[A-ZÀ-Ý]/.test(partes[0] || '')) return ''
    const grandes = partes.filter((p) => /^[A-ZÀ-Ý]/.test(p))
    return grandes.length >= 2 ? grandes.map((p) => p[0] + '.').join(' ') : ''
  }

  const temasDe = (key, versao) => G().categoriasDa(versao).filter((c) => G().membros(c, versao).has(key))
  const gruposDe = (key, versao) => new Set(temasDe(key, versao).map((c) => c.grupo)).size
  // as pistas de fã que valem nessa versão (só entra no jogo quem tem pelo menos uma)
  const REFS = { hq: ['hq', 'ambos'], tela: ['tela', 'ambos'], ambos: ['hq', 'tela', 'ambos'] }
  const fatosDe = (key, versao) => ((raiz.ArquivoFatos || {})[key] || []).filter((f) => REFS[versao].includes(f[0]))
  // o desafio do dia só usa quem tem bastante pista
  const conhecido = (key) => fatosDe(key, 'ambos').length >= 2
  const candidatos = (versao) => G().poolDa(versao).filter((k) => gruposDe(k, versao) >= 3 && fatosDe(k, versao).length >= 1)

  // as pistas de um personagem, sempre 6: dois temas amplos, um detalhe de fã, um tema mais fechado, outro detalhe de fã e a
  // primeira letra do nome. Os temas sozinhos não bastam, e os detalhes dão por onde pensar sem entregar de cara.
  function montarPistas(key, versao, rnd = Math.random) {
    const pool = G().poolDa(versao)
    const tam = (c) => pool.filter((k) => G().membros(c, versao).has(k)).length
    const temas = temasDe(key, versao)
    const ini = iniciais(key, versao)
    const qtd = 3
    let melhor = null
    for (let t = 0; t < 120; t++) {
      const grupos = new Set()
      const escolha = []
      for (const c of embaralha(temas, rnd)) {
        if (grupos.has(c.grupo)) continue
        grupos.add(c.grupo)
        escolha.push(c)
        if (escolha.length === qtd) break
      }
      if (escolha.length < qtd) continue
      escolha.sort((a, b) => tam(b) - tam(a))
      let resta = pool
      const sobra = escolha.map((c) => (resta = resta.filter((k) => G().membros(c, versao).has(k))).length)
      // a 1ª pista não pode entregar o jogo, e no fim tem que sobrar pouca gente
      const nota = sobra[sobra.length - 1] + (sobra[0] < 12 ? 20 : 0) + (sobra[1] < 5 ? 10 : 0) + rnd()
      if (!melhor || nota < melhor.nota) melhor = { nota, escolha }
    }
    const [t1, t2, t3] = melhor.escolha.map((c) => ({ t: 'tema', id: c.id }))
    const n = nomes(key)
    const fatos = embaralha(fatosDe(key, versao), rnd).map((f) => ({ t: 'fato', pt: f[1], en: f[2] }))
    // só tem um detalhe de fã nessa versão: no lugar do segundo entram as iniciais ou o tamanho do nome
    const extra = fatos[1] || (ini ? { t: 'iniciais', v: ini } : { t: 'tamanho', pt: tamanho(n.pt), en: tamanho(n.en) })
    return [t1, t2, fatos[0], t3, extra, { t: 'letra', pt: letra(n.pt), en: letra(n.en) }]
  }

  // sorteia os personagens da partida, com mais chance pra quem é mais conhecido (tem mais temas)
  function sortearFichas(versao, total, rnd) {
    const sobra = candidatos(versao).map((k) => ({ k, p: gruposDe(k, versao) ** 2 }))
    const fichas = []
    while (fichas.length < total && sobra.length) {
      let r = rnd() * sobra.reduce((a, x) => a + x.p, 0)
      let i = 0
      while (i < sobra.length - 1 && (r -= sobra[i].p) > 0) i++
      const key = sobra.splice(i, 1)[0].k
      fichas.push({ key, pistas: montarPistas(key, versao, rnd) })
    }
    return fichas
  }

  const limpaFicha = (J) => { J.por = J.js.map(() => ({ acertou: -1, ganho: 0, tentou: false, errados: [], primeiro: false })); J.temPrimeiro = false }

  function novoJogo({ versao, modo = 'junto', jogadores, total = FICHAS, rnd = Math.random }) {
    versao = G().versao(versao)
    const J = { versao, modo, total, js: jogadores.map((p) => ({ nome: p.nome, bot: !!p.bot, pts: 0, certos: 0 })), fichas: sortearFichas(versao, total, rnd),
      n: 0, pista: 0, fase: 'pista', comeca: 0, vez: 0, seq: 0, ultimo: null, por: [], temPrimeiro: false }
    limpaFicha(J)
    return J
  }

  const ficha = (J) => J.fichas[J.n]
  const ativo = (J, j) => J.por[j].acertou < 0
  // j pode chutar nesta pista?
  const podeChutar = (J, j) => J.fase === 'pista' && ativo(J, j) && !J.por[j].tentou && (J.modo === 'junto' || j === J.vez)

  function encerraFicha(J) { J.fase = 'revela' }
  function proximaPista(J) {
    if (J.pista >= PONTOS.length - 1) return encerraFicha(J)
    J.pista += 1
    J.por.forEach((p) => { p.tentou = false })
    J.vez = (J.comeca + J.pista) % J.js.length
  }
  // depois de cada ação: acabou a ficha? todo mundo já decidiu nesta pista?
  function confere(J) {
    if (J.fase !== 'pista') return
    if (J.modo === 'turno') { if (J.por.some((p) => p.acertou >= 0)) encerraFicha(J); else proximaPista(J); return }
    if (J.js.every((_, j) => !ativo(J, j))) return encerraFicha(J)
    if (J.js.every((_, j) => !ativo(J, j) || J.por[j].tentou)) proximaPista(J)
  }

  // j chutou o personagem key
  function chutar(J, j, key) {
    if (!podeChutar(J, j) || !G().chaves.includes(key)) return null
    const eu = J.por[j]
    if (eu.errados.includes(key)) return { repetido: true } // já tinha errado com esse: não perde nada, escolhe outro
    J.seq += 1
    if (key === ficha(J).key) {
      eu.primeiro = J.modo === 'junto' && !J.temPrimeiro
      if (eu.primeiro) J.temPrimeiro = true
      const ganho = PONTOS[J.pista] + (eu.primeiro ? 1 : 0)
      eu.acertou = J.pista
      eu.ganho += ganho
      J.js[j].pts += ganho
      J.js[j].certos += 1
      J.ultimo = { j, ok: true, pista: J.pista, ganho, seq: J.seq }
    } else {
      eu.errados.push(key)
      eu.tentou = true
      eu.ganho -= 1
      J.js[j].pts -= 1
      J.ultimo = { j, ok: false, pista: J.pista, seq: J.seq }
    }
    confere(J)
    return J.ultimo
  }
  function passar(J, j) {
    if (!podeChutar(J, j)) return null
    J.seq += 1
    J.por[j].tentou = true
    J.ultimo = { j, passou: true, seq: J.seq }
    confere(J)
    return J.ultimo
  }
  // acabou o tempo da pista (só no jogo em que todos chutam juntos)
  function tempo(J) { if (J.fase === 'pista') { J.seq += 1; proximaPista(J) } }

  // depois de ver o resultado: próxima ficha ou fim
  function seguir(J) {
    if (J.fase !== 'revela') return
    J.n += 1
    if (J.n >= J.total) { J.fase = 'fim'; return }
    J.fase = 'pista'
    J.pista = 0
    J.comeca = (J.comeca + 1) % J.js.length
    J.vez = J.comeca
    limpaFicha(J)
  }

  // bot: quanto mais pista, mais fácil de acertar; às vezes chuta errado
  function botAcao(J, j, rnd = Math.random) {
    const certo = 0.08 + 0.17 * J.pista
    const r = rnd()
    if (r < certo) return { key: ficha(J).key }
    if (r < certo + 0.1) {
      const lista = G().poolDa(J.versao).filter((k) => k !== ficha(J).key && !J.por[j].errados.includes(k))
      return { key: lista[Math.floor(rnd() * lista.length)] }
    }
    return { passar: true }
  }

  const ranking = (J) => J.js.map((p, j) => ({ j, nome: p.nome, pts: p.pts, certos: p.certos })).sort((a, b) => b.pts - a.pts || b.certos - a.certos)

  raiz.ArquivoMotor = { PONTOS, FICHAS, PRAZO, nomes, iniciais, candidatos, conhecido, montarPistas, novoJogo, ficha, podeChutar, chutar, passar, tempo, seguir, botAcao, ranking }
})(typeof window !== 'undefined' ? window : globalThis)
