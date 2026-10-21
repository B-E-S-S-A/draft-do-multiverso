// Estado, regras de fluxo (martelo, preço caindo, sem dinheiro), cliques, teclado e modo online.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const Net = window.Net
  const app = document.getElementById('app')
  const SAVE = 'mvd-v2'

  const S = {
    screen: 'setup',
    cfg: { ...E.CLASSIC, style: 'normal', names: ['Jogador 1', 'Jogador 2'] },
    score: [0, 0, 0],
    game: null,
    history: [],
    busy: null,
    timer: null,
    drop: null,
    note: '',
    confirm: null,
    showcase: [],
    stacks: {},
    me: null, // online: 0 = anfitrião, 1 = convidado; null = mesmo aparelho
    net: { status: 'off' },
    ev: { n: 0 },
  }
  const nm = (p) => S.cfg.names[p] || 'Jogador ' + (p + 1)

  // ---------- salvar ----------
  function save() {
    if (S.me === 1) return // o convidado só espelha o jogo do anfitrião
    try {
      localStorage.setItem(SAVE, JSON.stringify({ screen: S.screen, cfg: S.cfg, score: S.score, game: S.game }))
    } catch (e) {}
  }
  function restore(data) {
    if (!data) return
    if (data.cfg) S.cfg = { ...S.cfg, ...data.cfg }
    if (S.cfg.auto && !data.cfg.style) S.cfg.style = 'auto'
    delete S.cfg.auto
    if (Array.isArray(data.score)) S.score = data.score
    if (data.game && data.game.lots && data.game.lots.every((r) => validRef(r))) S.game = data.game
    if (data.screen === 'result' && S.game && E.done(S.game)) S.screen = 'result'
    else if (data.screen === 'auction' && S.game && !E.done(S.game)) S.screen = 'auction'
  }
  function validRef(ref) {
    const [src, i] = String(ref).split(':')
    return (src === 'hq' || src === 'mcu') && D[src][Number(i)]
  }
  function loadStored() {
    try { return JSON.parse(localStorage.getItem(SAVE) || 'null') } catch (e) { return null }
  }

  // ---------- desenhar ----------
  function set(id, html) {
    const el = document.getElementById(id)
    if (el && el.__h !== html) {
      el.innerHTML = html
      el.__h = html
    }
  }

  let shown = null
  function render() {
    if (shown !== S.screen) {
      shown = S.screen
      document.body.dataset.screen = S.screen
      app.innerHTML = S.screen === 'setup' ? V.setup(S) : S.screen === 'auction' ? V.auction(S) : V.result(S)
      window.scrollTo({ top: 0 })
    }
    if (S.screen === 'setup') {
      set('rules', V.rules(S))
      const rules = document.getElementById('rules')
      rules.toggleAttribute('inert', S.me === 1)
      rules.classList.toggle('locked', S.me === 1)
      set('score', V.score(S))
      set('online', V.online(S))
      set('go', V.go(S))
      for (const p of [0, 1]) {
        const input = document.getElementById('name' + p)
        if (!input) continue
        if (document.activeElement !== input) input.value = S.cfg.names[p] || ''
        input.readOnly = S.me != null && S.me !== p
      }
    } else if (S.screen === 'auction' && S.game) {
      set('topbtns', V.topButtons(S))
      set('lots', V.lots(S))
      set('stagecard', V.stageCard(S))
      set('stamp', V.stamp(S))
      set('gavel', V.gavel(S))
      set('pl0', V.player(S, 0))
      set('pl1', V.player(S, 1))
      document.getElementById('pl0').classList.toggle('leading', S.game.leader === 0)
      document.getElementById('pl1').classList.toggle('leading', S.game.leader === 1)
      const now = document.querySelector('.lot-mini.now')
      if (now && now.scrollIntoView) now.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    } else if (S.screen === 'result' && S.game) {
      set('verdict', V.verdict(S))
      document.querySelectorAll('.side').forEach((el, p) => {
        const won = S.game.result === p
        el.classList.toggle('won', won)
        const ph = el.querySelector('.ph')
        const flag = ph.querySelector('.flag')
        if (won && !flag) ph.insertAdjacentHTML('beforeend', '<span class="flag">venceu</span>')
        if (!won && flag) flag.remove()
      })
    }
    broadcast()
  }
  function commit() {
    save()
    render()
  }

  // ---------- sons (o convidado toca os mesmos sons) ----------
  function playFx(ev) {
    const X = window.Sfx
    if (ev.type === 'bid') X.bid(ev.p)
    else if (ev.type === 'hammer') { X.hammer(); X.sold() }
    else if (X[ev.type]) X[ev.type]()
  }
  function fx(type, p) {
    S.ev = { n: S.ev.n + 1, type, p }
    playFx(S.ev)
  }

  // ---------- fluxo do leilão (roda no aparelho que manda no jogo) ----------
  let busyT = 0, tick = 0, dropT = 0, dropI = 0, autoT = 0
  function clearTimers() {
    clearTimeout(busyT); clearInterval(tick); clearTimeout(dropT); clearInterval(dropI); clearTimeout(autoT)
    S.timer = null
    S.drop = null
    S.note = ''
  }
  const style = () => (S.game && S.game.cfg.style) || 'normal'

  function snapshot() {
    S.history.push(JSON.stringify(S.game))
    if (S.history.length > 60) S.history.shift()
  }

  function startGame() {
    clearTimers()
    S.game = E.newGame(S.cfg)
    S.history = []
    S.busy = null
    S.screen = 'auction'
    fx('draw')
    beginLot()
  }

  function beginLot() {
    const g = S.game
    if (!g || E.done(g) || E.forcedTo(g) >= 0) return
    if (style() === 'drop') return startDrop()
    const op = E.opener(g)
    // sem dinheiro, quem tem a vez abre sozinho por R$0
    if (g.leader < 0 && g.money[op] === 0) {
      E.bid(g, op, 0)
      S.note = `${nm(op)} está sem dinheiro e abriu por R$0.`
      checkStuck()
    }
  }

  // ninguém mais pode cobrir? vende sozinho, sem ninguém precisar clicar
  function checkStuck() {
    const g = S.game
    if (!g || g.leader < 0 || S.busy) return false
    const other = 1 - g.leader
    if (E.open(g, other) > 0 && g.money[other] < g.bid + 1) {
      clearInterval(tick)
      S.timer = null
      S.note = `${nm(other)} não tem dinheiro pra cobrir. Vendendo…`
      clearTimeout(autoT)
      autoT = setTimeout(() => hammer(), 1400)
      return true
    }
    return false
  }

  function placeBid(p, inc) {
    const g = S.game
    if (!g || S.busy) return
    const v = E.nextBid(g, p, inc)
    if (v !== null) placeValue(p, v)
  }

  function placeValue(p, v) {
    const g = S.game
    if (!g || S.busy || !E.validBid(g, p, v)) return
    snapshot()
    S.note = ''
    E.bid(g, p, v)
    fx('bid', p)
    if (!checkStuck()) armTimer()
  }

  function hammer() {
    const g = S.game
    if (!g || S.busy || E.done(g) || E.forcedTo(g) >= 0 || g.leader < 0) return
    snapshot()
    sellNow()
  }

  function sellNow() {
    const g = S.game
    clearTimers()
    S.busy = E.sell(g)
    fx('hammer')
    busyT = setTimeout(() => {
      S.busy = null
      E.advance(g)
      if (E.done(g)) S.screen = 'result'
      else beginLot()
      commit()
    }, 1300)
    commit()
  }

  function giveRest() {
    const g = S.game
    if (!g || E.forcedTo(g) < 0) return
    clearTimers()
    snapshot()
    E.sellRest(g)
    fx('sold')
    S.screen = 'result'
  }

  function undo() {
    if (!S.history.length) return
    clearTimers()
    S.busy = null
    S.game = JSON.parse(S.history.pop())
    S.screen = 'auction'
    fx('undo')
    if (style() === 'drop' && S.game.leader < 0) startDrop()
  }

  // martelo automático: 5 s depois do último lance
  const STEPS = ['Dou-lhe uma…', 'Dou-lhe duas…', 'Dou-lhe três…']
  function armTimer() {
    clearInterval(tick)
    S.timer = null
    if (style() !== 'auto') return
    const end = Date.now() + 5000
    S.timer = { step: 0, label: 'Alguém cobre?' }
    tick = setInterval(() => {
      const left = end - Date.now()
      if (left <= 0) {
        clearInterval(tick)
        S.timer = null
        hammer()
        return
      }
      const step = left <= 3000 ? Math.min(3, Math.floor((3000 - left) / 1000) + 1) : 0
      if (step !== S.timer.step) {
        S.timer = { step, label: step ? STEPS[step - 1] : 'Alguém cobre?' }
        if (step) fx('tick')
        render()
      }
    }, 100)
  }

  // preço caindo: começa alto, cai R$1 a cada 0,8 s; quem tocar primeiro leva
  function startDrop() {
    const g = S.game
    clearTimeout(dropT)
    clearInterval(dropI)
    const rich = Math.max(...[0, 1].filter((p) => E.open(g, p) > 0).map((p) => g.money[p]), 0)
    const start = Math.min(rich, Math.max(2, Math.ceil(g.cfg.money / 2)))
    S.drop = { start, price: start, phase: 'ready' }
    dropT = setTimeout(() => {
      if (!S.drop) return
      S.drop.phase = 'drop'
      commit()
      dropI = setInterval(() => {
        if (!S.drop) return clearInterval(dropI)
        if (S.drop.price > 0) {
          S.drop.price--
          fx('tick')
          render()
          return
        }
        // chegou a zero e ninguém quis: fica com o dono da vez, de graça
        clearInterval(dropI)
        snapshot()
        E.bid(g, E.opener(g), 0)
        sellNow()
      }, 800)
    }, 1500)
  }

  function grab(p) {
    const g = S.game
    const d = S.drop
    if (!g || !d || d.phase !== 'drop' || S.busy) return
    if (E.open(g, p) === 0 || g.money[p] < d.price) return
    const price = d.price
    snapshot()
    E.bid(g, p, price)
    sellNow()
  }

  // ---------- ações ----------
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
  const actions = {
    mode: (d) => { S.cfg.mode = d.v },
    money: (d) => { S.cfg.money = clamp(S.cfg.money + Number(d.v), 1, 200) },
    'money-set': (d) => { S.cfg.money = Number(d.v) },
    size: (d) => { S.cfg.size = clamp(S.cfg.size + Number(d.v), 4, 20) },
    style: (d) => { if (['normal', 'auto', 'drop'].includes(d.v)) S.cfg.style = d.v },
    classic: () => { Object.assign(S.cfg, E.CLASSIC) },
    name: (d) => { S.cfg.names[Number(d.p)] = String(d.v || '').trim().slice(0, 16) },
    start: startGame,
    again: startGame,
    resume: () => { S.screen = 'auction'; if (S.game && !S.game.busy) beginLot() },
    reroll: () => {
      if (E.started(S.game)) return
      clearTimers()
      S.game.lots = E.drawLots(S.game.cfg)
      fx('draw')
      beginLot()
    },
    leave: () => {
      clearTimers()
      if (S.busy) { S.busy = null; E.advance(S.game); if (E.done(S.game)) { S.screen = 'result'; return } }
      S.screen = 'setup'
    },
    rules: () => { S.screen = 'setup' },
    bid: (d) => placeBid(Number(d.p), d.inc === 'max' ? 'max' : Number(d.inc)),
    'bid-custom': (d) => placeValue(Number(d.p), Math.round(Number(d.value))),
    grab: (d) => grab(Number(d.p)),
    hammer,
    undo,
    rest: giveRest,
    win: (d) => {
      const v = Number(d.v)
      const g = S.game
      if (!g || g.result === v) return
      if (g.result != null) S.score[g.result] = Math.max(0, S.score[g.result] - 1)
      g.result = v
      S.score[v]++
      if (v !== 2) fx('win')
    },
    'reset-score': () => {
      if (S.confirm !== 'score') { S.confirm = 'score'; return }
      S.score = [0, 0, 0]
      S.confirm = null
    },
  }

  // ações que não mexem no jogo: rodam só neste aparelho
  const local = {
    copy: () => {
      const text = V.shareText(S)
      const out = document.getElementById('copied')
      const fallback = () => {
        out.innerHTML = `<textarea class="copybox" readonly rows="8">${V.esc(text)}</textarea>`
        out.querySelector('textarea').select()
      }
      try {
        navigator.clipboard.writeText(text).then(() => { out.textContent = 'Times copiados. É só colar no WhatsApp.' }, fallback)
      } catch (e) { fallback() }
    },
    'net-host': () => Net.host(),
    'net-join': (d) => Net.join(d.code),
    'net-leave': () => Net.leave(),
  }

  // quem pode o quê no online
  const PLAYER_ACTS = new Set(['bid', 'bid-custom', 'grab', 'name'])
  const GUEST_OK = new Set(['bid', 'bid-custom', 'grab', 'hammer', 'undo', 'rest', 'win', 'name'])

  function run(act, data, who) {
    const fn = actions[act]
    if (!fn) return
    if (who === 1 && !GUEST_OK.has(act)) return
    if (who != null && PLAYER_ACTS.has(act) && Number(data.p) !== who) return
    if (who != null && act === 'hammer' && S.game && S.game.leader === who) return
    if (act !== 'reset-score') S.confirm = null
    fn(data)
    commit()
  }

  function dispatch(act, data = {}) {
    if (local[act]) { local[act](data); return }
    if (S.me === 1) { if (GUEST_OK.has(act)) Net.send({ type: 'act', act, data }); return }
    run(act, data, S.me)
  }

  // ---------- online ----------
  function pack() {
    return { screen: S.screen, cfg: S.cfg, score: S.score, game: S.game, busy: S.busy, timer: S.timer, drop: S.drop, note: S.note, hist: S.history.length, ev: S.ev }
  }
  function broadcast() {
    if (S.me === 0 && Net.connected()) Net.send({ type: 'state', s: pack() })
  }
  function applyState(s) {
    Object.assign(S, { screen: s.screen, cfg: s.cfg, score: s.score, game: s.game, busy: s.busy, timer: s.timer, drop: s.drop, note: s.note })
    S.history = { length: s.hist }
    if (s.ev && s.ev.n !== S.ev.n) { if (s.ev.n > 0) playFx(s.ev); S.ev = s.ev }
    render()
  }
  const myName = () => { try { return localStorage.getItem('mvd-me') || '' } catch (e) { return '' } }

  Net.on('status', (n) => {
    const wasGuest = S.me === 1
    S.net = { status: n.status, code: n.code, error: n.error }
    S.me = n.status === 'connected' ? (n.role === 'host' ? 0 : 1) : null
    if (wasGuest && S.me !== 1) {
      // saiu da sala do amigo: volta pro jogo deste aparelho
      clearTimers()
      Object.assign(S, { screen: 'setup', game: null, busy: null, history: [] })
      S.cfg = { ...E.CLASSIC, style: 'normal', names: ['Jogador 1', 'Jogador 2'] }
      restore(loadStored())
      S.screen = 'setup'
    }
    if (n.status === 'connected' && n.role === 'guest') Net.send({ type: 'act', act: 'name', data: { p: 1, v: myName() || S.cfg.names[1] } })
    shown = null
    render()
  })
  Net.on('message', (msg) => {
    if (!msg || typeof msg !== 'object') return
    if (msg.type === 'act' && S.me === 0 && typeof msg.act === 'string') run(msg.act, msg.data || {}, 1)
    else if (msg.type === 'state' && S.me === 1 && msg.s) applyState(msg.s)
    else if (msg.type === 'full') { Net.leave(); S.net.error = 'Essa sala já tem dois jogadores.'; render() }
  })

  // ---------- eventos ----------
  app.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]')
    if (!el || el.disabled) return
    const data = { ...el.dataset }
    const act = data.act
    if (act === 'bid-custom') { const num = document.getElementById('num' + data.p); data.value = num ? num.value : '' }
    if (act === 'net-join') { const c = document.getElementById('joincode'); data.code = c ? c.value : '' }
    dispatch(act, data)
  })

  // régua e campo do valor livre andam juntos
  function syncCustom(p, raw, from) {
    const rng = document.getElementById('rng' + p)
    const num = document.getElementById('num' + p)
    const give = document.getElementById('give' + p)
    if (!rng || !num) return
    const lo = Number(rng.min)
    const hi = Number(rng.max)
    const v = Math.round(Number(raw))
    const ok = Number.isFinite(v) && v >= lo && v <= hi
    if (from !== 'num') num.value = String(ok ? v : lo)
    if (from !== 'rng' && ok) rng.value = String(v)
    if (give) give.textContent = ok ? String(v) : '?'
    num.classList.toggle('bad', !ok)
  }

  app.addEventListener('input', (ev) => {
    const c = ev.target.id && ev.target.id.match(/^(rng|num)([01])$/)
    if (c) { syncCustom(Number(c[2]), ev.target.value, c[1]); return }
    const m = ev.target.id && ev.target.id.match(/^name([01])$/)
    if (!m) return
    const p = Number(m[1])
    if (S.me === p) try { localStorage.setItem('mvd-me', ev.target.value.trim().slice(0, 16)) } catch (e) {}
    dispatch('name', { p, v: ev.target.value })
  })

  // teclado: jogador 1 = A S D F, jogador 2 = J K L Ç (ou ;). Online, qualquer lado vale pra você.
  const KEYMAP = { a: [0, 1], s: [0, 2], d: [0, 5], f: [0, 'max'], j: [1, 1], k: [1, 2], l: [1, 5], 'ç': [1, 'max'], ';': [1, 'max'] }
  document.addEventListener('keydown', (ev) => {
    if (S.screen !== 'auction' || ev.ctrlKey || ev.metaKey || ev.altKey) return
    const num = ev.target.id && ev.target.id.match(/^num([01])$/)
    if (num && ev.key === 'Enter') { dispatch('bid-custom', { p: num[1], value: ev.target.value }); ev.preventDefault(); return }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return
    const k = ev.key.toLowerCase()
    if (KEYMAP[k]) {
      const p = S.me != null ? S.me : KEYMAP[k][0]
      if (style() === 'drop') { if (S.me != null || k === 'a' || k === 'l') dispatch('grab', { p }) }
      else dispatch('bid', { p, inc: String(KEYMAP[k][1]) })
      ev.preventDefault()
    } else if (k === 'enter' && !ev.target.closest('button')) { dispatch('hammer'); ev.preventDefault() }
    else if (k === 'z' || k === 'backspace') { dispatch('undo'); ev.preventDefault() }
  })

  const sound = document.getElementById('sound')
  function paintSound() {
    sound.textContent = 'Som: ' + (window.Sfx.on ? 'ligado' : 'desligado')
    sound.setAttribute('aria-pressed', String(window.Sfx.on))
  }
  sound.addEventListener('click', () => { window.Sfx.on = !window.Sfx.on; paintSound(); if (window.Sfx.on) window.Sfx.tick() })
  paintSound()

  // ---------- início ----------
  function pick(src, n) {
    return E.shuffle(D[src].map((_, i) => src + ':' + i)).slice(0, n).map(E.lotOf)
  }
  function pickMcuWorks(n) {
    const seen = new Set()
    return E.shuffle(D.mcu.map((_, i) => 'mcu:' + i)).map(E.lotOf).filter((l) => {
      if (seen.has(l.w) || D.works[l.w].tv) return false
      seen.add(l.w)
      return true
    }).slice(0, n)
  }

  function start(data) {
    restore(data && data.cfg ? data : loadStored())
    const hq = pick('hq', 9)
    const mcu = pickMcuWorks(9)
    S.showcase = E.shuffle([...hq.slice(0, 7), ...mcu.slice(0, 7)])
    S.stacks = { hq: hq.slice(7, 9).concat(pick('hq', 1)), mcu: mcu.slice(7, 9).concat(pickMcuWorks(1)), both: [hq[0], mcu[0], hq[1]] }
    V.load().then(() => {
      // um leilão salvo no meio volta parado: o preço caindo recomeça do lote atual
      if (S.screen === 'auction' && S.game && style() === 'drop' && S.game.leader < 0) startDrop()
      render()
    })
  }

  const hot = window.claude && window.claude.hot
  if (hot && hot.snapshot) hot.snapshot(() => ({ screen: S.screen, cfg: S.cfg, score: S.score, game: S.game }))
  if (hot && hot.ready) hot.ready(start)
  else start(hot && hot.data ? hot.data : {})
})()
