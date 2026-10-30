// Joias do Infinito online: quem cria a sala começa a partida; cada um joga a própria vez no seu aparelho
// e todo mundo assiste a mesa ao vivo (o estalo do Thanos aparece pra todos). Só a espiada da Viúva Negra é secreta.
(function () {
  const Jo = window.Joias
  const R = Jo._
  const { esc, cor } = R
  const el = document.getElementById('joias')
  const sala = window.Sala.nova({ prefixo: 'mvjoias-v1-', chave: 'mvd-sala-joias' })
  const ERROS = {
    servidor: 'Sem conexão com o servidor da sala. Confere a internet.', codigo: 'O código tem 4 letras ou números.',
    naoAchei: 'Não achei essa sala. Confere o código com quem criou.', cheia: 'Essa sala está cheia (6 jogadores).',
    naoConectou: 'Não conectou. Confere o código e se quem criou a sala está com o site aberto.', caiu: 'A sala fechou ou a conexão caiu.',
  }
  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  const meuNome = () => guarda('mvd-imp-nome')
  const MEU_ID = (() => {
    let v = ''
    try { v = sessionStorage.getItem('mvd-joias-id') || '' } catch (e) {}
    if (!v) { v = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mvd-joias-id', v) } catch (e) {} }
    return v
  })()

  let H = null   // anfitrião: { pessoas: [{ id, conn, nome, on }], J, ordem: [ids] }
  let V = null   // o que este aparelho desenha: { eu, dono, code, pessoas, J, ordem }
  let erro = ''
  const souDono = () => sala.st.status === 'hosting' && !!H

  // ---------- sala ----------
  sala.aoStatus = (st) => {
    if (st.status === 'off') { H = null; V = null; erro = st.erro ? ERROS[st.erro] || ERROS.caiu : '' }
    if (st.status === 'hosting' && !H) H = { pessoas: [{ id: MEU_ID, conn: null, nome: meuNome(), on: true }], J: null, ordem: [] }
    if (st.status === 'connected') sala.enviar({ type: 'oi', id: MEU_ID, nome: meuNome() })
    Jo.render()
  }
  sala.aoDados = (msg, de) => {
    if (!msg || typeof msg !== 'object') return
    if (de === 'host') {
      if (msg.type === 'cheia') { sala.sair(); erro = ERROS.cheia; Jo.render(); return }
      if (msg.type === 'visao' && msg.v) { V = msg.v; redesenhar() }
      return
    }
    if (!H) return
    if (msg.type === 'oi') {
      const id = String(msg.id || '').slice(0, 20)
      let p = H.pessoas.find((x) => x.id === id)
      if (!p) {
        if (!id || H.pessoas.length >= 6) { sala.enviar({ type: 'cheia' }, de); setTimeout(() => sala.fechar(de), 300); return }
        p = { id, conn: de, nome: '', on: true }
        H.pessoas.push(p)
      }
      Object.assign(p, { conn: de, on: true, nome: String(msg.nome || '').trim().slice(0, 14) || p.nome })
      Jo.render()
      return
    }
    const p = H.pessoas.find((x) => x.conn === de)
    if (p) acao(p, msg)
  }
  sala.aoSair = (de) => {
    if (!H) return
    const p = H.pessoas.find((x) => x.conn === de)
    if (!p) return
    p.on = false
    p.conn = null
    if (!H.J || H.J.fim) H.pessoas = H.pessoas.filter((x) => x !== p)
    Jo.render()
  }

  // ---------- o jogo (só no anfitrião) ----------
  const nomeDe = (p, i) => (p && p.nome) || `Jogador ${i + 1}`
  function comecar() {
    const on = H.pessoas.filter((x) => x.on)
    if (on.length < 2) return
    H.ordem = on.map((x) => x.id)
    H.J = R.novoJogo(on.map((p, i) => nomeDe(p, i)))
    R.som('draw')
    window.scrollTo(0, 0)
  }
  function acao(p, msg) {
    const J = H.J
    if (msg.type === 'nome') {
      p.nome = String(msg.nome || '').trim().slice(0, 14)
      if (J) { const i = H.ordem.indexOf(p.id); if (i >= 0 && p.nome) J.jogadores[i].nome = p.nome }
    } else if (J && !J.fim && H.ordem[J.vez] === p.id) {
      if (msg.type === 'virar') R.virar(J)
      else if (msg.type === 'parar') R.parar(J)
      else if (msg.type === 'roubar') R.roubar(J, Number(msg.alvo))
      else return
    } else return
    Jo.render()
  }

  // todo mundo vê a mesa inteira; a carta espiada pela Viúva só vai pra quem está jogando
  function visao(id) {
    const v = { eu: id, dono: MEU_ID, code: sala.st.code, pessoas: H.pessoas.map((x) => ({ id: x.id, nome: x.nome, on: x.on })), ordem: H.ordem, J: null }
    // o monte vai só como contagem (ninguém vê a ordem das cartas)
    if (H.J) v.J = { ...H.J, monte: H.J.monte.map(() => ({ t: '?' })), espiada: H.ordem[H.J.vez] === id ? H.J.espiada : null,
      thanos: H.J.monte.filter((c) => c.t === 'thanos').length }
    return v
  }

  // ---------- telas ----------
  function redesenhar() {
    const a = document.activeElement
    const id = a && a.id
    let pos = null
    try { pos = a.selectionStart } catch (e) {}
    Jo.render()
    const n = id && document.getElementById(id)
    if (n && n !== document.activeElement && n.tagName === 'INPUT') { n.focus(); try { if (pos != null) n.setSelectionRange(pos, pos) } catch (e) {} }
  }

  function topo(texto) {
    return `<div class="imp-topo"><span class="hint">${esc(texto)}</span>
      <button class="linkish" type="button" data-jo="sair">${souDono() ? 'Fechar a sala' : 'Sair da sala'}</button></div>`
  }

  function telaSala() {
    const on = V.pessoas.filter((x) => x.on)
    const lista = `<ol class="imp-sala">${V.pessoas.map((p, i) => `<li class="${p.on ? '' : 'fora'}" style="${cor(i)}"><span>${esc(nomeDe(p, i))}</span>
      <small>${[p.id === V.eu ? 'você' : '', p.id === V.dono ? 'criou a sala' : ''].filter(Boolean).join(' · ')}</small></li>`).join('')}</ol>`
    const go = souDono() ? `${on.length < 2 ? '<span class="lbl">Precisa de pelo menos 2 pessoas</span>' : ''}<button class="btn big" type="button" data-jo="comecar"${on.length < 2 ? ' disabled' : ''}>Começar</button>`
      : `<p class="hint">Esperando ${esc(nomeDe(V.pessoas[0], 0))} começar…</p>`
    return `<section class="setup jo">
      ${topo(`Sala ${V.code} · ${on.length} na sala`)}
      <div class="setup-grid">
        <div class="panel rules"><h2>Como jogar</h2>${R.COMO}<div class="field"><span class="lbl">Cartas especiais</span>${R.legenda()}</div></div>
        <div class="panel">
          <h2>Sala ${esc(V.code)}</h2>
          ${souDono() ? `<b class="code">${esc(V.code)}</b><div class="online-row"><button class="btn paper" type="button" data-jo="convite">Copiar convite</button></div>
            <p class="note" id="jo-convidado" role="status"></p>` : ''}
          <label class="imp-meu-nome"><span class="lbl">Seu nome</span><input id="jo-meu-nome" maxlength="14" autocomplete="off" value="${esc(meuNome())}"></label>
          ${lista}<p class="note">De 2 a 6 jogadores. Quem entrar depois joga a próxima partida.</p>
        </div>
      </div>
      <div class="go-row">${go}</div>
    </section>`
  }

  function tela() {
    if (souDono()) V = visao(MEU_ID)
    if (!V) return `<section class="jo-jogo"><p class="hint">Entrando na sala ${esc(sala.st.code)}…</p></section>`
    if (!V.J) return telaSala()
    const J = V.J
    const eu = V.ordem.indexOf(V.eu)
    if (J.fim) {
      return R.telaFim(J, souDono() ? `<button class="btn paper" type="button" data-jo="sala">Voltar pra sala</button><button class="btn big" type="button" data-jo="comecar">Jogar de novo</button>`
        : `<p class="hint">Esperando ${esc(nomeDe(V.pessoas[0], 0))} começar outra partida…</p>`, eu)
    }
    const quem = V.pessoas.find((p) => p.id === V.ordem[J.vez])
    const pular = souDono() && quem && !quem.on ? `<button class="linkish" type="button" data-jo="pular">${esc(J.jogadores[J.vez].nome)} caiu: pular a vez</button>` : ''
    return `<section class="jo-jogo">
      ${topo(eu === J.vez ? 'Sua vez!' : `Vez de ${J.jogadores[J.vez].nome}`)}
      ${R.jogadores(J, eu)}${R.mesa(J, eu === J.vez, 'data-jo')}${pular}</section>`
  }

  // o anfitrião manda a visão de cada um depois de desenhar
  function depois() {
    if (!souDono()) return
    for (const p of H.pessoas) if (p.conn) sala.enviar({ type: 'visao', v: visao(p.id) }, p.conn)
  }

  function caixa() {
    const st = sala.st
    const cancelar = '<button class="linkish" type="button" data-jo="sair">Cancelar</button>'
    if (st.status === 'creating') return `<h2>Jogar online</h2><p>Criando a sala…</p>${cancelar}`
    if (st.status === 'joining') return `<h2>Jogar online</h2><p>Entrando na sala ${esc(st.code)}…</p>${cancelar}`
    return `<h2>Jogar online</h2><p class="note">Cada um no seu celular ou computador, todo mundo vendo a mesa. Ninguém precisa de conta.</p>${erro ? `<p class="neterr">${esc(erro)}</p>` : ''}
      <label class="imp-meu-nome"><span class="lbl">Seu nome</span><input id="jo-on-nome" maxlength="14" autocomplete="off" value="${esc(meuNome())}"></label>
      <div class="online-row"><button class="btn green" type="button" data-jo="criar">Criar sala</button><span class="lbl">ou</span>
        <input id="jo-on-codigo" maxlength="4" autocomplete="off" placeholder="CÓDIGO" aria-label="Código da sala" value="${esc(st.code)}">
        <button class="btn paper" type="button" data-jo="entrar">Entrar</button></div>`
  }

  // ---------- cliques e digitação ----------
  const mandar = (msg) => { if (souDono()) acao(H.pessoas[0], msg); else sala.enviar(msg) }
  let tNome = 0
  el.addEventListener('input', (ev) => {
    const id = ev.target.id
    if (id !== 'jo-on-nome' && id !== 'jo-meu-nome') return
    guarda('mvd-imp-nome', ev.target.value.trim().slice(0, 14))
    clearTimeout(tNome)
    tNome = setTimeout(() => { if (sala.st.status === 'hosting' || sala.st.status === 'connected') mandar({ type: 'nome', nome: meuNome() }) }, 400)
  })
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-jo]')
    if (!b || b.disabled) return
    const a = b.dataset.jo
    if (a === 'criar') { erro = ''; sala.criar(); return }
    if (a === 'entrar') { erro = ''; const c = document.getElementById('jo-on-codigo'); sala.entrar(c ? c.value : sala.st.code); return }
    if (a === 'sair') { sala.sair(); erro = ''; window.scrollTo(0, 0); return }
    if (a === 'convite') { convidar(); return }
    if (a === 'virar' || a === 'parar') { mandar({ type: a }); return }
    if (a === 'roubar') { mandar({ type: 'roubar', alvo: Number(b.dataset.v) }); return }
    if (!souDono()) return
    if (a === 'comecar') comecar()
    else if (a === 'sala') { H.J = null; H.pessoas = H.pessoas.filter((x) => x.on) }
    else if (a === 'pular' && H.J && !H.J.fim) { H.J.pendente = null; H.J.viradas = Math.max(1, H.J.viradas); R.parar(H.J) }
    Jo.render()
  })

  function convidar() {
    const link = location.origin + location.pathname + '#joias-' + sala.st.code
    const text = `Bora jogar Joias do Infinito! Abre esse link que você já entra na minha sala: ${link} (código ${sala.st.code})`
    const out = document.getElementById('jo-convidado')
    const fallback = () => { out.innerHTML = `<textarea class="copybox" readonly rows="3">${esc(text)}</textarea>`; out.querySelector('textarea').select() }
    try { navigator.clipboard.writeText(text).then(() => { out.textContent = 'Convite copiado. É só colar no WhatsApp.' }, fallback) } catch (e) { fallback() }
  }

  window.JoiasOnline = {
    ativo: () => sala.st.status === 'hosting' || sala.st.status === 'connected',
    tela, depois, caixa,
    jogo: () => (V && V.J) || null,
    entrar: (code) => { erro = ''; sala.entrar(code) },
  }
})()
