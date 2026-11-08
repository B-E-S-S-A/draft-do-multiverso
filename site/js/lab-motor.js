// Motor do Laboratório do Alto Evolucionário: cada um monta um herói com pedaços de personagens da Marvel. Sai um personagem
// e você decide em qual tópico ele entra (Força, Corpo, Agilidade…), sem saber quem vem depois e sem poder trocar.
// Todo mundo recebe os mesmos personagens, na mesma ordem. Depois os heróis se enfrentam em mata-mata: em cada duelo vota todo
// mundo menos os dois criadores, e quem já caiu continua votando. Empate: o Vigia decide. Só regras aqui (dá pra testar no Node).
(function (raiz) {
  const D = () => raiz.DRAFT_DATA
  const TOPICOS = ['corpo', 'poder', 'forca', 'agilidade', 'inteligencia', 'arma', 'traje', 'parceiro']
  const PRAZO_COLOCAR = 15000
  const PRAZO_VOTAR = 30000
  const MIN = 3
  const MAX = 8
  const embaralha = (a, rnd) => { const v = [...a]; for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [v[i], v[j]] = [v[j], v[i]] } return v }

  // modo 'junto': cada um no seu celular, todos veem o mesmo personagem ao mesmo tempo; 'turno': num celular só, um monta o herói inteiro de cada vez
  function novoJogo({ modo = 'junto', jogadores, rnd = Math.random }) {
    return { modo, rnd, fase: 'montar', seq: 0, vez: 0, baralho: embaralha(D().hq.map((h) => h.key), rnd).slice(0, TOPICOS.length),
      js: jogadores.map((p) => ({ nome: p.nome, bot: !!p.bot, heroi: {} })),
      fila: [], proxima: [], vivos: 0, nDuelo: 0, totalRodada: 0, duelo: null, campeao: -1, historia: [] }
  }

  // ---------- montar ----------
  const colocados = (J, j) => Object.keys(J.js[j].heroi).length
  const rodada = (J) => Math.min(...J.js.map((_, j) => colocados(J, j)))
  // o personagem que j tem que colocar agora (ou nada, se está esperando os outros)
  function daVez(J, j) {
    if (J.fase !== 'montar') return null
    const n = colocados(J, j)
    if (n >= TOPICOS.length) return null
    if (J.modo === 'turno') return j === J.vez ? J.baralho[n] : null
    return n === rodada(J) ? J.baralho[n] : null
  }
  function colocar(J, j, topico) {
    const key = daVez(J, j)
    if (!key || !TOPICOS.includes(topico) || J.js[j].heroi[topico]) return null
    J.js[j].heroi[topico] = key
    J.seq += 1
    if (J.modo === 'turno' && colocados(J, j) === TOPICOS.length && J.vez < J.js.length - 1) J.vez += 1
    if (J.js.every((_, i) => colocados(J, i) === TOPICOS.length)) abreRodada(J, J.js.map((_, i) => i))
    return key
  }
  const pendentes = (J) => {
    if (J.fase === 'montar') return J.js.map((_, j) => j).filter((j) => daVez(J, j))
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

  // ---------- bot e tempo esgotado: decide por quem não decidiu ----------
  function autoColocar(J, j) {
    const livres = TOPICOS.filter((t) => !J.js[j].heroi[t])
    return colocar(J, j, livres[Math.floor(J.rnd() * livres.length)])
  }
  const autoVotar = (J, j) => votar(J, j, J.rnd() < 0.5 ? 'a' : 'b')
  function forcar(J) { for (const j of pendentes(J)) { if (J.fase === 'montar') autoColocar(J, j); else if (J.fase === 'duelo') autoVotar(J, j) } }

  raiz.LabMotor = { TOPICOS, MIN, MAX, PRAZO_COLOCAR, PRAZO_VOTAR, novoJogo, colocados, rodada, daVez, colocar, pendentes, votantes, podeVotar, votar, seguir, autoColocar, autoVotar, forcar }
})(typeof window !== 'undefined' ? window : globalThis)
