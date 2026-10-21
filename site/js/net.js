// Partida online de computador pra computador (WebRTC via PeerJS), sem conta.
// Quem cria a sala é o Jogador 1 e manda no jogo; quem entra é o Jogador 2 e só envia ações.
(function () {
  const PREFIX = 'mvdraft-v1-'
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let peer = null
  let conn = null
  const handlers = { status() {}, message() {} }

  const net = {
    role: null, // 'host' | 'guest' | null
    status: 'off',
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

  function wire(c) {
    conn = c
    c.on('data', (msg) => handlers.message(msg))
    c.on('close', () => {
      if (conn !== c) return
      conn = null
      if (net.role === 'host') setStatus('hosting', { error: 'Seu amigo saiu. Ele pode entrar de novo com o mesmo código.' })
      else { leave(); setStatus('off', { error: 'A conexão com a sala caiu.' }) }
    })
  }

  function host(attempt = 0) {
    if (!net.available()) return setStatus('off', { error: 'Não deu pra carregar o modo online. Confere a internet.' })
    leave()
    const code = newCode()
    net.role = 'host'
    setStatus('hosting', { code })
    peer = new window.Peer(PREFIX + code)
    peer.on('connection', (c) => {
      if (conn && conn.open) { c.on('open', () => { c.send({ type: 'full' }); setTimeout(() => c.close(), 300) }); return }
      c.on('open', () => { wire(c); setStatus('connected') })
    })
    peer.on('error', (e) => {
      if (e.type === 'unavailable-id' && attempt < 3) return host(attempt + 1)
      if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') setStatus('off', { error: 'Sem conexão com o servidor da sala. Tenta de novo.' })
    })
  }

  function join(raw) {
    if (!net.available()) return setStatus('off', { error: 'Não deu pra carregar o modo online. Confere a internet.' })
    const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length !== 4) return setStatus('off', { error: 'O código tem 4 letras/números.' })
    leave()
    net.role = 'guest'
    setStatus('joining', { code })
    peer = new window.Peer()
    peer.on('open', () => {
      const c = peer.connect(PREFIX + code, { reliable: true })
      c.on('open', () => { wire(c); setStatus('connected') })
    })
    peer.on('error', (e) => {
      const msg = e.type === 'peer-unavailable' ? 'Não achei essa sala. Confere o código.' : 'Não deu pra conectar. Tenta de novo.'
      leave()
      setStatus('off', { error: msg })
    })
  }

  function leave() {
    const p = peer
    peer = null
    conn = null
    net.role = null
    if (p) try { p.destroy() } catch (e) {}
  }

  net.host = () => host(0)
  net.join = join
  net.leave = () => { leave(); setStatus('off') }
  net.send = (msg) => { if (conn && conn.open) try { conn.send(msg) } catch (e) {} }
  net.connected = () => !!(conn && conn.open)

  window.Net = net
})()
