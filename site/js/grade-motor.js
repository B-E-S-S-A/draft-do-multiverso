// Grade do Multiverso: o jogo em si, sem tela. Testável no node (tests/grade.test.mjs).
// Um grid de L linhas x C colunas: cada linha e cada coluna tem uma categoria. Na sua vez você escolhe uma casa e diz
// um personagem que vale nas duas. Acertou, a casa é sua (com a capa do personagem). Errou, passa a vez.
// Cada personagem só vale uma vez. Ganha quem fechar K casas seguidas (de lado, de cima pra baixo ou na diagonal).
// Se ninguém conseguir, ganha quem tiver mais casas. Com "pode roubar", dá pra tomar a casa do outro dizendo outro
// personagem que também vale ali.
(function (raiz) {
  const G = () => raiz.GradeDados
  const MIN_RESPOSTAS = 3   // toda casa sorteada tem pelo menos isso de respostas certas (grid pequeno: 4)
  const SEM_JOGAR = 6       // tantas vezes seguidas sem ninguém pegar casa: acaba e conta as casas
  const TAM = { min: 2, max: 6, casas: 30 }

  const cat = (id) => G().porId[id]
  const vale = (id, key) => cat(id).m.has(key)
  const respostas = (lin, col) => G().chaves.filter((k) => vale(lin, k) && vale(col, k))

  function embaralha(a, rnd) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
  }

  // tamanho e "em linha" sempre dentro do que dá pra jogar
  function medidas({ L = 3, C = 3, K } = {}) {
    L = Math.min(TAM.max, Math.max(TAM.min, Math.round(L) || 3))
    C = Math.min(TAM.max, Math.max(TAM.min, Math.round(C) || 3))
    while (L * C > TAM.casas) { if (L >= C) L--; else C-- }
    K = Math.min(Math.max(L, C), Math.max(2, Math.round(K) || Math.min(L, C)))
    return { L, C, K }
  }

  // sorteia as categorias: um terço simples, o resto mais esperto, nenhum par do mesmo grupo se cruzando,
  // toda casa com resposta suficiente. Tenta várias vezes e fica com a melhor.
  function sortearGrade(L, C, rnd = Math.random) {
    if (C === undefined || typeof C === 'function') { rnd = C || rnd; C = L } // sortearGrade(N) = N x N
    const todas = G().categorias
    const simples = todas.filter((c) => c.nivel === 1)
    const espertas = todas.filter((c) => c.nivel === 2)
    const total = L + C
    const quer = MIN_RESPOSTAS + (L * C <= 20 ? 1 : 0)
    let melhor = null
    const tentativas = L * C > 24 ? 12000 : 4000 // grid grande é mais difícil de fechar: tenta mais vezes
    for (let t = 0; t < tentativas; t++) {
      const nS = Math.max(1, Math.round(total / 3) - Math.floor(rnd() * 2))
      const escolha = [...embaralha([...simples], rnd).slice(0, nS), ...embaralha([...espertas], rnd).slice(0, total - nS)]
      embaralha(escolha, rnd)
      // grupos repetidos no mesmo lado tudo bem; o que não pode é linha x coluna do mesmo grupo
      const linhas = escolha.slice(0, L)
      const colunas = escolha.slice(L)
      if (linhas.some((l) => colunas.some((c) => l.grupo === c.grupo))) continue
      let pior = Infinity
      for (const l of linhas) for (const c of colunas) pior = Math.min(pior, respostas(l.id, c.id).length)
      if (pior >= quer) return { linhas: linhas.map((c) => c.id), colunas: colunas.map((c) => c.id) }
      if (!melhor || pior > melhor.pior) melhor = { pior, linhas: linhas.map((c) => c.id), colunas: colunas.map((c) => c.id) }
    }
    return { linhas: melhor.linhas, colunas: melhor.colunas }
  }

  // todas as sequências que ganham: K casas seguidas de lado, de cima pra baixo e nas duas diagonais
  function retas(L, C, K) {
    if (C === undefined) { C = L; K = L } // retas(N) = N x N, N em linha
    const r = []
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
    for (let y = 0; y < L; y++) for (let x = 0; x < C; x++) for (const [dy, dx] of dirs) {
      const fimY = y + dy * (K - 1)
      const fimX = x + dx * (K - 1)
      if (fimY < 0 || fimY >= L || fimX < 0 || fimX >= C) continue
      r.push(Array.from({ length: K }, (_, k) => (y + dy * k) * C + (x + dx * k)))
    }
    return r
  }

  function novoJogo({ L, C, K, N, roubar = false, jogadores, comeca = 0, grade, aleatorio }) {
    const rnd = aleatorio || Math.random
    const m = medidas(N ? { L: N, C: N, K: K || N } : { L, C, K })
    const g = grade || sortearGrade(m.L, m.C, rnd)
    return {
      L: m.L, C: m.C, K: m.K, roubar: !!roubar, linhas: g.linhas, colunas: g.colunas, casas: Array(m.L * m.C).fill(null), usados: [],
      js: jogadores.map((p) => ({ nome: p.nome, bot: !!p.bot, nivel: p.nivel || 0.75 })),
      vez: comeca, fase: 'jogo', ultimo: null, seq: 0, semJogar: 0, fim: null,
    }
  }

  const linCol = (J, casa) => [J.linhas[Math.floor(casa / J.C)], J.colunas[casa % J.C]]
  const contaCasas = (J, j) => J.casas.filter((c) => c && c.dono === j).length
  // a casa está aberta pra j? (vazia, ou do outro se pode roubar)
  const aberta = (J, j, casa) => !J.casas[casa] || (J.roubar && J.casas[casa].dono !== j)
  // ainda tem resposta que ninguém usou pra essa casa?
  const sobra = (J, casa) => { const [l, c] = linCol(J, casa); return respostas(l, c).filter((k) => !J.usados.includes(k)) }
  const podeJogar = (J, j) => J.casas.some((_, i) => aberta(J, j, i) && sobra(J, i).length > 0)
  const retaDe = (J, j) => retas(J.L, J.C, J.K).find((r) => r.every((i) => J.casas[i] && J.casas[i].dono === j))

  function proximaVez(J) {
    if (J.fase !== 'jogo') return
    J.vez = 1 - J.vez
    if (J.semJogar >= SEM_JOGAR || (!podeJogar(J, 0) && !podeJogar(J, 1))) terminarPorCasas(J)
  }

  function terminarPorCasas(J) {
    const a = contaCasas(J, 0)
    const b = contaCasas(J, 1)
    J.fase = 'fim'
    J.fim = { motivo: 'casas', ganhou: a === b ? -1 : a > b ? 0 : 1, casas: [a, b] }
  }

  // depois de pegar uma casa: fechou a linha? acabou o grid? senão, próxima vez
  function depoisDePegar(J, j) {
    const reta = retaDe(J, j)
    if (reta) { J.fase = 'fim'; J.fim = { motivo: 'linha', ganhou: j, reta, casas: [contaCasas(J, 0), contaCasas(J, 1)] }; return }
    if (!J.roubar && J.casas.every(Boolean)) { terminarPorCasas(J); return }
    proximaVez(J)
  }

  // a jogada: j escolheu a casa e disse o personagem key
  function jogar(J, j, casa, key) {
    if (J.fase !== 'jogo' || j !== J.vez || !(casa >= 0 && casa < J.casas.length) || !aberta(J, j, casa)) return null
    if (!G().chaves.includes(key)) return null
    if (J.usados.includes(key)) return { ok: false, usado: true } // já foi usado: não perde a vez, escolhe outro
    const [l, c] = linCol(J, casa)
    const falhou = [l, c].filter((id) => !vale(id, key))
    J.seq += 1
    if (falhou.length) {
      J.ultimo = { j, casa, key, ok: false, falhou, seq: J.seq }
      J.semJogar += 1
      proximaVez(J)
      return J.ultimo
    }
    const antes = J.casas[casa]
    J.casas[casa] = { dono: j, key }
    J.usados.push(key)
    J.semJogar = 0
    J.ultimo = { j, casa, key, ok: true, roubou: antes ? antes.dono : -1, seq: J.seq }
    depoisDePegar(J, j)
    return J.ultimo
  }

  function passar(J, j, tempo) {
    if (J.fase !== 'jogo' || j !== J.vez) return null
    J.seq += 1
    J.ultimo = { j, passou: true, tempo: !!tempo, seq: J.seq }
    J.semJogar += 1
    proximaVez(J)
    return J.ultimo
  }

  // ---------- bot (pra testar sozinho) ----------
  // nota de uma casa pra j: fecha a linha, bloqueia o outro, ajuda a montar uma linha
  function notaCasa(J, j, i, rnd) {
    const outro = 1 - j
    let n = rnd()
    for (const r of retas(J.L, J.C, J.K)) {
      if (!r.includes(i)) continue
      const meus = r.filter((k) => J.casas[k] && J.casas[k].dono === j).length
      const dele = r.filter((k) => J.casas[k] && J.casas[k].dono === outro).length
      const minha = J.casas[i] && J.casas[i].dono === outro ? 1 : 0
      if (meus === J.K - 1) n += 100
      if (dele - minha === J.K - 1) n += 50
      if (!dele || minha) n += 1 + meus
    }
    return n
  }
  function botJogada(J, j, rnd = Math.random) {
    const abertas = J.casas.map((_, i) => i).filter((i) => aberta(J, j, i) && sobra(J, i).length)
    if (!abertas.length) return { passar: true }
    const casa = abertas.sort((a, b) => notaCasa(J, j, b, rnd) - notaCasa(J, j, a, rnd))[0]
    if (rnd() < J.js[j].nivel) {
      const certas = sobra(J, casa)
      return { casa, key: certas[Math.floor(rnd() * certas.length)] }
    }
    // errou: chuta alguém que não vale (e que ninguém usou)
    const [l, c] = linCol(J, casa)
    const erradas = G().chaves.filter((k) => !J.usados.includes(k) && !(vale(l, k) && vale(c, k)))
    return { casa, key: erradas[Math.floor(rnd() * erradas.length)] }
  }

  raiz.GradeMotor = { medidas, sortearGrade, respostas, retas, novoJogo, jogar, passar, botJogada, linCol, aberta, sobra, podeJogar, contaCasas, vale, MIN_RESPOSTAS, TAM }
})(typeof window !== 'undefined' ? window : globalThis)
