// Missão Secreta: rola durante a festa toda. Cada um recebe no celular uma missão com um alvo ("Faça a Duda dizer Wakanda").
// Cumpriu? Aperta "Cumpri!" e o alvo confirma no celular dele. Desconfiou que alguém está atrás de você? "Te peguei!".
// Quem criou a sala é o anfitrião: guarda as missões de todo mundo e manda pra cada um só a dele.
(function () {
  const V = window.View
  const esc = V.esc
  const X = window.Sfx
  const LISTA = window.MissaoDados
  const el = document.getElementById('missao')
  const sala = window.Sala.nova({ prefixo: 'mvmissao-v1-', chave: 'mvd-sala-missao' })
  const ESPERA = 3 * 60000 // depois de trocar a missão ou acusar errado, 3 min até poder de novo
  const ERROS = {
    servidor: 'Sem conexão com o servidor da sala. Confere a internet.', codigo: 'O código tem 4 letras ou números.',
    naoAchei: 'Não achei essa sala. Confere o código com quem criou.', naoConectou: 'Não conectou. Quem criou a sala está com o site aberto?',
    caiu: 'A sala fechou ou a conexão caiu.',
  }
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
  const texto = (m) => LISTA[m.i][1].replace('{a}', nomeDe(m.alvo))

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

  function noticia(txt) { H.feed.push({ txt, n: ++H.seq }); if (H.feed.length > 30) H.feed.shift() }

  function comecar() {
    H.jogo = true
    H.fim = H.opc.min ? Date.now() + H.opc.min * 60000 : 0
    H.feed = []
    H.pedidos = []
    H.cumpridas = []
    H.pessoas.forEach((p) => { p.pts = 0; p.usadas = []; p.trocaAte = 0; p.pegaAte = 0; p.nota = ''; novaMissao(p) })
    noticia('Começou! Ninguém confia em ninguém.')
    clearInterval(H.laco)
    H.laco = setInterval(() => { if (H && H.jogo && H.fim && Date.now() >= H.fim) encerrar() }, 1000)
    enviarTudo()
  }
  function encerrar() { H.jogo = false; H.acabou = true; clearInterval(H.laco); noticia('Fim de jogo!'); enviarTudo() }

  function visao(p) {
    const base = { code: sala.st.code, dono: p === H.pessoas[0], opc: H.opc, fase: H.jogo ? 'jogo' : H.acabou ? 'fim' : 'sala',
      resta: H.fim ? Math.max(0, H.fim - Date.now()) : null,
      pessoas: H.pessoas.map((x) => ({ id: x.id, nome: x.nome, on: x.on, pts: x.pts || 0, voce: x === p })),
      feed: (H.feed || []).slice(-12), cumpridas: H.acabou ? H.cumpridas : [] }
    if (H.jogo) {
      const agora = Date.now()
      base.meu = { missao: p.m ? { txt: texto(p.m), pts: p.m.pts, alvo: nomeDe(p.m.alvo) } : null, trocaEm: Math.max(0, p.trocaAte - agora),
        pegaEm: Math.max(0, p.pegaAte - agora), esperando: H.pedidos.some((x) => x.de === p.id), nota: p.nota }
      base.pedidos = H.pedidos.filter((x) => x.alvo === p.id).map((x) => ({ n: x.n, nome: nomeDe(x.de), txt: x.txt }))
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
      if (alvo && alvo.on) H.pedidos.push({ n: ++H.seq, de: p.id, alvo: alvo.id, txt: texto(p.m), m: p.m })
      else { novaMissao(p); p.nota = 'Seu alvo saiu da sala. Aqui vai outra missão.' }
    }
    if (msg.type === 'confirma') {
      const pd = H.pedidos.find((x) => x.n === Number(msg.n) && x.alvo === p.id)
      if (pd) {
        H.pedidos = H.pedidos.filter((x) => x !== pd)
        const quem = pessoa(pd.de)
        if (quem && msg.ok) {
          quem.pts += pd.m.pts
          noticia(`${quem.nome} cumpriu (+${pd.m.pts}): ${pd.txt}`)
          H.cumpridas.push({ nome: quem.nome, txt: pd.txt, pts: pd.m.pts })
          if (quem.m === pd.m) novaMissao(quem)
          quem.nota = `Missão cumprida! +${pd.m.pts}`
        } else if (quem) quem.nota = `${p.nome} disse que não rolou. Tenta de novo!`
      }
    }
    if (msg.type === 'trocar' && agora >= p.trocaAte) { novaMissao(p); p.trocaAte = agora + ESPERA; H.pedidos = H.pedidos.filter((x) => x.de !== p.id) }
    if (msg.type === 'peguei' && agora >= p.pegaAte) {
      const q = pessoa(String(msg.alvo))
      if (q && q !== p) {
        if (q.m && q.m.alvo === p.id) {
          p.pts += 1
          q.pts = Math.max(0, q.pts - 1)
          noticia(`${p.nome} pegou ${q.nome} no flagra! A missão era: ${texto(q.m)}`)
          H.pedidos = H.pedidos.filter((x) => x.de !== q.id)
          novaMissao(q)
          q.nota = `${p.nome} te pegou! −1. Aqui vai outra missão.`
          p.nota = 'Pegou! +1'
        } else {
          p.pegaAte = agora + ESPERA
          noticia(`${p.nome} acusou ${q.nome}… e errou feio.`)
          p.nota = `${q.nome} não estava atrás de você. Espere 3 min pra acusar de novo.`
        }
      }
    }
    enviarTudo()
  }
  const fazer = (msg) => { if (H) acao(H.pessoas[0], msg); else sala.enviar(msg) }

  // ---------- sala ----------
  sala.aoStatus = (st) => {
    if (st.status === 'off') { if (H) clearInterval(H.laco); H = null; vis = null; ui.erro = st.erro ? ERROS[st.erro] || ERROS.caiu : ''; ui.status = '' }
    if (st.status === 'creating' || st.status === 'joining') ui.status = 'Conectando…'
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
      if (!p) {
        if (H.pessoas.length >= 16) { setTimeout(() => sala.fechar(de), 300); return }
        p = { id, pts: 0, trocaAte: 0, pegaAte: 0, nota: '' }
        H.pessoas.push(p)
        if (H.jogo) noticia(`${String(msg.nome || 'Alguém').slice(0, 14)} entrou na festa.`)
      }
      Object.assign(p, { conn: de, on: true, nome: String(msg.nome || '').trim().slice(0, 14) || p.nome || 'Agente ' + H.pessoas.length })
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
    `<li style="${cor(p.i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}${p.voce ? ' <small>(você)</small>' : ''}</span><b>${p.pts}</b></li>`).join('')}</ol>`
  const feed = (v) => `<ol class="mi-feed">${v.feed.slice().reverse().map((f) => `<li>${esc(f.txt)}</li>`).join('')}</ol>`
  const como = `<ol class="how">
    <li>Cada um recebe uma missão secreta com um alvo: "Faça a Duda dizer Wakanda".</li>
    <li>Cumpriu? Aperte <b>Cumpri!</b>. O alvo confirma no celular dele e você ganha os pontos.</li>
    <li>Acha que alguém está te enrolando? <b>Te peguei!</b> Se acertar, ganha 1 e a pessoa perde 1. Se errar, fica 3 min sem poder acusar.</li>
    <li>Joguem normalmente, conversando e fazendo outras coisas. A graça é ninguém perceber.</li>
  </ol>`

  function telaEntrada() {
    return `<section class="setup mi">
      <div class="setup-grid">
        <div class="panel rules"><h2>Agentes, a postos</h2>
          <label class="imp-meu-nome"><span class="lbl">Seu nome</span><input id="mi-nome" maxlength="14" autocomplete="off" placeholder="Seu nome" value="${esc(ui.nome)}"></label>
          <div class="field"><span class="lbl">Criar uma sala</span><div class="online-row"><button class="btn big" type="button" data-m="criar">Criar sala</button></div></div>
          <div class="field"><span class="lbl">Entrar numa sala</span>
            <div class="online-row"><input id="mi-codigo" maxlength="4" autocomplete="off" placeholder="CÓDIGO" value="${esc(ui.codigo)}">
              <button class="btn green" type="button" data-m="entrar">Entrar</button></div>
            ${ui.erro ? `<p class="neterr" role="alert">${esc(ui.erro)}</p>` : ''}${ui.status ? `<p class="note" role="status">${esc(ui.status)}</p>` : ''}</div>
        </div>
        <div class="panel"><h2>Como jogar</h2>${como}<p class="note">Cada um joga no seu celular. Dá pra entrar no meio da festa.</p></div>
      </div></section>`
  }

  function telaSala(v) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup mi">
      <div class="imp-topo"><span class="hint">Sala ${esc(v.code)} · ${n} agentes</span><button class="linkish" type="button" data-m="sair">${v.dono ? 'Fechar sala' : 'Sair da sala'}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? 'Regras' : 'Regras da sala'}</h2>
          <div class="field"><span class="lbl">Duração</span><div class="presets">${[15, 30, 60, 0].map((x) =>
            `<button class="preset" type="button" data-m="min" data-v="${x}" aria-pressed="${v.opc.min === x}"${v.dono ? '' : ' disabled'}>${x ? x + ' min' : 'sem fim'}</button>`).join('')}</div></div>
          ${como}</div>
        <div class="panel"><h2>Sala ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-m="convite">Copiar convite</button></div>
            <p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <label class="imp-meu-nome"><span class="lbl">Seu nome</span><input id="mi-meu-nome" maxlength="14" autocomplete="off" value="${esc(ui.nome)}"></label>
          <ol class="imp-sala">${v.pessoas.map((p, i) => `<li style="${cor(i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}</span><small>${p.voce ? 'você' : ''}</small></li>`).join('')}</ol>
        </div>
      </div>
      <div class="go-row">${v.dono ? `${n < 3 ? '<span class="lbl">Precisa de 3 ou mais</span>' : ''}<button class="btn big" type="button" data-m="comecar"${n < 3 ? ' disabled' : ''}>Distribuir missões</button>`
        : '<p class="hint">Esperando quem criou a sala começar…</p>'}</div>
    </section>`
  }

  function telaJogo(v) {
    const m = v.meu
    const pedido = v.pedidos && v.pedidos[0]
    const missao = m.missao
      ? `<div class="mi-carta${ui.ver ? ' aberta' : ''}"><span class="mi-carimbo">ultrassecreto</span>
          ${ui.ver ? `<p class="mi-txt">${esc(m.missao.txt)}</p><span class="mi-pts">vale ${m.missao.pts}</span>` : '<p class="mi-txt escondida">Missão escondida</p>'}
          <button class="btn paper" type="button" data-m="ver">${ui.ver ? 'Esconder' : 'Ver minha missão'}</button></div>`
      : '<div class="mi-carta"><p class="mi-txt">Esperando mais gente entrar pra ter um alvo…</p></div>'
    return `<section class="mi-jogo">
      <div class="imp-topo"><span class="hint">Sala ${esc(v.code)}${v.resta !== null ? ` · <b data-x="mi-relogio">${relogio(v.resta)}</b>` : ''}</span>
        <button class="linkish" type="button" data-m="sair">sair</button></div>
      ${ui.nota ? `<p class="mi-nota" role="status">${esc(ui.nota)}</p>` : ''}
      ${missao}
      <div class="mi-botoes">
        <button class="btn big green" type="button" data-m="cumpri"${!m.missao || m.esperando ? ' disabled' : ''}>${m.esperando ? 'Esperando o alvo…' : 'Cumpri!'}</button>
        <button class="btn red" type="button" data-m="pegar"${m.pegaEm ? ' disabled' : ''}>${m.pegaEm ? `Te peguei! (${relogio(m.pegaEm)})` : 'Te peguei!'}</button>
        <button class="btn paper" type="button" data-m="trocar"${m.trocaEm ? ' disabled' : ''}>${m.trocaEm ? `Trocar (${relogio(m.trocaEm)})` : 'Trocar missão'}</button>
      </div>
      ${ui.pegar ? `<div class="panel bo-painel"><span class="lbl">Quem está tentando uma missão em você?</span>
        <div class="bo-escolhe">${v.pessoas.map((p, i) => (p.voce || !p.on ? '' : `<button class="preset" type="button" data-m="peguei" data-v="${esc(p.id)}" style="${cor(i)}">${esc(p.nome)}</button>`)).join('')}</div>
        <button class="linkish" type="button" data-m="pegar">cancelar</button></div>` : ''}
      <div class="setup-grid mi-baixo"><div class="panel"><h2>Placar</h2>${placar(v)}${v.dono ? '<button class="linkish" type="button" data-m="encerrar">encerrar o jogo</button>' : ''}</div>
        <div class="panel"><h2>O que rolou</h2>${feed(v)}</div></div>
      ${pedido ? `<div class="bo-denuncia mi-pedido" role="dialog"><div><span class="lbl">confirmação</span>
        <p><b>${esc(pedido.nome)}</b> diz que cumpriu uma missão em você:</p><h3>${esc(pedido.txt)}</h3>
        <div class="online-row"><button class="btn big green" type="button" data-m="confirma" data-v="${pedido.n}" data-ok="1">Foi mesmo</button>
          <button class="btn paper" type="button" data-m="confirma" data-v="${pedido.n}" data-ok="0">Não foi</button></div></div></div>` : ''}
    </section>`
  }

  function telaFim(v) {
    return `<section class="bo-fim"><div class="panel bo-fim-box"><span class="lbl">Missões encerradas</span><h2>Placar final</h2>${placar(v)}
      ${v.cumpridas.length ? `<span class="lbl">Missões cumpridas</span><ol class="mi-feed">${v.cumpridas.map((c) => `<li><b>${esc(c.nome)}</b> (+${c.pts}): ${esc(c.txt)}</li>`).join('')}</ol>` : ''}
      <div class="online-row">${v.dono ? '<button class="btn big" type="button" data-m="comecar">Jogar de novo</button>' : ''}<button class="linkish" type="button" data-m="sair">sair</button></div></div></section>`
  }

  function receber(v) {
    const antes = vis
    vis = v
    recebido = performance.now()
    // o recado (cumpriu, foi pego, errou) fica uns segundos na tela mesmo que chegue outra mensagem
    if (v.meu && v.meu.nota) {
      ui.nota = v.meu.nota
      som(/\+/.test(v.meu.nota) ? 'sold' : 'undo')
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
    criar: () => { H = { pessoas: [{ id: MEU_ID, conn: null, nome: ui.nome || 'Agente 1', on: true, pts: 0 }], opc: { min: 30 }, jogo: false, feed: [], pedidos: [], seq: 0 }; ui.erro = ''; sala.criar() },
    entrar: () => { ui.codigo = (document.getElementById('mi-codigo') || {}).value || ''; ui.erro = ''; sala.entrar(ui.codigo) },
    min: (v) => { if (H && !H.jogo) { H.opc.min = Number(v); enviarTudo() } },
    convite: () => {
      const link = location.origin + location.pathname + '#missao-' + sala.st.code
      const ok = () => { ui.msg = 'Convite copiado! Manda pros amigos.'; render() }
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

  let pronto = null
  window.Missao = {
    letreiro: () => ['Missão <em>Secreta</em>', 'cumpra a sua sem ninguém perceber'],
    abrir() { ui.nome = guarda('mvd-imp-nome') || ui.nome; if (!pronto) pronto = V.load(); pronto.then(render) },
    entrar(code) { ui.codigo = code; if (!pronto) pronto = V.load(); pronto.then(() => sala.entrar(code)) },
  }
})()
