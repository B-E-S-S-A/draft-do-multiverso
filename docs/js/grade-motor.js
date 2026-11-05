// Grade do Multiverso: o jogo em si, sem tela. Testável no node (tests/grade.test.mjs).
// Um grid N x N: cada linha e cada coluna tem uma categoria. Na sua vez você escolhe uma casa e diz um personagem que
// vale nas duas. Acertou, a casa é sua (com a capa do personagem). Errou, passa a vez. Cada personagem só vale uma vez.
// Ganha quem fechar N casas em linha (linha, coluna ou diagonal). Se ninguém conseguir, ganha quem tiver mais casas.
// Com "pode roubar", dá pra tomar a casa do outro dizendo outro personagem que também vale ali.
(function (raiz) {
  const G = () => raiz.GradeDados
  const MIN_RESPOSTAS = 2   // toda casa sorteada tem pelo menos isso de respostas certas
  const SEM_JOGAR = 6       // tantas vezes seguidas sem ninguém pegar casa: acaba e conta as casas

  const cat = (id) => G().porId[id]
  const vale = (id, key) => cat(id).m.has(key)
  const respostas = (lin, col) => G().chaves.filter((k) => vale(lin, k) && vale(col, k))

  function embaralha(a, rnd) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
  }

  // sorteia as categorias: um terço simples, o resto mais esperto, nenhum par do mesmo grupo se cruzando,
  // toda casa com resposta suficiente. Tenta várias vezes e fica com a melhor.
  function sortearGrade(N, rnd = Math.random) {
    const todas = G().categorias
    const simples = todas.filter((c) => c.nivel === 1)
    const espertas = todas.filter((c) => c.nivel === 2)
    let melhor = null
    for (let t = 0; t < 4000; t++) {
      const nS = Math.max(1, Math.round((2 * N) / 3) - Math.floor(rnd() * 2))
      const escolha = [...embaralha([...simples], rnd).slice(0, nS), ...embaralha([...espertas], rnd).slice(0, 2 * N - nS)]
      embaralha(escolha, rnd)
      // grupos repetidos no mesmo lado tudo bem; o que não pode é linha x coluna do mesmo grupo
      const linhas = escolha.slice(0, N)
      const colunas = escolha.slice(N)
      if (linhas.some((l) => colunas.some((c) => l.grupo === c.grupo))) continue
      let pior = Infinity
      for (const l of linhas) for (const c of colunas) pior = Math.min(pior, respostas(l.id, c.id).length)
      if (pior >= MIN_RESPOSTAS + (N <= 4 ? 1 : 0)) return { linhas: linhas.map((c) => c.id), colunas: colunas.map((c) => c.id) }
      if (!melhor || pior > melhor.pior) melhor = { pior, linhas: linhas.map((c) => c.id), colunas: colunas.map((c) => c.id) }
    }
    return { linhas: melhor.linhas, colunas: melhor.colunas }
  }

  // todas as linhas que ganham: N linhas, N colunas e as 2 diagonais
  function retas(N) {
    const r = []
    for (let i = 0; i < N; i++) { r.push(Array.from({ length: N }, (_, k) => i * N + k)); r.push(Array.from({ length: N }, (_, k) => k * N + i)) }
    r.push(Array.from({ length: N }, (_, k) => k * N + k))
    r.push(Array.from({ length: N }, (_, k) => k * N + (N - 1 - k)))
    return r
  }

  function novoJogo({ N = 3, roubar = false, jogadores, comeca = 0, grade, aleatorio }) {
    const rnd = aleatorio || Math.random
    const g = grade || sortearGrade(N, rnd)
    return {
      N, roubar: !!roubar, linhas: g.linhas, colunas: g.colunas, casas: Array(N * N).fill(null), usados: [],
      js: jogadores.map((p) => ({ nome: p.nome, bot: !!p.bot, nivel: p.nivel || 0.75 })),
      vez: comeca, fase: 'jogo', ultimo: null, seq: 0, semJogar: 0, vence: null, fim: null,
    }
  }

  const linCol = (J, casa) => [J.linhas[Math.floor(casa / J.N)], J.colunas[casa % J.N]]
  const contaCasas = (J, j) => J.casas.filter((c) => c && c.dono === j).length
  // a casa está aberta pra j? (vazia, ou do outro se pode roubar)
  const aberta = (J, j, casa) => !J.casas[casa] || (J.roubar && J.casas[casa].dono !== j)
  // ainda tem resposta que ninguém usou pra essa casa?
  const sobra = (J, casa) => { const [l, c] = linCol(J, casa); return respostas(l, c).filter((k) => !J.usados.includes(k)) }
  const podeJogar = (J, j) => J.casas.some((_, i) => aberta(J, j, i) && sobra(J, i).length > 0)

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
    const reta = retas(J.N).find((r) => r.every((i) => J.casas[i] && J.casas[i].dono === j))
    if (reta) { J.fase = 'fim'; J.fim = { motivo: 'linha', ganhou: j, reta, casas: [contaCasas(J, 0), contaCasas(J, 1)] } }
    else if (!J.roubar && J.casas.every(Boolean)) terminarPorCasas(J)
    else proximaVez(J)
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
  // escolhe a casa: fecha a linha se der, senão bloqueia o outro, senão a que mais ajuda a montar uma linha
  function botJogada(J, j, rnd = Math.random) {
    const outro = 1 - j
    const abertas = J.casas.map((_, i) => i).filter((i) => aberta(J, j, i) && sobra(J, i).length)
    if (!abertas.length) return { passar: true }
    const R = retas(J.N)
    const nota = (i) => {
      let n = rnd()
      for (const r of R) {
        if (!r.includes(i)) continue
        const meus = r.filter((k) => J.casas[k] && J.casas[k].dono === j).length
        const dele = r.filter((k) => J.casas[k] && J.casas[k].dono === outro).length
        if (meus === J.N - 1) n += 100
        if (dele === J.N - 1 && !(J.casas[i] && J.casas[i].dono === outro)) n += 50
        if (J.casas[i] && J.casas[i].dono === outro && dele === J.N) n += 0
        if (!dele) n += 1 + meus
      }
      return n
    }
    const casa = abertas.sort((a, b) => nota(b) - nota(a))[0]
    if (rnd() < J.js[j].nivel) {
      const certas = sobra(J, casa)
      return { casa, key: certas[Math.floor(rnd() * certas.length)] }
    }
    // errou: chuta alguém que não vale (e que ninguém usou)
    const [l, c] = linCol(J, casa)
    const erradas = G().chaves.filter((k) => !J.usados.includes(k) && !(vale(l, k) && vale(c, k)))
    return { casa, key: erradas[Math.floor(rnd() * erradas.length)] }
  }

  raiz.GradeMotor = { sortearGrade, respostas, retas, novoJogo, jogar, passar, botJogada, linCol, aberta, sobra, podeJogar, contaCasas, vale, MIN_RESPOSTAS }
})(typeof window !== 'undefined' ? window : globalThis)
