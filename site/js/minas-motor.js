// Motor das Minas do Multiverso: só regras, sem tela e sem rede (roda no anfitrião e nos testes).
// Rodada: sai um tema → cada um planta 2 minas em segredo (nomes que valem pro tema) → dois fazem o duelo:
// cada um fala um nome na sua vez. Falou a mina de alguém? O dono grita BOOM e quem falou perde uma vida.
// O outro duelista pode duvidar de um nome (digita e o celular confere): errou quem falou ou quem duvidou.
// Ninguém fica de fora: quem já saiu continua plantando minas. E uma vez por jogo… Aquele Acima de Todos.
(function (raiz) {
  const TEMPO_PLANTIO = 60000
  const TEMPO_VEZ = 10000
  const MAX_VIDAS = 5
  let rnd = Math.random
  const A = () => raiz.ApostoMotor

  function novoJogo({ jogadores, vidas = 3, temas, aleatorio }) {
    if (aleatorio) rnd = aleatorio
    const J = { temas, vidas, rodada: 0, usados: [], toaa: false, dobro: false, seq: 0,
      js: jogadores.map((p) => ({ nome: p.nome, bot: !!p.bot, nivel: p.nivel || 0.6, vidas, minas: [], duelos: 0, boomsDados: 0 })) }
    novaRodada(J)
    return J
  }

  const vivos = (J) => J.js.map((p, i) => i).filter((i) => J.js[i].vidas > 0)

  function novaRodada(J) {
    J.rodada += 1
    const livres = J.temas.filter((t) => !J.usados.includes(t.id))
    const tema = livres[Math.floor(rnd() * livres.length)]
    J.usados.push(tema.id)
    if (J.usados.length > J.temas.length - 2) J.usados.shift()
    J.tema = raiz.ApostoTemas.montar(null, tema)
    // o duelo é entre os dois vivos que menos duelaram (empate: sorteio)
    const ordem = vivos(J).sort((a, b) => J.js[a].duelos - J.js[b].duelos || rnd() - 0.5)
    J.par = ordem.slice(0, 2)
    J.par.forEach((i) => { J.js[i].duelos += 1 })
    J.js.forEach((p) => { p.minas = [] })
    Object.assign(J, { fase: 'plantar', vez: 0, falas: [], ultimo: null, evento: null, plantando: proximoPlantar(J, -1) })
    J.js.forEach((p, i) => { if (p.bot) botPlanta(J, i) })
    if (prontos(J)) J.fase = 'duelo'
  }

  // ---------- plantio ----------
  const prontos = (J) => J.js.every((p) => p.minas.length >= 2)
  // num celular só, o aparelho passa de mão em mão: quem é o próximo humano que ainda não plantou
  function proximoPlantar(J, depois) {
    for (let k = 1; k <= J.js.length; k++) { const i = (depois + k + J.js.length) % J.js.length; if (!J.js[i].bot && J.js[i].minas.length < 2) return i }
    return -1
  }
  // planta uma mina digitada: tem que valer pro tema e não pode repetir a sua
  function plantar(J, j, texto) {
    const p = J.js[j]
    if (J.fase !== 'plantar' || !p || p.minas.length >= 2) return { ok: false, motivo: 'fase' }
    const i = A().achar(J.tema, texto)
    if (i < 0) return { ok: false, motivo: 'naovale' }
    if (p.minas.some((m) => m.i === i)) return { ok: false, motivo: 'repetida' }
    p.minas.push({ i, n: J.tema.itens[i].n, explodiu: false })
    if (p.minas.length >= 2) J.plantando = proximoPlantar(J, j)
    if (prontos(J)) J.fase = 'duelo'
    return { ok: true, nome: J.tema.itens[i].n }
  }
  // o tempo do plantio acabou: quem não plantou ganha minas sorteadas
  function tempoPlantio(J) {
    if (J.fase !== 'plantar') return
    J.js.forEach((p, i) => { if (p.minas.length < 2) botPlanta(J, i) })
    J.fase = 'duelo'
  }
  function botPlanta(J, j) {
    const p = J.js[j]
    // bot gosta de minar os nomes óbvios (os que todo mundo vai falar)
    const pesos = J.tema.itens.map((it) => (it.v === 1 ? 6 : it.v === 2 ? 2 : 1))
    let guarda = 0
    while (p.minas.length < 2 && guarda++ < 200) {
      let r = rnd() * pesos.reduce((s, x) => s + x, 0)
      const i = pesos.findIndex((w) => (r -= w) < 0)
      if (!p.minas.some((m) => m.i === i)) p.minas.push({ i, n: J.tema.itens[i].n, explodiu: false })
    }
  }

  // ---------- duelo ----------
  const falando = (J) => J.par[J.vez]
  // quem falou toca "falei" e a vez passa (nome só vem quando é bot falando: os humanos falam em voz alta)
  function falei(J, j, nome) {
    if (J.fase !== 'duelo' || j !== falando(J)) return false
    J.ultimo = { j, seq: ++J.seq, nome: nome || '' }
    J.falas.push({ j, nome: nome || '' })
    J.vez = 1 - J.vez
    return true
  }
  function tempoVez(J) {
    if (J.fase !== 'duelo') return
    perde(J, falando(J), { tipo: 'travou', vitima: falando(J) })
  }

  // BOOM: o dono de uma mina diz que ela foi falada na fala "seq" (o celular confere se a mina é mesmo dele)
  function boom(J, dono, mina, seq) {
    if (J.fase !== 'duelo' || !J.ultimo) return false
    const atras = seq ? J.seq - Number(seq) : 0
    if (atras < 0 || atras >= J.falas.length) return false // fala de outra rodada
    const fala = J.falas[J.falas.length - 1 - atras]
    const vitima = fala ? fala.j : J.ultimo.j
    const m = J.js[dono] && J.js[dono].minas[mina]
    if (!m || m.explodiu || dono === vitima) return false
    m.explodiu = true
    J.js[dono].vidas = Math.min(MAX_VIDAS, J.js[dono].vidas + 1)
    J.js[dono].boomsDados += 1
    perde(J, vitima, { tipo: 'boom', dono, vitima, mina: m.n })
    return true
  }

  // o outro duelista desconfia do último nome: digita, e o celular confere
  function duvidar(J, j, texto) {
    if (J.fase !== 'duelo' || !J.ultimo || !J.par.includes(j) || j === J.ultimo.j || String(texto || '').trim().length < 2) return null
    const i = A().achar(J.tema, texto)
    const vale = i >= 0
    const vitima = vale ? j : J.ultimo.j
    perde(J, vitima, { tipo: 'duvido', quem: j, falou: J.ultimo.j, texto: String(texto).trim().slice(0, 40), vale, nome: vale ? J.tema.itens[i].n : '', vitima })
    return { vale }
  }

  // alguém perdeu vida: o duelo acaba. Se for a primeira vez que alguém zeraria… Aquele Acima de Todos intervém.
  function perde(J, vitima, evento) {
    const p = J.js[vitima]
    p.vidas -= J.dobro ? 2 : 1
    J.evento = { ...evento, dobro: J.dobro, minas: J.par.length ? revelar(J) : [] }
    if (p.vidas <= 0 && !J.toaa) {
      J.toaa = true
      J.dobro = true
      p.vidas = 1
      J.evento.toaa = vitima
      J.fase = 'toaa'
      return
    }
    J.fase = 'resultado'
  }
  // no fim do duelo todo mundo vê as minas que estavam no campo
  const revelar = (J) => J.js.map((p, j) => ({ j, minas: p.minas.map((m) => ({ n: m.n, explodiu: m.explodiu })) }))

  function proximo(J) {
    if (vivos(J).length <= 1) { J.fase = 'fim'; return }
    novaRodada(J)
  }

  // ---------- bots (só pra testar) ----------
  // o bot "fala" um nome (que aparece na tela pra quem tem mina ouvir); às vezes fala um que não vale
  function botFala(J, j) {
    const ditos = new Set(J.falas.map((f) => f.nome))
    const bons = J.tema.itens.filter((it) => !ditos.has(it.n) && !J.js[j].minas.some((m) => m.n === it.n))
    const chute = rnd() < 0.08 || !bons.length
    const nome = chute ? 'Batman' : bons[Math.floor(rnd() * bons.length)].n
    falei(J, j, nome)
    // se o nome do bot é mina de alguém, o celular já sabe: BOOM automático
    if (!chute) J.js.forEach((p, dono) => { const k = p.minas.findIndex((m) => m.n === nome && !m.explodiu); if (k >= 0 && J.fase === 'duelo' && dono !== j) boom(J, dono, k, J.seq) })
    return nome
  }

  raiz.MinasMotor = { novoJogo, plantar, tempoPlantio, falei, tempoVez, boom, duvidar, proximo, botFala, vivos, falando, proximoPlantar, TEMPO_PLANTIO, TEMPO_VEZ }
})(typeof window !== 'undefined' ? window : globalThis)
