// Motor do Laboratório do Alto Evolucionário: cada um monta um herói absurdo (corpo, poder, fraqueza e nome) e eles se enfrentam
// em mata-mata. Em cada duelo vota todo mundo, menos os dois criadores; quem já caiu continua votando. Empate: o Vigia decide.
// Sem tela nem internet aqui: só as regras (dá pra testar no Node).
(function (raiz) {
  const LD = () => raiz.LabDados
  const D = () => raiz.DRAFT_DATA
  const PRAZO_MONTAR = 90000
  const PRAZO_VOTAR = 30000
  const MIN = 3
  const MAX = 8
  const embaralha = (a, rnd) => { const v = [...a]; for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [v[i], v[j]] = [v[j], v[i]] } return v }
  const indices = (lista) => lista.map((_, i) => i)

  // modo 'escolhe': 3 cartas de cada tipo pra escolher; 'sorteio': 1 de cada, a pessoa só dá o nome
  function novoJogo({ modo = 'escolhe', jogadores, rnd = Math.random }) {
    const n = modo === 'sorteio' ? 1 : 3
    const corpos = embaralha(D().hq.map((h) => h.key), rnd)
    const poderes = embaralha(indices(LD().PODERES), rnd)
    const fraquezas = embaralha(indices(LD().FRAQUEZAS), rnd)
    const parte = (lista, i) => lista.slice(i * n, (i + 1) * n)
    return { modo, fase: 'montar', seq: 0, rnd,
      js: jogadores.map((p, i) => ({ nome: p.nome, bot: !!p.bot, mao: { corpos: parte(corpos, i), poderes: parte(poderes, i), fraquezas: parte(fraquezas, i) }, heroi: null })),
      fila: [], proxima: [], vivos: 0, nDuelo: 0, totalRodada: 0, duelo: null, campeao: -1, historia: [], nomesUsados: [] }
  }

  // ---------- montar ----------
  function nomePronto(J) {
    const livres = indices(LD().NOMES).filter((i) => !J.nomesUsados.includes(i))
    const i = livres.length ? livres[Math.floor(J.rnd() * livres.length)] : Math.floor(J.rnd() * LD().NOMES.length)
    J.nomesUsados.push(i)
    return i
  }
  // j terminou o herói: as cartas têm que ser da mão dele; sem nome, ganha um pronto
  function montar(J, j, { corpo, poder, fraqueza, nome }) {
    if (J.fase !== 'montar' || !J.js[j] || J.js[j].heroi) return null
    const m = J.js[j].mao
    if (!m.corpos.includes(corpo) || !m.poderes.includes(poder) || !m.fraquezas.includes(fraqueza)) return null
    const limpo = String(nome || '').replace(/\s+/g, ' ').trim().slice(0, 26)
    J.js[j].heroi = { dono: j, corpo, poder, fraqueza, nome: limpo, pronto: limpo ? -1 : nomePronto(J) }
    J.seq += 1
    if (J.js.every((p) => p.heroi)) abreRodada(J, J.js.map((_, i) => i))
    return J.js[j].heroi
  }
  const pendentes = (J) => {
    if (J.fase === 'montar') return J.js.map((_, j) => j).filter((j) => !J.js[j].heroi)
    if (J.fase === 'duelo') return votantes(J).filter((j) => J.duelo.votos[j] === undefined)
    return []
  }

  // ---------- mata-mata ----------
  function abreRodada(J, vivos) {
    const v = embaralha(vivos, J.rnd)
    J.vivos = v.length
    J.fila = []
    for (let i = 0; i + 1 < v.length; i += 2) J.fila.push([v[i], v[i + 1]])
    J.proxima = v.length % 2 ? [v[v.length - 1]] : [] // número ímpar: o último passa direto
    J.totalRodada = J.fila.length
    J.nDuelo = 0
    proximoDuelo(J)
  }
  function proximoDuelo(J) {
    const [a, b] = J.fila.shift()
    J.duelo = { a, b, votos: {}, ganhou: -1, desempate: false, placar: [0, 0] }
    J.nDuelo += 1
    J.fase = 'duelo'
    J.seq += 1
  }
  const votantes = (J) => J.js.map((_, j) => j).filter((j) => j !== J.duelo.a && j !== J.duelo.b)
  const podeVotar = (J, j) => J.fase === 'duelo' && votantes(J).includes(j) && J.duelo.votos[j] === undefined
  function votar(J, j, lado) {
    if (!podeVotar(J, j) || !['a', 'b'].includes(lado)) return null
    J.duelo.votos[j] = lado
    J.seq += 1
    if (!pendentes(J).length) apurar(J)
    return true
  }
  function apurar(J) {
    const d = J.duelo
    const v = Object.values(d.votos)
    d.placar = [v.filter((x) => x === 'a').length, v.filter((x) => x === 'b').length]
    d.desempate = d.placar[0] === d.placar[1]
    d.ganhou = d.desempate ? (J.rnd() < 0.5 ? d.a : d.b) : d.placar[0] > d.placar[1] ? d.a : d.b
    J.historia.push({ a: d.a, b: d.b, ganhou: d.ganhou, placar: [...d.placar], desempate: d.desempate, vivos: J.vivos })
    J.fase = 'resultado'
    J.seq += 1
  }
  // depois de ver o resultado: próximo duelo, próxima rodada ou campeão
  function seguir(J) {
    if (J.fase !== 'resultado') return
    J.proxima.push(J.duelo.ganhou)
    if (J.fila.length) return proximoDuelo(J)
    if (J.proxima.length === 1) { J.campeao = J.proxima[0]; J.fase = 'fim'; J.seq += 1; return }
    abreRodada(J, J.proxima)
  }

  // ---------- bot e tempo esgotado: escolhe por quem não fez ----------
  function autoMontar(J, j, rnd = J.rnd) {
    const m = J.js[j].mao
    const pega = (l) => l[Math.floor(rnd() * l.length)]
    return montar(J, j, { corpo: pega(m.corpos), poder: pega(m.poderes), fraqueza: pega(m.fraquezas), nome: '' })
  }
  const autoVotar = (J, j, rnd = J.rnd) => votar(J, j, rnd() < 0.5 ? 'a' : 'b')
  function forcar(J) { for (const j of pendentes(J)) { if (J.fase === 'montar') autoMontar(J, j); else if (J.fase === 'duelo') autoVotar(J, j) } }

  raiz.LabMotor = { MIN, MAX, PRAZO_MONTAR, PRAZO_VOTAR, novoJogo, montar, pendentes, votantes, podeVotar, votar, seguir, autoMontar, autoVotar, forcar }
})(typeof window !== 'undefined' ? window : globalThis)
