// Motor do Laboratório do Alto Evolucionário: cada um monta um herói com pedaços de personagens da Marvel. Sai um personagem
// e você decide em qual tópico ele entra (Força, Corpo, Agilidade…), sem saber quem vem depois e sem poder trocar.
// Todo mundo recebe os mesmos personagens, na mesma ordem. Depois os heróis se enfrentam em mata-mata: em cada duelo vota todo
// mundo menos os dois criadores, e quem já caiu continua votando. Empate: o Vigia decide. Só regras aqui (dá pra testar no Node).
(function (raiz) {
  const elenco = () => raiz.LabElenco.chaves
  // os tópicos de sempre (valem pra qualquer personagem); quem joga pode trocar, tirar ou pôr mais
  const PADRAO = ['corpo', 'poder', 'forca', 'agilidade', 'inteligencia', 'velocidade', 'coragem', 'lideranca']
  const MIN_TOPICOS = 3
  const MAX_TOPICOS = 12
  const limpaTopicos = (lista) => {
    const t = (Array.isArray(lista) ? lista : []).map((x) => String(x || '').trim().slice(0, 14)).filter(Boolean).slice(0, MAX_TOPICOS)
    return t.length >= MIN_TOPICOS ? t : [...PADRAO]
  }
  const PRAZO_COLOCAR = 15000
  const PRAZO_VOTAR = 30000
  const MIN = 3
  const MAX = 8
  const embaralha = (a, rnd) => { const v = [...a]; for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [v[i], v[j]] = [v[j], v[i]] } return v }

  // modo 'junto': cada um no seu celular, todos veem o mesmo personagem ao mesmo tempo; 'turno': num celular só, um monta o herói inteiro de cada vez
  function novoJogo({ modo = 'junto', jogadores, topicos, rnd = Math.random }) {
    const tp = limpaTopicos(topicos)
    return { modo, rnd, topicos: tp, fase: 'montar', seq: 0, vez: 0, baralho: embaralha(elenco(), rnd).slice(0, tp.length),
      js: jogadores.map((p) => ({ nome: p.nome, bot: !!p.bot, heroi: Array(tp.length).fill(null) })),
      fila: [], proxima: [], vivos: 0, nDuelo: 0, totalRodada: 0, duelo: null, campeao: -1, historia: [] }
  }

  // ---------- montar ----------
  const colocados = (J, j) => J.js[j].heroi.filter(Boolean).length
  const rodada = (J) => Math.min(...J.js.map((_, j) => colocados(J, j)))
  // o personagem que j tem que colocar agora (ou nada, se está esperando os outros)
  function daVez(J, j) {
    if (J.fase !== 'montar') return null
    const n = colocados(J, j)
    if (n >= J.topicos.length) return null
    if (J.modo === 'turno') return j === J.vez ? J.baralho[n] : null
    return n === rodada(J) ? J.baralho[n] : null
  }
  // j pôs o personagem da vez no tópico número i
  function colocar(J, j, i) {
    const key = daVez(J, j)
    if (!key || !Number.isInteger(i) || i < 0 || i >= J.topicos.length || J.js[j].heroi[i]) return null
    J.js[j].heroi[i] = key
    J.seq += 1
    if (J.modo === 'turno' && colocados(J, j) === J.topicos.length && J.vez < J.js.length - 1) J.vez += 1
    if (J.js.every((_, x) => colocados(J, x) === J.topicos.length)) abreRodada(J, J.js.map((_, x) => x))
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
    const livres = J.topicos.map((_, i) => i).filter((i) => !J.js[j].heroi[i])
    return colocar(J, j, livres[Math.floor(J.rnd() * livres.length)])
  }
  const autoVotar = (J, j) => votar(J, j, J.rnd() < 0.5 ? 'a' : 'b')
  function forcar(J) { for (const j of pendentes(J)) { if (J.fase === 'montar') autoColocar(J, j); else if (J.fase === 'duelo') autoVotar(J, j) } }

  raiz.LabMotor = { PADRAO, MIN_TOPICOS, MAX_TOPICOS, limpaTopicos, MIN, MAX, PRAZO_COLOCAR, PRAZO_VOTAR, novoJogo, colocados, rodada, daVez, colocar, pendentes, votantes, podeVotar, votar, seguir, autoColocar, autoVotar, forcar }
})(typeof window !== 'undefined' ? window : globalThis)
