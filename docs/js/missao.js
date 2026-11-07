// Missão Secreta: rola durante a festa toda. Cada um recebe no celular uma missão com um alvo ("Faça a Duda dizer Wakanda").
// Cumpriu? Aperta "Cumpri!" e o alvo confirma no celular dele. Desconfiou que alguém está atrás de você? "Te peguei!".
// Quem criou a sala é o anfitrião: guarda as missões de todo mundo e manda pra cada um só a dele.
// O anfitrião manda só números e nomes (qual missão, quem fez o quê); cada celular escreve na própria língua.
(function () {
  const V = window.View
  const esc = V.esc
  const X = window.Sfx
  const LISTA = window.MissaoDados
  const el = document.getElementById('missao')
  const sala = window.Sala.nova({ prefixo: 'mvmissao-v1-', chave: 'mvd-sala-missao' })
  const ESPERA = 3 * 60000 // depois de trocar a missão ou acusar errado, 3 min até poder de novo
  const t = (pt, en) => window.Lingua.t(pt, en)
  const ERROS = {
    servidor: () => t('Sem conexão com o servidor da sala. Confere a internet.', 'No connection to the room server. Check your internet.'),
    codigo: () => t('O código tem 4 letras ou números.', 'The code has 4 letters or numbers.'),
    naoAchei: () => t('Não achei essa sala. Confere o código com quem criou.', 'Could not find that room. Check the code with the host.'),
    naoConectou: () => t('Não conectou. Quem criou a sala está com o site aberto?', 'Could not connect. Does the host have the site open?'),
    caiu: () => t('A sala fechou ou a conexão caiu.', 'The room closed or the connection dropped.'),
  }
  // a missão escrita na língua deste aparelho
  const missaoTxt = (i, alvo) => (LISTA[i] ? LISTA[i][window.Lingua.en() ? 2 : 1] : '').replace('{a}', alvo)
  const som = (f, p) => { if (X && X.on) X[f](p) }
  const cor = (i) => `--cor: var(--c${i % 10})`
  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  const MEU_ID = (() => {
    let v = ''
    try { v = sessionStorage.getItem('mvd-missao-id') || '' } catch (e) {}
    if (!v) { v = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mvd-missao-id', v) } catch (e) {} }
    return v
  })()
  const sorteia = (l) => l[Math.floor(Math.random() * l.length)]

  const ui = { nome: guarda('mvd-imp-nome'), codigo: '', erro: '', status: '', ver: false, pegar: false, msg: '', nota: '' }
  let H = null   // anfitrião: { pessoas: [{ id, conn, nome, on, pts, m, trocaAte, pegaAte, nota }], opc, jogo, fim, feed, pedidos, seq, laco }
  let vis = null
  let recebido = 0

  // ---------- anfitrião ----------
  const pessoa = (id) => H.pessoas.find((p) => p.id === id)
  const nomeDe = (id) => { const p = pessoa(id); return p ? p.nome : '?' }

  function novaMissao(p) {
    const outros = H.pessoas.filter((x) => x.on && x.id !== p.id)
    if (!outros.length) { p.m = null; return }
    const alvo = sorteia(outros.filter((x) => !p.m || x.id !== p.m.alvo).concat(outros.length === 1 ? outros : []))
    p.usadas = p.usadas || []
    let i = Math.floor(Math.random() * LISTA.length)
    for (let k = 0; k < 20 && p.usadas.includes(i); k++) i = Math.floor(Math.random() * LISTA.length)
    p.usadas.push(i)
    p.m = { i, alvo: alvo.id, pts: LISTA[i][0] }
  }

  function noticia(e) { H.feed.push({ ...e, n: ++H.seq }); if (H.feed.length > 30) H.feed.shift() }

  function comecar() {
    H.jogo = true
    H.fim = H.opc.min ? Date.now() + H.opc.min * 60000 : 0
    H.feed = []
    H.pedidos = []
    H.cumpridas = []
    H.pessoas.forEach((p) => { p.pts = 0; p.usadas = []; p.trocaAte = 0; p.pegaAte = 0; p.nota = ''; novaMissao(p) })
    noticia({ k: 'comecou' })
    clearInterval(H.laco)
    H.laco = setInterval(() => { if (H && H.jogo && H.fim && Date.now() >= H.fim) encerrar() }, 1000)
    enviarTudo()
  }
  function encerrar() { H.jogo = false; H.acabou = true; clearInterval(H.laco); noticia({ k: 'fim' }); enviarTudo() }

  function visao(p) {
    const base = { code: sala.st.code, dono: p === H.pessoas[0], opc: H.opc, fase: H.jogo ? 'jogo' : H.acabou ? 'fim' : 'sala',
      resta: H.fim ? Math.max(0, H.fim - Date.now()) : null,
      pessoas: H.pessoas.map((x) => ({ id: x.id, nome: x.nome, on: x.on, pts: x.pts || 0, voce: x === p })),
      feed: (H.feed || []).slice(-12), cumpridas: H.acabou ? H.cumpridas : [] }
    if (H.jogo) {
      const agora = Date.now()
      base.meu = { missao: p.m ? { i: p.m.i, pts: p.m.pts, alvo: nomeDe(p.m.alvo) } : null, trocaEm: Math.max(0, p.trocaAte - agora),
        pegaEm: Math.max(0, p.pegaAte - agora), esperando: H.pedidos.some((x) => x.de === p.id), nota: p.nota }
      base.pedidos = H.pedidos.filter((x) => x.alvo === p.id).map((x) => ({ n: x.n, nome: nomeDe(x.de), i: x.m.i, alvo: p.nome }))
      p.nota = ''
    }
    return base
  }
  function enviarTudo() {
    if (!H) return
    for (const p of H.pessoas) if (p.conn && p.on) sala.enviar({ type: 'visao', v: visao(p) }, p.conn)
    receber(visao(H.pessoas[0]))
  }

  function acao(p, msg) {
    if (msg.type === 'nome') { p.nome = String(msg.nome || '').trim().slice(0, 14) || p.nome }
    if (!H.jogo) return enviarTudo()
    const agora = Date.now()
    if (msg.type === 'cumpri' && p.m && !H.pedidos.some((x) => x.de === p.id)) {
      const alvo = pessoa(p.m.alvo)
      if (alvo && alvo.on) H.pedidos.push({ n: ++H.seq, de: p.id, alvo: alvo.id, m: p.m })
      else { novaMissao(p); p.nota = { k: 'saiu' } }
    }
    if (msg.type === 'confirma') {
      const pd = H.pedidos.find((x) => x.n === Number(msg.n) && x.alvo === p.id)
      if (pd) {
        H.pedidos = H.pedidos.filter((x) => x !== pd)
        const quem = pessoa(pd.de)
        if (quem && msg.ok) {
          quem.pts += pd.m.pts
          noticia({ k: 'cumpriu', a: quem.nome, i: pd.m.i, alvo: p.nome, pts: pd.m.pts })
          H.cumpridas.push({ nome: quem.nome, i: pd.m.i, alvo: p.nome, pts: pd.m.pts })
          if (quem.m === pd.m) novaMissao(quem)
          quem.nota = { k: 'cumpriu', pts: pd.m.pts }
        } else if (quem) quem.nota = { k: 'naoRolou', a: p.nome }
      }
    }
    if (msg.type === 'trocar' && agora >= p.trocaAte) { novaMissao(p); p.trocaAte = agora + ESPERA; H.pedidos = H.pedidos.filter((x) => x.de !== p.id) }
    if (msg.type === 'peguei' && agora >= p.pegaAte) {
      const q = pessoa(String(msg.alvo))
      if (q && q !== p) {
        if (q.m && q.m.alvo === p.id) {
          p.pts += 1
          q.pts = Math.max(0, q.pts - 1)
          noticia({ k: 'pegou', a: p.nome, b: q.nome, i: q.m.i, alvo: p.nome })
          H.pedidos = H.pedidos.filter((x) => x.de !== q.id)
          novaMissao(q)
          q.nota = { k: 'pego', a: p.nome }
          p.nota = { k: 'pegou' }
        } else {
          p.pegaAte = agora + ESPERA
          noticia({ k: 'errou', a: p.nome, b: q.nome })
          p.nota = { k: 'errou', a: q.nome }
        }
      }
    }
    enviarTudo()
  }
  const fazer = (msg) => { if (H) acao(H.pessoas[0], msg); else sala.enviar(msg) }

  // ---------- sala ----------
  sala.aoStatus = (st) => {
    if (st.status === 'off') { if (H) clearInterval(H.laco); H = null; vis = null; ui.erro = st.erro ? (ERROS[st.erro] || ERROS.caiu)() : ''; ui.status = '' }
    if (st.status === 'creating' || st.status === 'joining') ui.status = t('Conectando…', 'Connecting…')
    if (st.status === 'hosting' && H) { ui.status = ''; enviarTudo() }
    if (st.status === 'connected') sala.enviar({ type: 'oi', id: MEU_ID, nome: ui.nome })
    render()
  }
  sala.aoDados = (msg, de) => {
    if (!msg || typeof msg !== 'object') return
    if (de === 'host') { if (msg.type === 'visao' && msg.v) receber(msg.v); return }
    if (!H) return
    if (msg.type === 'oi') {
      const id = String(msg.id || '').slice(0, 20)
      if (!id) return
      let p = pessoa(id)
      const novo = !p
      if (!p) {
        if (H.pessoas.length >= 16) { setTimeout(() => sala.fechar(de), 300); return }
        p = { id, pts: 0, trocaAte: 0, pegaAte: 0, nota: '' }
        H.pessoas.push(p)
      }
      Object.assign(p, { conn: de, on: true, nome: String(msg.nome || '').trim().slice(0, 14) || p.nome || 'Agente ' + H.pessoas.length })
      if (H.jogo && novo) noticia({ k: 'entrou', a: p.nome })
      if (H.jogo && !p.m) novaMissao(p)
      H.pessoas.forEach((x) => { if (H.jogo && x.on && !x.m) novaMissao(x) })
      enviarTudo()
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
    if (!H.jogo && !H.acabou) H.pessoas = H.pessoas.filter((x) => x !== p)
    else H.pedidos = H.pedidos.filter((x) => x.alvo !== p.id)
    enviarTudo()
  }

  // ---------- telas ----------
  const relogio = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
  const placar = (v) => `<ol class="bo-rank mi-placar">${[...v.pessoas].map((p, i) => ({ ...p, i })).sort((a, b) => b.pts - a.pts).map((p) =>
    `<li style="${cor(p.i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}${p.voce ? ` <small>(${t('você', 'you')})</small>` : ''}</span><b>${p.pts}</b></li>`).join('')}</ol>`
  // o que rolou, escrito na língua deste aparelho
  function linha(f) {
    const a = esc(f.a || '')
    const b = esc(f.b || '')
    const m = f.i !== undefined ? esc(missaoTxt(f.i, f.alvo || '')) : ''
    if (f.k === 'comecou') return t('Começou! Ninguém confia em ninguém.', 'It started! Trust no one.')
    if (f.k === 'fim') return t('Fim de jogo!', 'Game over!')
    if (f.k === 'cumpriu') return `${a} ${t('cumpriu', 'pulled off')} (+${f.pts}): ${m}`
    if (f.k === 'pegou') return t(`${a} pegou ${b} no flagra! A missão era: ${m}`, `${a} caught ${b} red-handed! The mission was: ${m}`)
    if (f.k === 'errou') return t(`${a} acusou ${b}… e errou feio.`, `${a} accused ${b}… and got it badly wrong.`)
    if (f.k === 'entrou') return t(`${a} entrou na festa.`, `${a} joined the party.`)
    return esc(f.txt || '')
  }
  function recado(n) {
    const a = n.a || ''
    if (n.k === 'saiu') return t('Seu alvo saiu da sala. Aqui vai outra missão.', 'Your target left the room. Here is another mission.')
    if (n.k === 'cumpriu') return t(`Missão cumprida! +${n.pts}`, `Mission accomplished! +${n.pts}`)
    if (n.k === 'naoRolou') return t(`${a} disse que não rolou. Tenta de novo!`, `${a} said it did not happen. Try again!`)
    if (n.k === 'pego') return t(`${a} te pegou! −1. Aqui vai outra missão.`, `${a} caught you! −1. Here is another mission.`)
    if (n.k === 'pegou') return t('Pegou! +1', 'Gotcha! +1')
    if (n.k === 'errou') return t(`${a} não estava atrás de você. Espere 3 min pra acusar de novo.`, `${a} was not after you. Wait 3 min to accuse again.`)
    return ''
  }
  const feed = (v) => `<ol class="mi-feed">${v.feed.slice().reverse().map((f) => `<li>${linha(f)}</li>`).join('')}</ol>`
  const como = () => `<ol class="how">${t(`
    <li>Cada um recebe uma missão secreta com um alvo: "Faça a Duda dizer Wakanda".</li>
    <li>Cumpriu? Aperte <b>Cumpri!</b>. O alvo confirma no celular dele e você ganha os pontos.</li>
    <li>Acha que alguém está te enrolando? <b>Te peguei!</b> Se acertar, ganha 1 e a pessoa perde 1. Se errar, fica 3 min sem poder acusar.</li>
    <li>Joguem normalmente, conversando e fazendo outras coisas. A graça é ninguém perceber.</li>`, `
    <li>Everyone gets a secret mission with a target: "Get Duda to say Wakanda".</li>
    <li>Pulled it off? Hit <b>Done!</b>. The target confirms on their phone and you get the points.</li>
    <li>Think someone is setting you up? <b>Gotcha!</b> If you are right, you get 1 and they lose 1. If you are wrong, you cannot accuse anyone for 3 min.</li>
    <li>Play normally, chatting and doing other things. The fun is that nobody notices.</li>`)}
  </ol>`

  function telaEntrada() {
    return `<section class="setup mi">
      <div class="setup-grid">
        <div class="panel rules"><h2>${t('Agentes, a postos', 'Agents, stand by')}</h2>
          <label class="imp-meu-nome"><span class="lbl">${t('Seu nome', 'Your name')}</span><input id="mi-nome" maxlength="14" autocomplete="off" placeholder="${t('Seu nome', 'Your name')}" value="${esc(ui.nome)}"></label>
          <div class="field"><span class="lbl">${t('Criar uma sala', 'Create a room')}</span><div class="online-row"><button class="btn big" type="button" data-m="criar">${t('Criar sala', 'Create room')}</button></div></div>
          <div class="field"><span class="lbl">${t('Entrar numa sala', 'Join a room')}</span>
            <div class="online-row"><input id="mi-codigo" maxlength="4" autocomplete="off" placeholder="${t('CÓDIGO', 'CODE')}" value="${esc(ui.codigo)}">
              <button class="btn green" type="button" data-m="entrar">${t('Entrar', 'Join')}</button></div>
            ${ui.erro ? `<p class="neterr" role="alert">${esc(ui.erro)}</p>` : ''}${ui.status ? `<p class="note" role="status">${esc(ui.status)}</p>` : ''}</div>
        </div>
        <div class="panel"><h2>${t('Como jogar', 'How to play')}</h2>${como()}<p class="note">${t('Cada um joga no seu celular. Dá pra entrar no meio da festa.', 'Everyone plays on their own phone. You can join midway through the party.')}</p></div>
      </div></section>`
  }

  function telaSala(v) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup mi">
      <div class="imp-topo"><span class="hint">${t('Sala', 'Room')} ${esc(v.code)} · ${n} ${t('agentes', 'agents')}</span><button class="linkish" type="button" data-m="sair">${v.dono ? t('Fechar sala', 'Close room') : t('Sair da sala', 'Leave room')}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? t('Regras', 'Rules') : t('Regras da sala', 'Room rules')}</h2>
          <div class="field"><span class="lbl">${t('Duração', 'Length')}</span><div class="presets">${[15, 30, 60, 0].map((x) =>
            `<button class="preset" type="button" data-m="min" data-v="${x}" aria-pressed="${v.opc.min === x}"${v.dono ? '' : ' disabled'}>${x ? x + ' min' : t('sem fim', 'no end')}</button>`).join('')}</div></div>
          ${como()}</div>
        <div class="panel"><h2>${t('Sala', 'Room')} ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-m="convite">${t('Copiar convite', 'Copy invite')}</button></div>
            <p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <label class="imp-meu-nome"><span class="lbl">${t('Seu nome', 'Your name')}</span><input id="mi-meu-nome" maxlength="14" autocomplete="off" value="${esc(ui.nome)}"></label>
          <ol class="imp-sala">${v.pessoas.map((p, i) => `<li style="${cor(i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}</span><small>${p.voce ? t('você', 'you') : ''}</small></li>`).join('')}</ol>
        </div>
      </div>
      <div class="go-row">${v.dono ? `${n < 3 ? `<span class="lbl">${t('Precisa de 3 ou mais', 'Needs 3 or more')}</span>` : ''}<button class="btn big" type="button" data-m="comecar"${n < 3 ? ' disabled' : ''}>${t('Distribuir missões', 'Hand out missions')}</button>`
        : `<p class="hint">${t('Esperando quem criou a sala começar…', 'Waiting for the host to start…')}</p>`}</div>
    </section>`
  }

  function telaJogo(v) {
    const m = v.meu
    const pedido = v.pedidos && v.pedidos[0]
    const missao = m.missao
      ? `<div class="mi-carta${ui.ver ? ' aberta' : ''}"><span class="mi-carimbo">${t('ultrassecreto', 'top secret')}</span>
          ${ui.ver ? `<p class="mi-txt">${esc(missaoTxt(m.missao.i, m.missao.alvo))}</p><span class="mi-pts">${t('vale', 'worth')} ${m.missao.pts}</span>` : `<p class="mi-txt escondida">${t('Missão escondida', 'Mission hidden')}</p>`}
          <button class="btn paper" type="button" data-m="ver">${ui.ver ? t('Esconder', 'Hide') : t('Ver minha missão', 'See my mission')}</button></div>`
      : `<div class="mi-carta"><p class="mi-txt">${t('Esperando mais gente entrar pra ter um alvo…', 'Waiting for more people to join so you have a target…')}</p></div>`
    return `<section class="mi-jogo">
      <div class="imp-topo"><span class="hint">${t('Sala', 'Room')} ${esc(v.code)}${v.resta !== null ? ` · <b data-x="mi-relogio">${relogio(v.resta)}</b>` : ''}</span>
        <button class="linkish" type="button" data-m="sair">${t('sair', 'leave')}</button></div>
      ${ui.nota ? `<p class="mi-nota" role="status">${esc(recado(ui.nota))}</p>` : ''}
      ${missao}
      <div class="mi-botoes">
        <button class="btn big green" type="button" data-m="cumpri"${!m.missao || m.esperando ? ' disabled' : ''}>${m.esperando ? t('Esperando o alvo…', 'Waiting for the target…') : t('Cumpri!', 'Done!')}</button>
        <button class="btn red" type="button" data-m="pegar"${m.pegaEm ? ' disabled' : ''}>${m.pegaEm ? `${t('Te peguei!', 'Gotcha!')} (${relogio(m.pegaEm)})` : t('Te peguei!', 'Gotcha!')}</button>
        <button class="btn paper" type="button" data-m="trocar"${m.trocaEm ? ' disabled' : ''}>${m.trocaEm ? `${t('Trocar', 'Swap')} (${relogio(m.trocaEm)})` : t('Trocar missão', 'Swap mission')}</button>
      </div>
      ${ui.pegar ? `<div class="panel bo-painel"><span class="lbl">${t('Quem está tentando uma missão em você?', 'Who is running a mission on you?')}</span>
        <div class="bo-escolhe">${v.pessoas.map((p, i) => (p.voce || !p.on ? '' : `<button class="preset" type="button" data-m="peguei" data-v="${esc(p.id)}" style="${cor(i)}">${esc(p.nome)}</button>`)).join('')}</div>
        <button class="linkish" type="button" data-m="pegar">${t('cancelar', 'cancel')}</button></div>` : ''}
      <div class="setup-grid mi-baixo"><div class="panel"><h2>${t('Placar', 'Score')}</h2>${placar(v)}${v.dono ? `<button class="linkish" type="button" data-m="encerrar">${t('encerrar o jogo', 'end the game')}</button>` : ''}</div>
        <div class="panel"><h2>${t('O que rolou', 'What happened')}</h2>${feed(v)}</div></div>
      ${pedido ? `<div class="bo-denuncia mi-pedido" role="dialog"><div><span class="lbl">${t('confirmação', 'confirmation')}</span>
        <p><b>${esc(pedido.nome)}</b> ${t('diz que cumpriu uma missão em você:', 'says they pulled off a mission on you:')}</p><h3>${esc(missaoTxt(pedido.i, pedido.alvo))}</h3>
        <div class="online-row"><button class="btn big green" type="button" data-m="confirma" data-v="${pedido.n}" data-ok="1">${t('Foi mesmo', 'It happened')}</button>
          <button class="btn paper" type="button" data-m="confirma" data-v="${pedido.n}" data-ok="0">${t('Não foi', 'It did not')}</button></div></div></div>` : ''}
    </section>`
  }

  function telaFim(v) {
    return `<section class="bo-fim"><div class="panel bo-fim-box"><span class="lbl">${t('Missões encerradas', 'Missions over')}</span><h2>${t('Placar final', 'Final score')}</h2>${placar(v)}
      ${v.cumpridas.length ? `<span class="lbl">${t('Missões cumpridas', 'Missions accomplished')}</span><ol class="mi-feed">${v.cumpridas.map((c) => `<li><b>${esc(c.nome)}</b> (+${c.pts}): ${esc(missaoTxt(c.i, c.alvo))}</li>`).join('')}</ol>` : ''}
      <div class="online-row">${v.dono ? `<button class="btn big" type="button" data-m="comecar">${t('Jogar de novo', 'Play again')}</button>` : ''}<button class="linkish" type="button" data-m="sair">${t('sair', 'leave')}</button></div></div></section>`
  }

  function receber(v) {
    const antes = vis
    vis = v
    recebido = performance.now()
    // o recado (cumpriu, foi pego, errou) fica uns segundos na tela mesmo que chegue outra mensagem
    if (v.meu && v.meu.nota) {
      ui.nota = v.meu.nota
      som(['cumpriu', 'pegou'].includes(v.meu.nota.k) ? 'sold' : 'undo')
      if (v.meu.nota.k === 'pegou') if (window.Uatu) window.Uatu.momento('missao-pegou')
      clearTimeout(ui._nt)
      ui._nt = setTimeout(() => { ui.nota = ''; render() }, 7000)
    }
    if (v.pedidos && v.pedidos.length && !(antes && antes.pedidos && antes.pedidos.length)) { som('draw'); try { if (navigator.vibrate) navigator.vibrate([80, 60, 80]) } catch (e) {} }
    render()
  }

  function render() {
    if (!vis) { el.innerHTML = telaEntrada(); return }
    if (vis.fase === 'sala') { el.innerHTML = telaSala(vis); return }
    if (vis.fase === 'fim') { el.innerHTML = telaFim(vis); return }
    el.innerHTML = telaJogo(vis)
  }
  // o relógio anda sozinho entre uma mensagem e outra
  setInterval(() => {
    const r = el.querySelector('[data-x="mi-relogio"]')
    if (r && vis && vis.resta !== null) r.textContent = relogio(Math.max(0, vis.resta - (performance.now() - recebido)))
  }, 1000)

  function sair() { if (H) clearInterval(H.laco); H = null; if (sala.st.status !== 'off') sala.sair(); vis = null; ui.ver = false; ui.pegar = false; render() }

  const acoes = {
    criar: () => { H = { pessoas: [{ id: MEU_ID, conn: null, nome: ui.nome || t('Agente 1', 'Agent 1'), on: true, pts: 0 }], opc: { min: 30 }, jogo: false, feed: [], pedidos: [], seq: 0 }; ui.erro = ''; sala.criar() },
    entrar: () => { ui.codigo = (document.getElementById('mi-codigo') || {}).value || ''; ui.erro = ''; sala.entrar(ui.codigo) },
    min: (v) => { if (H && !H.jogo) { H.opc.min = Number(v); enviarTudo() } },
    convite: () => {
      const link = location.origin + location.pathname + '#missao-' + sala.st.code
      const ok = () => { ui.msg = t('Convite copiado! Manda pros amigos.', 'Invite copied! Send it to your friends.'); render() }
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(ok, () => { ui.msg = link; render() })
      else { ui.msg = link; render() }
    },
    comecar: () => { if (H && H.pessoas.filter((p) => p.on).length >= 3) { H.acabou = false; ui.ver = false; comecar(); som('draw') } },
    encerrar: () => { if (H && H.jogo) encerrar() },
    ver: () => { ui.ver = !ui.ver; render() },
    cumpri: () => fazer({ type: 'cumpri' }),
    trocar: () => { fazer({ type: 'trocar' }); ui.ver = false },
    pegar: () => { ui.pegar = !ui.pegar; render() },
    peguei: (v) => { ui.pegar = false; fazer({ type: 'peguei', alvo: v }) },
    confirma: (v, b) => fazer({ type: 'confirma', n: Number(v), ok: b.dataset.ok === '1' }),
    sair: () => sair(),
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-m]')
    if (!b || b.disabled || !acoes[b.dataset.m]) return
    acoes[b.dataset.m](b.dataset.v, b)
  })
  el.addEventListener('input', (ev) => {
    if (ev.target.id === 'mi-nome' || ev.target.id === 'mi-meu-nome') {
      ui.nome = ev.target.value.slice(0, 14)
      guarda('mvd-imp-nome', ui.nome)
      if (ev.target.id === 'mi-meu-nome') { clearTimeout(ui._n); ui._n = setTimeout(() => fazer({ type: 'nome', nome: ui.nome }), 400) }
    }
    if (ev.target.id === 'mi-codigo') ui.codigo = ev.target.value
  })
  el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.id === 'mi-codigo') acoes.entrar() })

  // trocou a língua: redesenha (o jogo não muda, só a escrita)
  window.Lingua.aoMudar(() => { if (!el.hidden) render() })

  let pronto = null
  window.Missao = {
    letreiro: () => [t('Missão <em>Secreta</em>', 'Secret <em>Mission</em>'), t('cumpra a sua sem ninguém perceber', 'pull yours off without anyone noticing')],
    abrir() { ui.nome = guarda('mvd-imp-nome') || ui.nome; if (!pronto) pronto = V.load(); pronto.then(render) },
    entrar(code) { ui.codigo = code; if (!pronto) pronto = V.load(); pronto.then(() => sala.entrar(code)) },
  }
})()
