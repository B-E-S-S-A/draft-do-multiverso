// Identidade Secreta: o jogo em si, sem tela. Testável no node (tests/identidade.test.mjs).
// Os dois olham o mesmo tabuleiro e cada um tem um personagem secreto. Na sua vez, você faz uma pergunta de sim ou não,
// tira do tabuleiro quem não bate e pode chutar quem é. Acertou, ganhou. Errou, perdeu na hora.
// Dois jeitos de perguntar: 'falando' (o clássico: pergunta em voz alta ou escrevendo e a outra pessoa responde)
// e 'lista' (toca numa pergunta pronta e o site responde e já vira quem não bate).
(function (raiz) {
  const G = () => raiz.GradeDados
  const QTDS = [12, 16, 24, 32, 40]
  const CLASSICO = 24
  const TAM_MAO = 8           // quantas perguntas prontas aparecem em cada vez
  const POR_GRUPO = 2         // no máximo tantas perguntas do mesmo assunto na mesma vez
  const FORA = new Set(['nome']) // tema que não vira uma pergunta boa
  const RESPOSTAS = ['sim', 'nao', 'naosei']

  const embaralha = (a, rnd) => { const v = [...a]; for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [v[i], v[j]] = [v[j], v[i]] } return v }
  const qtdValida = (n) => (QTDS.includes(Number(n)) ? Number(n) : CLASSICO)
  const modoValido = (m) => (m === 'lista' ? 'lista' : 'falando')

  // o tabuleiro: dois terços de personagens bem conhecidos e o resto de qualquer um
  function montarTabuleiro(versao, qtd, rnd = Math.random) {
    const pool = G().poolDa(versao)
    const A = raiz.ArquivoMotor
    const famosos = versao !== 'tela' && A ? embaralha(pool.filter((k) => A.conhecido(k)), rnd).slice(0, Math.round((qtd * 2) / 3)) : []
    const resto = embaralha(pool.filter((k) => !famosos.includes(k)), rnd).slice(0, qtd - famosos.length)
    return embaralha([...famosos, ...resto], rnd)
  }

  const outro = (j) => (j === 0 ? 1 : 0)
  const vale = (J, id, key) => G().membros(G().porId[id], J.versao).has(key)
  const candidatos = (J, j) => J.tabuleiro.filter((k) => !J.js[j].caidos.has(k))

  // as perguntas da vez: só as que ainda separam quem está em pé, variando de assunto
  function montarMao(J, j) {
    const quem = candidatos(J, j)
    if (quem.length < 2) return []
    const usadas = J.js[j].usadas
    const boas = G().categoriasDa(J.versao).filter((c) => {
      if (FORA.has(c.id) || usadas.includes(c.id)) return false
      const sim = quem.filter((k) => vale(J, c.id, k)).length
      return sim > 0 && sim < quem.length
    })
    const mao = []
    const conta = {}
    for (const c of embaralha(boas, J.rnd)) {
      if (mao.length >= TAM_MAO) break
      if ((conta[c.grupo] || 0) >= POR_GRUPO) continue
      conta[c.grupo] = (conta[c.grupo] || 0) + 1
      mao.push(c.id)
    }
    return mao
  }

  function comecaVez(J) {
    J.etapa = 'perguntar'
    J.pergunta = ''
    J.mao = J.modo === 'lista' ? montarMao(J, J.vez) : []
  }

  // jogadores: dois { nome, bot }. comeca: quem joga primeiro (0 ou 1; sem isso, sorteia).
  function novoJogo({ versao = 'ambos', qtd = CLASSICO, modo = 'falando', jogadores, comeca, rnd = Math.random }) {
    const v = G().versao(versao)
    const q = qtdValida(qtd)
    const tabuleiro = montarTabuleiro(v, q, rnd)
    const segredos = embaralha(tabuleiro, rnd).slice(0, 2)
    const J = {
      versao: v, qtd: tabuleiro.length, modo: modoValido(modo), tabuleiro, rnd, fase: 'jogo', etapa: 'perguntar', pergunta: '', mao: [], log: [], seq: 0, res: null,
      vez: comeca === 0 || comeca === 1 ? comeca : Math.floor(rnd() * 2),
      js: jogadores.slice(0, 2).map((p, i) => ({ nome: p.nome, bot: !!p.bot, secreto: segredos[i], caidos: new Set(), usadas: [] })),
    }
    comecaVez(J)
    return J
  }

  // ---------- as jogadas: cada uma devolve null se não pode ----------
  const naVez = (J, j) => J.fase === 'jogo' && j === J.vez

  // lista pronta: o site responde e já tira do tabuleiro quem não bate
  function perguntar(J, j, id) {
    if (!naVez(J, j) || J.modo !== 'lista' || J.etapa !== 'perguntar' || !J.mao.includes(id)) return null
    const sim = vale(J, id, J.js[outro(j)].secreto)
    const eu = J.js[j]
    let caiu = 0
    for (const k of J.tabuleiro) if (vale(J, id, k) !== sim && !eu.caidos.has(k)) { eu.caidos.add(k); caiu += 1 }
    eu.usadas.push(id)
    J.log.push({ j, id, r: sim ? 'sim' : 'nao', caiu })
    J.etapa = 'virar'
    J.seq += 1
    return { sim, caiu }
  }

  // falando: quem pergunta pode escrever, e quem responde aperta sim, não ou não sei
  function escrever(J, j, txt) {
    if (!naVez(J, j) || J.modo !== 'falando' || J.etapa !== 'perguntar') return null
    J.pergunta = String(txt || '').trim().slice(0, 120)
    J.seq += 1
    return true
  }
  function responder(J, j, r) {
    if (J.fase !== 'jogo' || J.modo !== 'falando' || J.etapa !== 'perguntar' || j !== outro(J.vez) || !RESPOSTAS.includes(r)) return null
    J.log.push({ j: J.vez, txt: J.pergunta, r })
    J.etapa = 'virar'
    J.seq += 1
    return true
  }

  // vira ou desvira uma carta do próprio tabuleiro, a qualquer momento
  function virar(J, j, key) {
    if (J.fase !== 'jogo' || !J.js[j] || !J.tabuleiro.includes(key)) return null
    const c = J.js[j].caidos
    if (c.has(key)) c.delete(key); else c.add(key)
    J.seq += 1
    return true
  }

  // sem nenhuma pergunta que separe quem sobrou, dá pra passar sem perguntar
  const podePassar = (J, j) => naVez(J, j) && (J.etapa === 'virar' || (J.modo === 'lista' && !J.mao.length))
  function passar(J, j) {
    if (!podePassar(J, j)) return null
    J.vez = outro(j)
    comecaVez(J)
    J.seq += 1
    return true
  }

  function chutar(J, j, key) {
    if (!naVez(J, j) || !J.tabuleiro.includes(key)) return null
    const certo = key === J.js[outro(j)].secreto
    J.fase = 'fim'
    J.res = { quem: j, key, certo, vencedor: certo ? j : outro(j), segredos: J.js.map((p) => p.secreto) }
    J.seq += 1
    return { certo }
  }

  // ---------- o computador (só joga com a lista pronta) ----------
  function botAcao(J, j) {
    const quem = candidatos(J, j)
    if (quem.length === 1) return { tipo: 'chute', key: quem[0] }
    if (J.etapa === 'virar') return { tipo: 'passa' }
    if (quem.length === 2 && J.rnd() < 0.35) return { tipo: 'chute', key: quem[Math.floor(J.rnd() * 2)] }
    if (!J.mao.length) return J.rnd() < 0.5 ? { tipo: 'passa' } : { tipo: 'chute', key: quem[Math.floor(J.rnd() * quem.length)] }
    // pega uma das três perguntas que mais dividem quem sobrou
    const nota = (id) => Math.abs(quem.filter((k) => vale(J, id, k)).length * 2 - quem.length)
    const melhores = [...J.mao].sort((a, b) => nota(a) - nota(b)).slice(0, 3)
    return { tipo: 'pergunta', id: melhores[Math.floor(J.rnd() * melhores.length)] }
  }

  // ---------- o que cada um pode ver: o segredo do outro só aparece no fim ----------
  function visaoDe(J, j) {
    return {
      fase: J.fase, modo: J.modo, versao: J.versao, qtd: J.qtd, tabuleiro: J.tabuleiro, eu: j, vez: J.vez, etapa: J.etapa, seq: J.seq,
      js: J.js.map((p) => ({ nome: p.nome, bot: p.bot, restam: J.qtd - p.caidos.size })),
      meu: { secreto: J.js[j].secreto, caidos: [...J.js[j].caidos] },
      mao: j === J.vez && J.etapa === 'perguntar' ? [...J.mao] : [],
      pergunta: J.pergunta, podePassar: podePassar(J, j), log: J.log.slice(-40), res: J.res,
    }
  }

  raiz.IdentidadeMotor = { QTDS, CLASSICO, TAM_MAO, qtdValida, modoValido, montarTabuleiro, novoJogo, candidatos, perguntar, escrever, responder, virar, podePassar, passar, chutar, botAcao, visaoDe }
})(typeof window !== 'undefined' ? window : globalThis)
