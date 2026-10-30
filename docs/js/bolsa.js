// Bolsa do Multiverso: liga o motor (bolsa-motor.js), as telas (bolsa-telas.js) e a sala online (sala.js).
// Quem cria a sala é o "anfitrião": roda o motor, o relógio e os bots, e manda pra cada aparelho só o que ele pode ver.
// Sem internet dá pra testar sozinho contra bots (o anfitrião roda tudo neste aparelho).
(function () {
  const E = window.Engine
  const D = E.D
  const M = window.BolsaMotor
  const T = window.BolsaTelas
  const X = window.Sfx
  const el = document.getElementById('bolsa')
  el.innerHTML = '<div id="bo-tela"></div><div id="bo-aviso"></div>'
  const tela = document.getElementById('bo-tela')
  const avisoEl = document.getElementById('bo-aviso')
  const sala = window.Sala.nova({ prefixo: 'mvbolsa-v1-', chave: 'mvd-sala-bolsa' })
  const RAPIDO = /[?&]rapido\b/.test(location.search) // só pra testar: rodadas curtinhas
  const LEITURA = RAPIDO ? 1500 : 4000
  const BOTS = ['JARVIS', 'Sexta-Feira', 'KAREN', 'EDITH', 'Dum-E', 'Ultron Jr.', 'Vigia', 'H.E.R.B.I.E.']
  const ERROS = {
    servidor: 'Sem conexão com o servidor da sala. Confere a internet.', codigo: 'O código tem 4 letras ou números.',
    naoAchei: 'Não achei essa sala. Confere o código com quem criou.', naoConectou: 'Não conectou. Quem criou a sala está com o site aberto?',
    caiu: 'A sala fechou ou a conexão caiu.', cheia: 'Essa sala está cheia.',
  }
  const som = (f, p) => { if (X && X.on) X[f](p) }
  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  const MEU_ID = (() => {
    let v = ''
    try { v = sessionStorage.getItem('mvd-bolsa-id') || '' } catch (e) {}
    if (!v) { v = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mvd-bolsa-id', v) } catch (e) {} }
    return v
  })()

  const ui = { nome: guarda('mvd-imp-nome'), codigo: '', bots: 4, erro: '', status: '', painel: '', boato: null, msg: '', sair: false, querTelao: false }
  let H = null       // anfitrião: { local, pessoas, opc, J, prazo, dur, prox, sujo, laco }
  let vis = null     // o que este aparelho desenha
  let prazoLocal = 0
  let chave = ''
  let antes = { fase: '', rodada: 0, aviso: 0 }

  // ---------- anfitrião ----------
  function novoHost(local, telao) {
    H = { local, opc: { rodadas: 8, tempo: 40, skrull: true }, J: null, prazo: 0, dur: 1, prox: {}, sujo: false, laco: 0,
      pessoas: [{ id: MEU_ID, conn: null, nome: ui.nome || 'Você', on: true, telao: !!telao }] }
  }
  const nomeBot = () => BOTS.find((n) => !H.pessoas.some((p) => p.nome === n)) || 'Bot ' + H.pessoas.length
  function poeBot() { if (H.pessoas.length < 10) H.pessoas.push({ id: 'bot-' + Math.random().toString(36).slice(2, 7), bot: true, nome: nomeBot(), on: true }) }

  function comecar() {
    const pool = E.shuffle(Object.keys(window.BolsaDados.ACOES).map((key) => D.hq.findIndex((h) => h.key === key)).filter((i) => i >= 0)).slice(0, 6)
    const jogam = H.pessoas.filter((p) => !p.telao && p.on)
    if (jogam.length < 2) return
    H.pessoas.forEach((p) => { p.j = jogam.indexOf(p) })
    H.J = M.novoJogo({ acoes: pool.map((hq) => ({ key: D.hq[hq].key, nome: D.hq[hq].n, hq })), jogadores: jogam.map((p) => ({ nome: p.nome, bot: p.bot })), rodadas: H.opc.rodadas, skrull: H.opc.skrull })
    fase(LEITURA)
    clearInterval(H.laco)
    H.laco = setInterval(tick, 100)
    H.sujo = true
    tick()
  }
  function fase(ms) { H.prazo = Date.now() + ms; H.dur = ms }

  function tick() {
    if (!H || !H.J) return
    const J = H.J
    const agora = Date.now()
    if (J.fase === 'pregao') {
      H.pessoas.forEach((p) => {
        if (!p.bot || p.j < 0) return
        if (agora < (H.prox[p.id] || 0)) return
        H.prox[p.id] = agora + 700 + Math.random() * 1900
        const r = M.botAgir(J, p.j)
        if (r) H.sujo = true
      })
    }
    if (agora >= H.prazo && J.fase !== 'fim') avancar()
    if (H.sujo) { H.sujo = false; enviarTudo() }
  }

  function avancar() {
    const J = H.J
    if (J.fase === 'leitura') { J.fase = 'pregao'; fase(RAPIDO ? 7000 : H.opc.tempo * 1000) }
    else if (J.fase === 'pregao') { M.fechar(J); fase(4600 + 1000 * J.jornal.itens.length) }
    else if (J.fase === 'jornal') {
      M.proximo(J)
      if (J.fase === 'fim') clearInterval(H.laco)
      else fase(LEITURA)
    }
    H.sujo = true
  }

  function premios(J) {
    const quem = (f) => J.js.map((p, j) => [f(p), j]).sort((a, b) => b[0] - a[0])[0]
    const rodadas = (p) => p.hist.slice(1).map((x, i) => x - p.hist[i])
    const out = []
    const [maior, j1] = quem((p) => Math.max(...rodadas(p)))
    if (maior > 0) out.push({ titulo: 'Tubarão', nome: J.js[j1].nome, txt: `+${T.din(maior)} numa rodada só` })
    const [pior, j2] = quem((p) => -Math.min(...rodadas(p)))
    if (pior > 0) out.push({ titulo: 'Mão furada', nome: J.js[j2].nome, txt: `perdeu ${T.din(pior)} numa rodada` })
    const [neg, j3] = quem((p) => p.negocios)
    out.push({ titulo: 'Mais agitado', nome: J.js[j3].nome, txt: `${neg} negócios` })
    const [bo, j4] = quem((p) => p.boatos)
    if (bo > 0) out.push({ titulo: 'Fofoqueiro', nome: J.js[j4].nome, txt: `${bo} boato${bo > 1 ? 's' : ''} plantado${bo > 1 ? 's' : ''}` })
    return out
  }

  // o que cada pessoa pode ver (as dicas e o caixa dos outros nunca saem do anfitrião)
  function visao(p) {
    const lobby = { code: sala.st.code, dono: p === H.pessoas[0], souTelao: !!p.telao, opc: H.opc }
    if (!H.J || p.j === undefined) {
      return { ...lobby, fase: 'sala', pessoas: H.pessoas.map((x) => ({ nome: x.nome, bot: !!x.bot, telao: !!x.telao, on: x.on, voce: x === p, dono: x === H.pessoas[0] })) }
    }
    const J = H.J
    const fim = J.fase === 'fim'
    const v = {
      ...lobby, fase: J.fase, rodada: J.rodada, total: J.total, resta: Math.max(0, H.prazo - Date.now()), dur: H.dur, skrullModo: J.skrullModo, eu: p.j,
      acoes: J.acoes.map((ac) => ({ t: ac.t, nome: ac.nome, hq: ac.hq, preco: ac.preco, abre: ac.abre, hist: ac.hist })),
      jogadores: J.js.map((x) => ({ nome: x.nome, bot: x.bot, pat: x.hist[x.hist.length - 1], hist: x.hist, pego: x.pego, skrull: x.skrull && (x.pego || fim) })),
      fita: J.fita.map((f) => ({ j: f.j, a: f.a, c: f.c, p: f.p })),
      jornal: J.fase === 'jornal' || fim ? J.jornal : null,
      aviso: J.avisos[J.avisos.length - 1] || null,
      premios: fim ? premios(J) : [],
    }
    if (p.j >= 0) {
      const x = J.js[p.j]
      const sk = x.skrull && !x.pego
      v.meu = { caixa: x.caixa, pos: x.pos, pat: M.patrimonio(J, p.j), dicas: x.dicas.map((d) => ({ a: d.a, tipo: d.tipo })), skrull: sk,
        manchetes: sk ? J.noticias.map((n) => ({ txt: n.txt, d: n.d, a: n.a, alvos: n.alvos })) : [], boato: x.boato, denunciou: x.denunciou }
    }
    return v
  }

  function enviarTudo() {
    if (!H) return
    for (const p of H.pessoas) if (p.conn && p.on) sala.enviar({ type: 'visao', v: visao(p) }, p.conn)
    receber(visao(H.pessoas[0]))
  }

  // ações vindas de qualquer jogador (inclusive do próprio anfitrião)
  function acao(p, msg) {
    const J = H.J
    if (msg.type === 'nome' && !J) { p.nome = String(msg.nome || '').trim().slice(0, 14) || p.nome }
    if (!J || p.j === undefined || p.j < 0) { H.sujo = true; if (!J) enviarTudo(); return }
    if (msg.type === 'neg') M.negociar(J, p.j, Number(msg.a), !!msg.c)
    if (msg.type === 'boato') M.plantar(J, p.j, Number(msg.a), !!msg.sobe)
    if (msg.type === 'denuncia') M.denunciar(J, p.j, Number(msg.alvo))
    H.sujo = true
  }
  const fazer = (msg) => { if (H) acao(H.pessoas[0], msg); else sala.enviar(msg) }

  // ---------- sala online ----------
  sala.aoStatus = (st) => {
    if (st.status === 'off') {
      if (H && !H.local) { clearInterval(H.laco); H = null }
      if (!H) vis = null
      ui.erro = st.erro ? ERROS[st.erro] || ERROS.caiu : ''
      ui.status = ''
    }
    if (st.status === 'creating' || st.status === 'joining') ui.status = 'Conectando…'
    if (st.status === 'hosting' && H) { ui.status = ''; enviarTudo() }
    if (st.status === 'connected') { ui.status = 'Entrou! Esperando a sala…'; sala.enviar({ type: 'oi', id: MEU_ID, nome: ui.nome, telao: ui.querTelao }) }
    render()
  }
  sala.aoDados = (msg, de) => {
    if (!msg || typeof msg !== 'object') return
    if (de === 'host') {
      if (msg.type === 'cheia') { sala.sair(); ui.erro = ERROS.cheia; render(); return }
      if (msg.type === 'visao' && msg.v) receber(msg.v)
      return
    }
    if (!H) return
    if (msg.type === 'oi') {
      const id = String(msg.id || '').slice(0, 20)
      let p = H.pessoas.find((x) => x.id === id)
      if (!p) {
        if (!id || H.pessoas.length >= 12) { sala.enviar({ type: 'cheia' }, de); setTimeout(() => sala.fechar(de), 300); return }
        p = { id, conn: de, nome: '', on: true, telao: !!msg.telao }
        if (H.J) p.j = -1 // chegou no meio: assiste pelo telão
        H.pessoas.push(p)
      }
      Object.assign(p, { conn: de, on: true, nome: String(msg.nome || '').trim().slice(0, 14) || p.nome || 'Jogador ' + H.pessoas.length })
      H.sujo = true
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
    if (!H.J) H.pessoas = H.pessoas.filter((x) => x !== p)
    enviarTudo()
  }

  // ---------- desenho ----------
  function receber(v) {
    const novo = !vis || vis.fase !== v.fase || vis.rodada !== v.rodada
    // entrou agora numa partida (ou começou outra): denúncias antigas não aparecem de novo
    if (!vis || vis.fase === 'sala' || vis.fase === 'fim') antes.aviso = v.aviso ? v.aviso.n : 0
    vis = v
    prazoLocal = performance.now() + (v.resta || 0)
    if (novo) sons(v)
    render()
  }

  function sons(v) {
    if (v.fase === 'pregao' && antes.fase === 'leitura') som('draw')
    if (v.fase === 'jornal') {
      som('hammer')
      if (v.meu && v.jornal) { const g = v.jornal.ganhos[v.eu]; setTimeout(() => som(g > 0 ? 'sold' : g < 0 ? 'undo' : 'tick'), 900 * (v.jornal.itens.length + 2)) }
    }
    if (v.fase === 'fim' && antes.fase !== 'fim') som('win')
    antes.fase = v.fase
  }

  function render() {
    const jogando = vis && vis.fase !== 'sala' && vis.fase !== 'fim'
    document.body.classList.toggle('bo-jogando', !!jogando && !el.hidden)
    if (!vis) { chave = ''; tela.innerHTML = T.entrada(ui); return }
    if (vis.fase === 'sala') { chave = ''; tela.innerHTML = T.sala(vis, ui); return }
    if (vis.fase === 'fim') { chave = ''; tela.innerHTML = T.fim(vis, { dono: !!H }); return }
    const m = vis.meu
    const k = [vis.fase, vis.rodada, vis.eu, ui.painel, JSON.stringify(ui.boato), m && m.boato ? 1 : 0, m && m.denunciou ? 1 : 0, vis.jogadores.some((j) => j.pego) ? 1 : 0].join('|')
    if (k !== chave) { tela.innerHTML = vis.eu >= 0 ? T.jogo(vis, ui) : T.telao(vis); chave = k }
    T.atualizar(vis, tela)
    relogio()
    const av = vis.aviso
    if (av && av.n !== antes.aviso) {
      antes.aviso = av.n
      avisoEl.innerHTML = T.denuncia(vis, av)
      som('hammer')
      setTimeout(() => som(av.certo ? 'win' : 'undo'), 1700)
      clearTimeout(avisoEl._t)
      avisoEl._t = setTimeout(() => { avisoEl.innerHTML = '' }, 6000)
    }
  }

  let ultimoSeg = -1
  function relogio() {
    if (!vis || !vis.dur) return
    const resta = Math.max(0, prazoLocal - performance.now())
    const seg = Math.ceil(resta / 1000)
    tela.querySelectorAll('[data-x="barra"]').forEach((b) => { b.style.width = (100 * resta) / vis.dur + '%' })
    tela.querySelectorAll('[data-x="seg"]').forEach((b) => { b.textContent = vis.fase === 'pregao' || vis.fase === 'leitura' ? seg : '' })
    tela.querySelectorAll('.bo-relogio').forEach((b) => b.classList.toggle('acabando', vis.fase === 'pregao' && seg <= 5))
    if (vis.fase === 'pregao' && seg <= 5 && seg > 0 && seg !== ultimoSeg) som('tick')
    ultimoSeg = seg
  }
  setInterval(() => { if (vis && !el.hidden && vis.fase !== 'sala' && vis.fase !== 'fim') relogio() }, 100)

  function sair() {
    if (H) { clearInterval(H.laco); H = null }
    if (sala.st.status !== 'off') sala.sair()
    vis = null
    ui.painel = ''
    ui.sair = false
    render()
  }

  // ---------- botões ----------
  const acoes = {
    bots: (v) => { ui.bots = Math.min(7, Math.max(2, ui.bots + Number(v))); render() },
    testar: () => { novoHost(true, false); for (let k = 0; k < ui.bots; k++) poeBot(); comecar() },
    criar: () => { novoHost(false, false); ui.erro = ''; sala.criar() },
    'criar-telao': () => { novoHost(false, true); ui.erro = ''; sala.criar() },
    entrar: () => { ui.querTelao = false; ui.codigo = (document.getElementById('bo-codigo') || {}).value || ''; ui.erro = ''; sala.entrar(ui.codigo) },
    'entrar-telao': () => { ui.querTelao = true; ui.codigo = (document.getElementById('bo-codigo') || {}).value || ''; ui.erro = ''; sala.entrar(ui.codigo) },
    'poe-bot': () => { if (H && !H.J) { poeBot(); enviarTudo() } },
    'tira-bot': (v) => { if (H && !H.J && H.pessoas[v] && H.pessoas[v].bot) { H.pessoas.splice(Number(v), 1); enviarTudo() } },
    opc: (v, b) => { if (!H || H.J) return; const k = b.dataset.k; H.opc[k] = k === 'skrull' ? v === 'true' : Number(v); enviarTudo() },
    convite: () => {
      const link = location.origin + location.pathname + '#bolsa-' + sala.st.code
      const ok = () => { ui.msg = 'Convite copiado! Manda pros amigos.'; render() }
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(ok, () => { ui.msg = link; render() })
      else { ui.msg = link; render() }
    },
    comecar: () => { if (H && !H.J) comecar() },
    denovo: () => { if (H) comecar() },
    sala: () => { if (H) { clearInterval(H.laco); H.J = null; H.pessoas.forEach((p) => { delete p.j }); enviarTudo() } },
    neg: (v, b) => { if (!b.disabled) { som('bid', b.dataset.c === '1' ? 0 : 1); fazer({ type: 'neg', a: Number(v), c: b.dataset.c === '1' }) } },
    painel: (v) => { ui.painel = v; ui.boato = v === 'boato' ? {} : null; render() },
    'boato-a': (v) => { ui.boato = { ...ui.boato, a: Number(v) }; render() },
    'boato-d': (v) => { ui.boato = { ...ui.boato, sobe: v === '1' }; render() },
    'boato-ok': () => { fazer({ type: 'boato', a: ui.boato.a, sobe: ui.boato.sobe }); som('draw'); ui.painel = ''; ui.boato = null; render() },
    'denuncia-ok': (v) => { fazer({ type: 'denuncia', alvo: Number(v) }); ui.painel = ''; render() },
    sair: (v, b) => {
      const meio = vis && vis.fase !== 'sala' && vis.fase !== 'fim'
      if (meio && !ui.sair) { ui.sair = true; b.textContent = 'toque de novo pra sair'; setTimeout(() => { ui.sair = false; if (b.isConnected) b.textContent = 'sair' }, 2500); return }
      sair()
    },
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-b]')
    if (!b || b.disabled || !acoes[b.dataset.b]) return
    acoes[b.dataset.b](b.dataset.v, b)
  })
  el.addEventListener('input', (ev) => {
    if (ev.target.id === 'bo-nome' || ev.target.id === 'bo-meu-nome') {
      ui.nome = ev.target.value.slice(0, 14)
      guarda('mvd-imp-nome', ui.nome)
      if (ev.target.id === 'bo-meu-nome') { clearTimeout(ui._n); ui._n = setTimeout(() => fazer({ type: 'nome', nome: ui.nome }), 400) }
    }
    if (ev.target.id === 'bo-codigo') ui.codigo = ev.target.value
  })
  el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.id === 'bo-codigo') acoes.entrar() })

  let pronto = null
  window.Bolsa = {
    letreiro: () => ['Bolsa do <em>Multiverso</em>', 'compre na baixa, venda na alta, desconfie de todo mundo'],
    abrir() { ui.nome = guarda('mvd-imp-nome') || ui.nome; if (!pronto) pronto = window.View.load(); pronto.then(render) },
    esconder() { document.body.classList.remove('bo-jogando') },
    entrar(code) { ui.codigo = code; ui.querTelao = false; if (!pronto) pronto = window.View.load(); pronto.then(() => sala.entrar(code)) },
  }
})()
