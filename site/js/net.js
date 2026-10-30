// Partida online de computador pra computador (WebRTC via PeerJS), sem conta.
// Quem cria a sala é o Jogador 1 e manda no jogo; quem entra é o Jogador 2 e só envia ações.
// Os dois mandam um "ping" a cada 3 s: se um lado some sem avisar, o outro percebe e libera a sala.
(function () {
  const PREFIX = 'mvdraft-v1-'
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const ERROS_SERVIDOR = ['network', 'server-error', 'socket-error', 'socket-closed', 'ssl-unavailable', 'browser-incompatible', 'webrtc']
  let peer = null
  let conn = null
  let batida = 0
  let espera = 0
  let ultimoSinal = 0
  const handlers = { status() {}, message() {} }

  const net = {
    role: null, // 'host' | 'guest' | null
    status: 'off', // 'off' | 'creating' | 'hosting' | 'joining' | 'connected'
    code: '',
    error: '',
    on(name, fn) { handlers[name] = fn },
    available: () => typeof window.Peer === 'function',
  }

  function setStatus(status, extra = {}) {
    Object.assign(net, { status, error: '' }, extra)
    handlers.status(net)
  }

  function newCode() {
    let c = ''
    for (let i = 0; i < 4; i++) c += LETTERS[Math.floor(Math.random() * LETTERS.length)]
    return c
  }
  // a mesma aba reabre a sala com o mesmo código (se a página recarregar, o amigo entra de novo igual)
  function codigoGuardado() { try { return sessionStorage.getItem('mvd-sala') || '' } catch (e) { return '' } }
  function guardarCodigo(c) { try { sessionStorage.setItem('mvd-sala', c) } catch (e) {} }

  function wire(c) {
    conn = c
    ultimoSinal = Date.now()
    c.on('data', (msg) => {
      ultimoSinal = Date.now()
      if (msg && msg.type === 'ping') return
      handlers.message(msg)
    })
    c.on('close', () => caiu(c))
    clearInterval(batida)
    batida = setInterval(() => {
      if (conn !== c) { clearInterval(batida); return }
      try { c.send({ type: 'ping' }) } catch (e) {}
      if (Date.now() - ultimoSinal > 10000) caiu(c)
    }, 3000)
  }

  function caiu(c) {
    if (conn !== c) return
    clearInterval(batida)
    conn = null
    try { c.close() } catch (e) {}
    if (net.role === 'host') setStatus('hosting', { error: 'Seu amigo saiu ou a internet dele caiu. Ele pode entrar de novo com o mesmo código.' })
    else {
      const code = net.code
      leave()
      setStatus('off', { error: 'A conexão com a sala caiu. Toque em Entrar pra tentar de novo.', code })
    }
  }

  function host(attempt = 0) {
    if (!net.available()) return setStatus('off', { error: 'Não deu pra carregar o modo online. Confere a internet e recarrega a página.' })
    leave()
    const code = (attempt === 0 && codigoGuardado()) || newCode()
    net.role = 'host'
    setStatus('creating', { code })
    const p = new window.Peer(PREFIX + code)
    peer = p
    espera = setTimeout(() => {
      if (peer === p && net.status === 'creating') { leave(); setStatus('off', { error: 'Não deu pra criar a sala. Confere a internet e tenta de novo.' }) }
    }, 12000)
    p.on('open', () => {
      if (peer !== p) return
      clearTimeout(espera)
      guardarCodigo(code)
      setStatus('hosting', { code })
    })
    p.on('connection', (c) => {
      c.on('open', () => {
        // já tem alguém de verdade na sala: avisa que está cheia. Se o outro sumiu, quem chegou agora fica no lugar
        if (conn && conn.open && Date.now() - ultimoSinal < 9000) {
          try { c.send({ type: 'full' }) } catch (e) {}
          setTimeout(() => c.close(), 300)
          return
        }
        if (conn) try { conn.close() } catch (e) {}
        wire(c)
        setStatus('connected')
      })
    })
    // perdeu o servidor que apresenta os computadores (acontece quando a aba vai pro fundo, tipo trocar
    // pro WhatsApp pra mandar o código): a sala NÃO fecha, só volta a se registrar com o mesmo código
    p.on('disconnected', () => { if (peer === p) reconectar(p) })
    p.on('error', (e) => {
      if (peer !== p) return
      if (net.status === 'creating') {
        clearTimeout(espera)
        if (e.type === 'unavailable-id' && attempt < 4) return host(attempt + 1)
        leave()
        setStatus('off', { error: 'Sem conexão com o servidor da sala. Confere a internet e tenta de novo.' })
        return
      }
      if (ERROS_SERVIDOR.includes(e.type) || e.type === 'unavailable-id') reconectar(p)
    })
  }

  let volta = 0
  function reconectar(p) {
    clearTimeout(volta)
    volta = setTimeout(() => {
      if (peer !== p || p.destroyed || !p.disconnected) return
      try { p.reconnect() } catch (e) {}
      reconectar(p)
    }, 2500)
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && peer && net.role === 'host' && peer.disconnected && !peer.destroyed) try { peer.reconnect() } catch (e) {}
  })

  function join(raw) {
    if (!net.available()) return setStatus('off', { error: 'Não deu pra carregar o modo online. Confere a internet e recarrega a página.' })
    const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length !== 4) return setStatus('off', { error: 'O código tem 4 letras ou números, tipo VY5X.', code })
    leave()
    net.role = 'guest'
    setStatus('joining', { code })
    const p = new window.Peer()
    peer = p
    let tentativas = 0
    espera = setTimeout(() => {
      if (peer === p && net.status === 'joining') {
        leave()
        setStatus('off', { error: 'Não conectou. Confere o código e se quem criou a sala ainda está com o site aberto.', code })
      }
    }, 25000)
    const conectar = () => {
      if (peer !== p || net.status !== 'joining') return
      const c = p.connect(PREFIX + code, { reliable: true })
      c.on('open', () => {
        if (peer !== p) return
        clearTimeout(espera)
        wire(c)
        setStatus('connected')
      })
    }
    p.on('open', conectar)
    p.on('error', (e) => {
      if (peer !== p || net.status === 'connected') return
      // a sala pode estar voltando (quem criou trocou de app por um instante): tenta mais algumas vezes
      if (e.type === 'peer-unavailable' && tentativas < 5) { tentativas += 1; setTimeout(conectar, 3000); return }
      clearTimeout(espera)
      const msg = e.type === 'peer-unavailable'
        ? `Não achei a sala ${code}. Confere o código com quem criou. A sala some se a página dele fechar ou recarregar.`
        : 'Não deu pra conectar. Tenta de novo.'
      leave()
      setStatus('off', { error: msg, code })
    })
  }

  function leave() {
    const p = peer
    peer = null
    conn = null
    net.role = null
    clearInterval(batida)
    clearTimeout(espera)
    clearTimeout(volta)
    if (p) try { p.destroy() } catch (e) {}
  }

  net.host = () => host(0)
  net.join = join
  net.leave = () => { leave(); setStatus('off') }
  net.send = (msg) => { if (conn && conn.open) try { conn.send(msg) } catch (e) {} }
  net.connected = () => !!(conn && conn.open)

  window.Net = net
})()
