// Regras do leilão. Nada de tela aqui: só estado e contas.
(function () {
  const D = window.DRAFT_DATA
  const FORCA = ['', 'Rua', 'Cidade', 'Planeta', 'Cósmico', 'Multiverso']
  const LADO = { H: 'Herói', V: 'Vilão', A: 'Anti-herói' }
  const MODES = { hq: 'Só HQ', mcu: 'Só MCU', both: 'Os dois' }
  const CLASSIC = { mode: 'both', money: 20, size: 8 }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // ref = "hq:12" ou "mcu:40"
  function lotOf(ref) {
    const [src, i] = ref.split(':')
    return { src, ref, ...D[src][Number(i)] }
  }

  // Sorteia os lotes sem repetir personagem (Thor do MCU e Thor da HQ não caem juntos).
  function drawLots(cfg) {
    const used = new Set()
    const take = (src, n) => {
      const out = []
      for (const i of shuffle(D[src].map((_, i) => i))) {
        if (out.length === n) break
        const key = D[src][i].key
        if (used.has(key)) continue
        used.add(key)
        out.push(src + ':' + i)
      }
      return out
    }
    if (cfg.mode !== 'both') return take(cfg.mode, cfg.size)
    const half = Math.floor(cfg.size / 2)
    return shuffle([...take('hq', cfg.size - half), ...take('mcu', half)])
  }

  function newGame(cfg) {
    return {
      cfg: { mode: cfg.mode, money: cfg.money, size: cfg.size, style: cfg.style || 'normal' },
      lots: drawLots(cfg),
      cur: 0,
      bid: 0,
      leader: -1,
      money: [cfg.money, cfg.money],
      teams: [[], []],
      sold: [],
      team: cfg.size / 2,
      result: null,
      log: [],
    }
  }

  const open = (g, p) => g.team - g.teams[p].length
  // Sem reserva: dá pra apostar até o último real.
  const maxBid = (g, p) => (open(g, p) > 0 ? g.money[p] : 0)
  const done = (g) => g.cur >= g.lots.length
  const started = (g) => g.cur > 0 || g.leader >= 0

  // Quem abre o lance: alterna a cada lote (jogador 1 abre o lote 1, jogador 2 o lote 2...).
  function opener(g) {
    let p = g.cur % 2
    if (open(g, p) === 0) p = 1 - p
    return p
  }

  // Quando um time fecha, o outro leva o que sobrou.
  function forcedTo(g) {
    if (done(g)) return -1
    if (open(g, 0) === 0) return 1
    if (open(g, 1) === 0) return 0
    return -1
  }

  // Pode dar lance agora? Antes da abertura, só quem tem a vez.
  function canBid(g, p) {
    if (done(g) || forcedTo(g) >= 0 || open(g, p) === 0 || g.leader === p) return false
    return g.leader >= 0 || p === opener(g)
  }

  // Menor lance válido: abrir custa R$1 (ou R$0 se o dinheiro acabou); depois, cobrir por +1.
  const minBid = (g, p) => (g.leader < 0 ? Math.min(1, g.money[p]) : g.bid + 1)

  function validBid(g, p, v) {
    return canBid(g, p) && Number.isInteger(v) && v >= minBid(g, p) && v <= maxBid(g, p)
  }

  // Quanto vira o lance se o jogador p apertar +inc (ou 'max'). null = não pode.
  function nextBid(g, p, inc) {
    if (!canBid(g, p)) return null
    const v = inc === 'max' ? maxBid(g, p) : Math.min(g.leader < 0 ? inc : g.bid + inc, maxBid(g, p))
    return validBid(g, p, v) ? v : null
  }

  function bid(g, p, amount) {
    g.bid = amount
    g.leader = p
    ;(g.log = g.log || []).push([p, amount])
  }

  function sell(g) {
    if (g.leader < 0) return null
    const w = g.leader
    const price = g.bid
    g.money[w] -= price
    g.teams[w].push({ lot: g.cur, price })
    g.sold[g.cur] = { w, price }
    return { w, price, lot: g.cur }
  }

  function advance(g) {
    g.cur++
    g.bid = 0
    g.leader = -1
    g.log = []
  }

  // Sem disputa, o resto sai de graça.
  function sellRest(g) {
    const w = forcedTo(g)
    if (w < 0) return
    while (!done(g)) {
      g.teams[w].push({ lot: g.cur, price: 0 })
      g.sold[g.cur] = { w, price: 0, rest: true }
      g.cur++
    }
    g.bid = 0
    g.leader = -1
    g.log = []
  }

  function teamStats(g, p) {
    const lots = g.teams[p].map((t) => ({ ...lotOf(g.lots[t.lot]), price: t.price }))
    const count = (s) => lots.filter((l) => l.s === s).length
    return {
      lots,
      spent: lots.reduce((s, l) => s + l.price, 0),
      left: g.money[p],
      power: lots.reduce((s, l) => s + l.f, 0),
      heroes: count('H'),
      villains: count('V'),
      anti: count('A'),
    }
  }

  window.Engine = {
    D, FORCA, LADO, MODES, CLASSIC, shuffle, lotOf, drawLots, newGame, open, maxBid, done, started,
    opener, forcedTo, canBid, minBid, validBid, nextBid, bid, sell, advance, sellRest, teamStats,
  }
})()
