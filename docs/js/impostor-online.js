// Impostor online: quem cria a sala comanda (regras, cartas, tempo, revelar); cada um vê só a própria carta
// e vota escondido no próprio aparelho. Conexão de aparelho pra aparelho (PeerJS), sem conta.
// O anfitrião guarda o jogo inteiro e manda pra cada um só a "visão" dele (a carta dos outros nunca sai do anfitrião).
(function () {
  const E = window.Engine
  const I = window.Impostor
  const H = I._
  const { C, T, esc, cor, som } = H
  const el = document.getElementById('impostor')
  const PREFIX = 'mvimp-v1-'
  const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const ERROS_SERVIDOR = ['network', 'server-error', 'socket-error', 'socket-closed', 'ssl-unavailable', 'browser-incompatible', 'webrtc']

  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  // quem sou eu na sala: um por aba (recarregar a página mantém, então dá pra voltar pro mesmo lugar)
  const MEU_ID = (() => {
    let v = ''
    try { v = sessionStorage.getItem('mvd-imp-id') || '' } catch (e) {}
    if (!v) { v = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mvd-imp-id', v) } catch (e) {} }
    return v
  })()
  const meuNome = () => guarda('mvd-imp-nome')

  const N = { status: 'off', papel: null, code: '', erro: '' } // status: off | creating | hosting | joining | connected
  let peer = null
  let conn = null           // convidado: a conexão com o anfitrião
  let sala = null           // anfitrião: { jogadores: [{ id, nome, conn, on, sinal }], placar: {}, fase, R }
  let V = null              // a visão que este aparelho desenha
  let espera = 0
  let volta = 0
  let batida = 0
  let ultimoSinal = 0
  let escondida = false
  let confirmar = null

  // ---------- conexão ----------
  const disponivel = () => typeof window.Peer === 'function'
  const novoCodigo = () => [0, 1, 2, 3].map(() => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('')
  const codigoGuardado = () => { try { return sessionStorage.getItem('mvd-sala-imp') || '' } catch (e) { return '' } }

  function erro(msg, code) {
    Object.assign(N, { status: 'off', papel: null, erro: msg, code: code || '' })
    I.render()
  }

  function sair(silencioso) {
    const p = peer
    peer = null
    if (conn) try { conn.close() } catch (e) {}
    if (sala) sala.jogadores.forEach((j) => { if (j.conn) try { j.conn.close() } catch (e) {} })
    conn = null
    sala = null
    V = null
    clearTimeout(espera)
    clearTimeout(volta)
    clearInterval(batida)
    if (p) try { p.destroy() } catch (e) {}
    Object.assign(N, { status: 'off', papel: null, erro: '' })
    if (!silencioso) I.render()
  }

  function reconectar(p) {
    clearTimeout(volta)
    volta = setTimeout(() => {
      if (peer !== p || p.destroyed || !p.disconnected) return
      try { p.reconnect() } catch (e) {}
      reconectar(p)
    }, 2500)
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && peer && N.papel === 'host' && peer.disconnected && !peer.destroyed) try { peer.reconnect() } catch (e) {}
  })

  function criar(tentativa = 0) {
    if (!disponivel()) return erro(T().on.semServidor)
    sair(true)
    const code = (tentativa === 0 && codigoGuardado()) || novoCodigo()
    Object.assign(N, { papel: 'host', status: 'creating', code, erro: '' })
    sala = { jogadores: [{ id: MEU_ID, nome: meuNome(), conn: null, on: true, sinal: Date.now() }], placar: {}, fase: 'lobby', R: null }
    I.render()
    const p = new window.Peer(PREFIX + code)
    peer = p
    espera = setTimeout(() => { if (peer === p && N.status === 'creating') { sair(true); erro(T().on.semServidor) } }, 12000)
    p.on('open', () => {
      if (peer !== p) return
      clearTimeout(espera)
      try { sessionStorage.setItem('mvd-sala-imp', code) } catch (e) {}
      N.status = 'hosting'
      I.render()
    })
    p.on('connection', (c) => c.on('open', () => {
      c.on('data', (msg) => doConvidado(c, msg))
      c.on('close', () => caiuConvidado(c))
    }))
    p.on('disconnected', () => { if (peer === p) reconectar(p) })
    p.on('error', (e) => {
      if (peer !== p) return
      if (N.status === 'creating') {
        clearTimeout(espera)
        if (e.type === 'unavailable-id' && tentativa < 4) return criar(tentativa + 1)
        sair(true)
        return erro(T().on.semServidor)
      }
      if (ERROS_SERVIDOR.includes(e.type) || e.type === 'unavailable-id') reconectar(p)
    })
    batida = setInterval(() => {
      if (!sala) return
      for (const j of sala.jogadores) {
        if (!j.conn) continue
        try { j.conn.send({ type: 'ping' }) } catch (e) {}
        if (Date.now() - j.sinal > 10000) caiuConvidado(j.conn)
      }
    }, 3000)
  }

  function doConvidado(c, msg) {
    if (!sala || !msg || typeof msg !== 'object') return
    const j = sala.jogadores.find((x) => x.conn === c)
    if (j) j.sinal = Date.now()
    if (msg.type === 'ping') return
    if (msg.type === 'oi') {
      const id = String(msg.id || '').slice(0, 20)
      const nome = String(msg.nome || '').trim().slice(0, 14)
      let jog = sala.jogadores.find((x) => x.id === id)
      if (!jog) {
        if (!id || sala.jogadores.length >= H.MAX) { try { c.send({ type: 'cheia' }) } catch (e) {} setTimeout(() => c.close(), 300); return }
        jog = { id, nome, conn: c, on: true, sinal: Date.now() }
        sala.jogadores.push(jog)
      } else {
        if (jog.conn && jog.conn !== c) try { jog.conn.close() } catch (e) {}
        Object.assign(jog, { conn: c, on: true, sinal: Date.now(), nome: nome || jog.nome })
      }
      I.render()
    } else if (j && msg.type === 'nome') {
      j.nome = String(msg.nome || '').trim().slice(0, 14)
      I.render()
    } else if (j && msg.type === 'voto') votar(j.id, String(msg.alvo))
  }

  function caiuConvidado(c) {
    if (!sala) return
    const j = sala.jogadores.find((x) => x.conn === c)
    if (!j) return
    j.conn = null
    j.on = false
    try { c.close() } catch (e) {}
    if (sala.fase === 'lobby') sala.jogadores = sala.jogadores.filter((x) => x !== j)
    checarVotos()
    I.render()
  }

  function entrar(raw) {
    const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length !== 4) return erro(T().on.codigoRuim, code)
    if (!disponivel()) return erro(T().on.semServidor, code)
    sair(true)
    Object.assign(N, { papel: 'guest', status: 'joining', code, erro: '' })
    I.render()
    const p = new window.Peer()
    peer = p
    let tentativas = 0
    espera = setTimeout(() => { if (peer === p && N.status === 'joining') { sair(true); erro(T().on.naoConectou, code) } }, 25000)
    const conectar = () => {
      if (peer !== p || N.status !== 'joining') return
      const c = p.connect(PREFIX + code, { reliable: true })
      c.on('open', () => {
        if (peer !== p) return
        clearTimeout(espera)
        conn = c
        ultimoSinal = Date.now()
        N.status = 'connected'
        c.on('data', (msg) => { ultimoSinal = Date.now(); doAnfitriao(msg) })
        c.on('close', () => { if (conn === c) { sair(true); erro(T().on.caiu, code) } })
        c.send({ type: 'oi', id: MEU_ID, nome: meuNome() })
        batida = setInterval(() => {
          if (conn !== c) return
          try { c.send({ type: 'ping' }) } catch (e) {}
          if (Date.now() - ultimoSinal > 10000) { sair(true); erro(T().on.caiu, code) }
        }, 3000)
        I.render()
      })
    }
    p.on('open', conectar)
    p.on('error', (e) => {
      if (peer !== p || N.status === 'connected') return
      // a sala pode estar voltando (quem criou trocou de app por um instante): tenta mais algumas vezes
      if (e.type === 'peer-unavailable' && tentativas < 5) { tentativas += 1; setTimeout(conectar, 3000); return }
      clearTimeout(espera)
      sair(true)
      erro(e.type === 'peer-unavailable' ? T().on.naoAchei(code) : T().on.naoConectou, code)
    })
  }

  function doAnfitriao(msg) {
    if (!msg || typeof msg !== 'object' || msg.type === 'ping') return
    if (msg.type === 'cheia') { sair(true); return erro(T().on.cheia) }
    if (msg.type === 'visao' && msg.v) {
      const antes = V
      V = msg.v
      V.recebida = Date.now()
      if (!antes || antes.fase !== V.fase) {
        if (V.fase === 'cartas') { escondida = false; som('draw') }
        if (V.fase === 'fim' && V.rodada && V.rodada.fim) som(V.rodada.fim.pego || V.rodada.fim.semVotos ? 'win' : 'undo')
        window.scrollTo(0, 0)
      }
      redesenhar()
    }
  }

  // ---------- o jogo (só roda no anfitrião) ----------
  const estaOn = (id) => { const j = sala.jogadores.find((x) => x.id === id); return !!(j && j.on) }
  const ativos = () => sala.jogadores.filter((j) => j.on)

  function distribuir() {
    const ids = ativos().map((j) => j.id)
    // gente de menos (alguém saiu): volta pra sala, que mostra quantos faltam
    if (ids.length < 3) { sala.fase = 'lobby'; sala.R = null; sala.jogadores = ativos(); return }
    sala.R = {
      ...H.sortearPar(), ordem: ids, comeca: ids[H.rand(ids.length)], votos: {}, fim: null,
      impostores: E.shuffle([...ids]).slice(0, H.qtdImpostores(ids.length)),
      relogio: { restante: C.segs * 1000, rodando: false, fimEm: 0 },
    }
    sala.fase = 'cartas'
    escondida = false
    som('draw')
    window.scrollTo(0, 0)
  }

  function votar(id, alvo) {
    const R = sala && sala.R
    if (!R || sala.fase !== 'votos' || !R.ordem.includes(id) || !R.ordem.includes(alvo) || id === alvo) return
    R.votos[id] = alvo
    som('tick')
    checarVotos()
    I.render()
  }
  function checarVotos() {
    const R = sala && sala.R
    if (!R || sala.fase !== 'votos' || !Object.keys(R.votos).length) return
    if (R.ordem.every((id) => !estaOn(id) || id in R.votos)) resolver(false)
  }

  function resolver(semVotos) {
    const R = sala.R
    const lugar = (id) => R.ordem.indexOf(id)
    const votos = R.ordem.map((id) => (id in R.votos ? lugar(R.votos[id]) : null))
    R.fim = H.contar(R.ordem.length, votos, R.impostores.map(lugar), semVotos)
    if (C.votar && !semVotos) R.ordem.forEach((id, i) => { sala.placar[id] = (sala.placar[id] || 0) + R.fim.ganhos[i] })
    pausar()
    sala.fase = 'fim'
    som(R.fim.pego || semVotos ? 'win' : 'undo')
    window.scrollTo(0, 0)
  }

  function pausar() {
    const r = sala && sala.R && sala.R.relogio
    if (r && r.rodando) { r.restante = Math.max(0, r.fimEm - Date.now()); r.rodando = false }
  }
  function alternarRelogio() {
    const r = sala.R.relogio
    if (r.rodando) return pausar()
    if (r.restante <= 0) r.restante = C.segs * 1000
    r.rodando = true
    r.fimEm = Date.now() + r.restante
  }

  // o que cada jogador pode ver
  function visao(id) {
    const R = sala.R
    const v = {
      fase: sala.fase, eu: id, dono: MEU_ID, code: N.code,
      jogadores: sala.jogadores.map((j) => ({ id: j.id, nome: j.nome, on: j.on })),
      cfg: { modo: C.modo, votar: C.votar, tempo: C.tempo, segs: C.segs },
      placar: C.votar ? sala.placar : null,
    }
    if (R) {
      const r = R.relogio
      const dentro = R.ordem.includes(id)
      v.rodada = {
        ordem: R.ordem, comeca: R.comeca, participo: dentro,
        carta: dentro ? { key: R.impostores.includes(id) ? R.diferente : R.comum } : null,
        relogio: { restante: r.rodando ? Math.max(0, r.fimEm - Date.now()) : r.restante, rodando: r.rodando },
        votei: id in R.votos, votaram: Object.keys(R.votos), total: R.ordem.filter(estaOn).length,
        fim: sala.fase === 'fim' ? { ...R.fim, impostores: R.impostores, comum: R.comum, diferente: R.diferente } : null,
      }
    }
    return v
  }

  // ---------- telas ----------
  function redesenhar() {
    const a = document.activeElement
    const id = a && a.id
    let pos = null
    try { pos = a.selectionStart } catch (e) {}
    I.render()
    const n = id && document.getElementById(id)
    if (n && n !== document.activeElement && n.tagName === 'INPUT') {
      n.focus()
      try { if (pos != null) n.setSelectionRange(pos, pos) } catch (e) {}
    }
  }

  const souDono = () => N.papel === 'host'
  function restante() {
    const r = V.rodada.relogio
    return r.rodando ? Math.max(0, r.restante - (Date.now() - V.recebida)) : r.restante
  }
  // retrato do estado pras telas (impostor-online-telas.js)
  const retrato = () => ({ V, N, dono: souDono(), escondida, confirmar, meuNome: meuNome(), restante: V && V.rodada ? restante() : 0 })
  function tela() {
    if (souDono() && sala) { V = visao(MEU_ID); V.recebida = Date.now() }
    return window.ImpostorOnlineTelas.tela(retrato())
  }
  const caixa = () => window.ImpostorOnlineTelas.caixa(retrato())

  // depois de desenhar, o anfitrião manda a visão de cada um
  function depois() {
    if (!souDono() || !sala) return
    for (const j of sala.jogadores) if (j.conn && j.conn.open) try { j.conn.send({ type: 'visao', v: visao(j.id) }) } catch (e) {}
  }

  // relógio: cada aparelho conta sozinho a partir do que o anfitrião mandou
  let ultimoSeg = -1
  setInterval(() => {
    if (!V || !V.rodada || V.fase !== 'dicas') return
    if (souDono() && sala && sala.R.relogio.rodando && Date.now() >= sala.R.relogio.fimEm) { pausar(); sala.R.relogio.restante = 0; I.render() }
    if (!V.rodada.relogio.rodando) return
    const ms = restante()
    const s = Math.ceil(ms / 1000)
    if (s !== ultimoSeg) { if (s <= 5 && s > 0) som('tick'); if (s === 0) som('hammer') }
    ultimoSeg = s
    H.pintarRelogio(ms)
  }, 250)

  // ---------- cliques e digitação ----------
  let tNome = 0
  el.addEventListener('input', (ev) => {
    const id = ev.target.id
    if (id === 'imp-on-codigo') { N.code = ev.target.value.toUpperCase(); return }
    if (id !== 'imp-on-nome' && id !== 'imp-meu-nome') return
    guarda('mvd-imp-nome', ev.target.value.trim().slice(0, 14))
    clearTimeout(tNome)
    tNome = setTimeout(() => {
      if (souDono() && sala) { sala.jogadores[0].nome = meuNome(); redesenhar() }
      else if (conn && conn.open) try { conn.send({ type: 'nome', nome: meuNome() }) } catch (e) {}
    }, 400)
  })

  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-o]')
    if (!b || b.disabled) return
    const a = b.dataset.o
    const v = b.dataset.v
    if (a !== 'revelar') confirmar = null
    if (a === 'criar') { criar(); return }
    if (a === 'entrar') { const c = document.getElementById('imp-on-codigo'); entrar(c ? c.value : N.code); return }
    if (a === 'sair') { sair(false); window.scrollTo(0, 0); return }
    if (a === 'esconder') { escondida = !escondida; redesenhar(); return }
    if (a === 'convite') { convidar(); return }
    if (a === 'votar') {
      if (souDono()) votar(MEU_ID, v)
      else if (conn && conn.open) try { conn.send({ type: 'voto', alvo: v }) } catch (e) {}
      return
    }
    if (!souDono() || !sala) return
    if (a === 'distribuir') distribuir()
    else if (a === 'fase') { if (sala.fase === 'dicas') pausar(); sala.fase = v; window.scrollTo(0, 0) }
    else if (a === 'relogio') alternarRelogio()
    else if (a === 'pular') resolver(true)
    else if (a === 'revelar') { if (confirmar !== 'revelar') confirmar = 'revelar'; else resolver(true) }
    else if (a === 'chute') {
      const f = sala.R.fim
      f.adivinhou = v === '1'
      if (f.adivinhou) { f.ganhos[f.alvo] += 2; const id = sala.R.ordem[f.alvo]; sala.placar[id] = (sala.placar[id] || 0) + 2; som('sold') }
    } else if (a === 'lobby') { sala.fase = 'lobby'; sala.R = null; sala.jogadores = sala.jogadores.filter((j) => j.on) }
    redesenhar()
  })

  function convidar() {
    const o = T().on
    const link = location.origin + location.pathname + '#imp-' + N.code
    const text = o.conviteTxt(link, N.code)
    const out = document.getElementById('imp-convidado')
    const fallback = () => {
      out.innerHTML = `<textarea class="copybox" readonly rows="3">${esc(text)}</textarea>`
      out.querySelector('textarea').select()
    }
    try { navigator.clipboard.writeText(text).then(() => { out.textContent = o.conviteOk }, fallback) } catch (e) { fallback() }
  }

  window.ImpostorOnline = {
    ativo: () => N.status === 'hosting' || N.status === 'connected',
    tela, depois, caixa, entrar,
  }
})()
