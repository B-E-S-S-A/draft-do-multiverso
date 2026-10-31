// Sala online genérica (PeerJS, sem conta): quem cria é o anfitrião e recebe várias conexões; quem entra fala só com ele.
// Cuida do que é chato: código de 4 letras, reabrir com o mesmo código, reconectar quando a aba vai pro fundo,
// tentar de novo enquanto a sala volta e um "ping" a cada 3 s pra perceber quem caiu.
//   const s = Sala.nova({ prefixo: 'mvshield-v1-', chave: 'mvd-sala-shield' })
//   s.aoStatus = (st) => {}   // st = { status: off|creating|hosting|joining|connected, code, erro }
//   s.aoDados = (msg, de) => {} // de = id da conexão (no anfitrião) ou 'host' (no convidado)
//   s.aoSair = (de) => {}       // anfitrião: alguém saiu ou caiu
//   s.criar(); s.entrar(code); s.sair(); s.enviar(msg, para) // para = id (anfitrião) ou nada (todos / o anfitrião)
(function () {
  const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const SERVIDOR = ['network', 'server-error', 'socket-error', 'socket-closed', 'ssl-unavailable', 'browser-incompatible', 'webrtc']

  function nova({ prefixo, chave }) {
    const st = { status: 'off', code: '', erro: '' }
    const conns = new Map() // anfitrião: id -> { c, sinal }
    let peer = null
    let host = null         // convidado: a conexão com o anfitrião
    let sinalHost = 0
    let espera = 0
    let volta = 0
    let batida = 0
    let seq = 0
    const s = { aoStatus() {}, aoDados() {}, aoSair() {}, st }

    const mudar = (status, extra = {}) => { Object.assign(st, { status, erro: '' }, extra); s.aoStatus(st) }
    const novoCodigo = () => [0, 1, 2, 3].map(() => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('')
    const guardado = () => { try { return sessionStorage.getItem(chave) || '' } catch (e) { return '' } }
    const disponivel = () => typeof window.Peer === 'function'

    function limpar() {
      const p = peer
      peer = null
      for (const { c } of conns.values()) try { c.close() } catch (e) {}
      conns.clear()
      if (host) try { host.close() } catch (e) {}
      host = null
      clearTimeout(espera)
      clearTimeout(volta)
      clearInterval(batida)
      if (p) try { p.destroy() } catch (e) {}
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
      if (!document.hidden && peer && st.status === 'hosting' && peer.disconnected && !peer.destroyed) try { peer.reconnect() } catch (e) {}
    })

    function caiu(id) {
      const x = conns.get(id)
      if (!x) return
      conns.delete(id)
      try { x.c.close() } catch (e) {}
      s.aoSair(id)
    }

    s.criar = (tentativa = 0) => {
      if (!disponivel()) return mudar('off', { erro: 'servidor' })
      limpar()
      const code = (tentativa === 0 && guardado()) || novoCodigo()
      mudar('creating', { code })
      const p = new window.Peer(prefixo + code)
      peer = p
      espera = setTimeout(() => { if (peer === p && st.status === 'creating') { limpar(); mudar('off', { erro: 'servidor' }) } }, 12000)
      p.on('open', () => {
        if (peer !== p) return
        clearTimeout(espera)
        try { sessionStorage.setItem(chave, code) } catch (e) {}
        mudar('hosting', { code })
      })
      p.on('connection', (c) => c.on('open', () => {
        const id = 'c' + (++seq)
        conns.set(id, { c, sinal: Date.now() })
        c.on('data', (msg) => {
          const x = conns.get(id)
          if (x) x.sinal = Date.now()
          if (msg && msg.type !== 'ping') s.aoDados(msg, id)
        })
        c.on('close', () => caiu(id))
      }))
      p.on('disconnected', () => { if (peer === p) reconectar(p) })
      p.on('error', (e) => {
        if (peer !== p) return
        if (st.status === 'creating') {
          clearTimeout(espera)
          if (e.type === 'unavailable-id' && tentativa < 4) return s.criar(tentativa + 1)
          limpar()
          return mudar('off', { erro: 'servidor' })
        }
        if (SERVIDOR.includes(e.type) || e.type === 'unavailable-id') reconectar(p)
      })
      batida = setInterval(() => {
        for (const [id, x] of conns) {
          try { x.c.send({ type: 'ping' }) } catch (e) {}
          if (Date.now() - x.sinal > 10000) caiu(id)
        }
      }, 3000)
    }

    s.entrar = (raw) => {
      const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (code.length !== 4) return mudar('off', { erro: 'codigo', code })
      if (!disponivel()) return mudar('off', { erro: 'servidor', code })
      limpar()
      mudar('joining', { code })
      const p = new window.Peer()
      peer = p
      let tentativas = 0
      espera = setTimeout(() => { if (peer === p && st.status === 'joining') { limpar(); mudar('off', { erro: 'naoConectou', code }) } }, 25000)
      const conectar = () => {
        if (peer !== p || st.status !== 'joining') return
        const c = p.connect(prefixo + code, { reliable: true })
        c.on('open', () => {
          if (peer !== p) return
          clearTimeout(espera)
          host = c
          sinalHost = Date.now()
          c.on('data', (msg) => { sinalHost = Date.now(); if (msg && msg.type !== 'ping') s.aoDados(msg, 'host') })
          c.on('close', () => { if (host === c) { limpar(); mudar('off', { erro: 'caiu', code }) } })
          batida = setInterval(() => {
            if (host !== c) return
            try { c.send({ type: 'ping' }) } catch (e) {}
            if (Date.now() - sinalHost > 10000) { limpar(); mudar('off', { erro: 'caiu', code }) }
          }, 3000)
          mudar('connected', { code })
        })
      }
      p.on('open', conectar)
      p.on('error', (e) => {
        if (peer !== p || st.status === 'connected') return
        if (e.type === 'peer-unavailable' && tentativas < 5) { tentativas += 1; setTimeout(conectar, 3000); return }
        clearTimeout(espera)
        limpar()
        mudar('off', { erro: e.type === 'peer-unavailable' ? 'naoAchei' : 'naoConectou', code })
      })
    }

    s.sair = () => { limpar(); mudar('off', { code: st.code }) }
    s.enviar = (msg, para) => {
      if (host) { if (host.open) try { host.send(msg) } catch (e) {} return }
      for (const [id, x] of conns) {
        if (para && id !== para) continue
        if (x.c.open) try { x.c.send(msg) } catch (e) {}
      }
    }
    s.fechar = (id) => caiu(id)
    s.ids = () => [...conns.keys()]
    return s
  }

  window.Sala = { nova }
})()
