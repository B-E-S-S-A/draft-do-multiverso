// Aposto Que Sei: liga o motor (aposto-motor.js), os temas, as telas e a sala online (sala.js).
// Num celular só, o aparelho fica no meio da mesa e cada um joga na sua vez (a prova é passada pra quem vai provar).
// Online, quem cria a sala é o anfitrião: roda o motor, o relógio e os bots, e manda a mesma mesa pra todo mundo.
(function () {
  const E = window.Engine
  const D = E.D
  const M = window.ApostoMotor
  const T = window.ApostoTelas
  const X = window.Sfx
  const el = document.getElementById('aposto')
  const sala = window.Sala.nova({ prefixo: 'mvaposto-v1-', chave: 'mvd-sala-aposto' })
  const BOTS = ['JARVIS', 'KAREN', 'Sexta-Feira', 'EDITH', 'Dum-E', 'Vigia']
  const ERROS = {
    servidor: 'Sem conexão com o servidor da sala. Confere a internet.', codigo: 'O código tem 4 letras ou números.',
    naoAchei: 'Não achei essa sala. Confere o código com quem criou.', naoConectou: 'Não conectou. Quem criou a sala está com o site aberto?',
    caiu: 'A sala fechou ou a conexão caiu.', cheia: 'Essa sala está cheia (7 na mesa).',
  }
  const som = (f, p) => { if (X && X.on) X[f](p) }
  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  const MEU_ID = (() => {
    let v = ''
    try { v = sessionStorage.getItem('mvd-aposto-id') || '' } catch (e) {}
    if (!v) { v = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mvd-aposto-id', v) } catch (e) {} }
    return v
  })()

  const salvo = (() => { try { return JSON.parse(localStorage.getItem('mvd-aposto') || '{}') } catch (e) { return {} } })()
  const ui = { n: Math.min(7, Math.max(2, Number(salvo.n) || 3)), nomes: Array.isArray(salvo.nomes) ? salvo.nomes.slice(0, 7) : [], meta: [10, 15, 25].includes(salvo.meta) ? salvo.meta : 15,
    meuNome: guarda('mvd-imp-nome'), codigo: '', erro: '', status: '', msg: '', valor: 0, base: -1, estouro: false }
  const salvar = () => guarda('mvd-aposto', JSON.stringify({ n: ui.n, nomes: ui.nomes, meta: ui.meta }))
  let H = null
  let vis = null
  let prazoLocal = 0

  // ---------- anfitrião ----------
  function novoHost(local, pessoas) { H = { local, pessoas, meta: ui.meta, J: null, prazo: 0, dur: 0, botEm: 0, inicio: 0, seguirEm: 0, fs: '', sig: '', laco: 0 } }
  const nomeBot = () => BOTS.find((n) => !H.pessoas.some((p) => p.nome === n)) || 'Bot ' + H.pessoas.length
  const poeBot = () => H.pessoas.push({ id: 'bot-' + Math.random().toString(36).slice(2, 7), nome: nomeBot(), bot: true, on: true, nivel: 0.45 + Math.random() * 0.4 })

  function comecar() {
    const jogam = H.pessoas.filter((p) => p.on)
    if (jogam.length < 2) return
    H.pessoas.forEach((p) => { p.j = jogam.indexOf(p) })
    H.J = M.novoJogo({ jogadores: jogam.map((p) => ({ nome: p.nome, bot: p.bot, nivel: p.nivel })), meta: H.meta, temas: window.ApostoTemas.todos(D), D })
    H.fs = ''
    clearInterval(H.laco)
    H.laco = setInterval(tick, 150)
    tick()
  }

  // a cada mudança de vez/fase o relógio recomeça
  function entrou(agora) {
    const J = H.J
    if (J.fase === 'lances') { H.prazo = agora + M.TEMPO_LANCE; H.dur = M.TEMPO_LANCE; H.botEm = agora + 1300 + Math.random() * 1500 }
    if (J.fase === 'prova' && !J.prova.comecou) { H.inicio = H.local && !J.js[J.prova.j].bot ? 0 : agora + 2600; H.prazo = 0; H.dur = 0 }
    if (J.fase === 'prova' && J.prova.comecou) { const t = M.tempoProva(J.prova.n); H.prazo = agora + t; H.dur = t; H.botEm = agora + 1100 + Math.random() * 700 }
    if (J.fase === 'resultado') { H.prazo = 0; H.dur = 0; H.seguirEm = agora + 8000 }
  }

  function tick() {
    if (!H || !H.J) return
    const J = H.J
    const agora = Date.now()
    const fs = () => [J.rodada, J.fase, J.vez, J.hist.length, J.prova ? J.prova.comecou : ''].join('|')
    if (fs() !== H.fs) { H.fs = fs(); entrou(agora) }
    if (J.fase === 'lances') {
      if (J.js[J.vez].bot && agora >= H.botEm) M.botVez(J, J.vez)
      else if (agora >= H.prazo) M.tempoAcabou(J)
    } else if (J.fase === 'prova') {
      const P = J.prova
      if (!P.comecou && H.inicio && agora >= H.inicio) P.comecou = true
      else if (P.comecou && J.js[P.j].bot && agora >= H.botEm) { M.botToque(J, P.j); H.botEm = agora + 900 + Math.random() * 1300 }
      else if (P.comecou && H.prazo && agora >= H.prazo) M.tempoAcabou(J)
    } else if (J.fase === 'resultado' && !H.local && agora >= H.seguirEm) M.proximo(J)
    if (fs() !== H.fs) { H.fs = fs(); entrou(agora) }
    const sig = [H.fs, J.lance ? J.lance.n : 0, J.prova ? J.prova.tocados.length : 0, J.js.map((p) => p.pts + (p.bot ? 'b' : '')).join(), H.pessoas.map((p) => p.on).join()].join('|')
    if (sig !== H.sig) { H.sig = sig; enviarTudo() }
  }

  function visao(p) {
    const base = { code: sala.st.code, dono: p === H.pessoas[0], meta: H.meta, modo: H.local ? 'local' : 'online' }
    if (!H.J || p.j === undefined) return { ...base, fase: 'sala', pessoas: H.pessoas.map((x) => ({ nome: x.nome, bot: !!x.bot, on: x.on, voce: x === p, dono: x === H.pessoas[0] })) }
    const J = H.J
    const aberto = J.fase === 'resultado' || J.fase === 'fim'
    const pessoaDe = (i) => H.pessoas.find((x) => x.j === i)
    // cópias: neste aparelho a visão anterior fica guardada pra comparar (sons), então não pode ser o mesmo objeto do motor
    return { ...base, fase: J.fase, eu: p.j, rodada: J.rodada, vez: J.vez, lance: J.lance && { ...J.lance }, hist: J.hist.map((h) => ({ ...h })),
      js: J.js.map((x, i) => ({ nome: x.nome, pts: x.pts, bot: x.bot, provas: x.provas, acertou: x.acertou, on: (pessoaDe(i) || {}).on !== false })),
      tema: { titulo: J.tema.titulo, k: J.tema.k, grade: J.tema.grade }, certos: aberto ? J.tema.certos : null,
      prova: J.prova && { ...J.prova, tocados: J.prova.tocados.map((t) => ({ ...t })) }, resultado: J.resultado && { ...J.resultado }, resta: H.prazo ? Math.max(0, H.prazo - Date.now()) : 0, dur: H.dur,
      fimLogo: !!J.resultado && J.js.some((x) => x.pts >= J.meta) }
  }

  function enviarTudo() {
    if (!H) return
    for (const p of H.pessoas) if (p.conn && p.on) sala.enviar({ type: 'visao', v: visao(p) }, p.conn)
    receber(visao(H.pessoas[0]))
  }

  // num celular só, o aparelho age por quem está na vez (ou por quem está provando)
  function acao(p, msg) {
    const J = H.J
    if (msg.type === 'nome' && !J) { p.nome = String(msg.nome || '').trim().slice(0, 14) || p.nome; enviarTudo(); return }
    if (!J) return
    const quem = H.local ? (msg.type === 'tocar' || msg.type === 'comecar-prova' ? J.prova && J.prova.j : J.vez) : p.j
    if (quem === undefined || quem === null || quem < 0 || J.js[quem].bot) return
    if (msg.type === 'apostar') M.apostar(J, quem, msg.n)
    if (msg.type === 'prova') M.mandarProvar(J, quem)
    if (msg.type === 'comecar-prova' && J.fase === 'prova' && J.prova.j === quem) J.prova.comecou = true
    if (msg.type === 'tocar') M.tocar(J, quem, msg.pos)
    tick()
  }
  const fazer = (msg) => { if (H) acao(H.pessoas[0], msg); else sala.enviar(msg) }

  // ---------- sala online ----------
  sala.aoStatus = (st) => {
    if (st.status === 'off') { if (H && !H.local) { clearInterval(H.laco); H = null } if (!H) vis = null; ui.erro = st.erro ? ERROS[st.erro] || ERROS.caiu : ''; ui.status = '' }
    if (st.status === 'creating' || st.status === 'joining') ui.status = 'Conectando…'
    if (st.status === 'hosting' && H) { ui.status = ''; enviarTudo() }
    if (st.status === 'connected') sala.enviar({ type: 'oi', id: MEU_ID, nome: ui.meuNome })
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
        if (!id || H.pessoas.length >= 7) { sala.enviar({ type: 'cheia' }, de); setTimeout(() => sala.fechar(de), 300); return }
        p = { id, conn: de, nome: '', on: true }
        if (H.J) p.j = -1 // chegou no meio: assiste
        H.pessoas.push(p)
      }
      Object.assign(p, { conn: de, on: true, nome: String(msg.nome || '').trim().slice(0, 14) || p.nome || 'Jogador ' + H.pessoas.length })
      if (H.J && p.j >= 0 && H.J.js[p.j]) H.J.js[p.j].bot = false // voltou: o bot devolve a vez
      H.sig = ''
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
    else if (H.J.js[p.j]) {
      // caiu no meio: um bot assume a vez dele pra mesa não travar (e devolve se ele voltar)
      H.J.js[p.j].bot = true
      H.J.js[p.j].conhece = H.J.js[p.j].conhece || []
    }
    H.sig = ''
    enviarTudo()
  }

  // ---------- desenho ----------
  function receber(v) {
    const a = vis
    vis = v
    prazoLocal = performance.now() + (v.resta || 0)
    if (a && a.fase !== 'sala' && v.fase !== 'sala') sons(a, v)
    render()
  }

  function sons(a, v) {
    if (v.hist && a.hist && v.rodada === a.rodada && v.hist.length > a.hist.length) {
      const h = v.hist[v.hist.length - 1]
      if (h.prova) { som('hammer'); ui.estouro = true; setTimeout(() => { ui.estouro = false; render() }, 1300) } else som('bid', h.j % 2)
    }
    const ta = a.prova ? a.prova.tocados.length : 0
    const tv = v.prova ? v.prova.tocados.length : 0
    if (v.prova && tv > ta && v.rodada === a.rodada) som(v.prova.tocados[tv - 1].ok ? 'tick' : 'undo')
    if (v.fase === 'resultado' && a.fase !== 'resultado') setTimeout(() => som(v.resultado.ok ? 'sold' : 'hammer'), 250)
    if (v.fase === 'lances' && a.fase !== 'lances') som('draw')
    if (v.fase === 'fim' && a.fase !== 'fim') som('win')
  }

  function render() {
    // durante a prova a grade ocupa a tela toda (sem o toldo), pra caber no celular sem rolar
    const foco = !!vis && vis.fase === 'prova' && !el.hidden
    if (foco && !document.body.classList.contains('ap-foco')) window.scrollTo(0, 0)
    document.body.classList.toggle('ap-foco', foco)
    if (!vis) { el.innerHTML = T.entrada(ui); return }
    if (vis.fase === 'sala') { el.innerHTML = T.sala(vis, ui); return }
    const local = vis.modo === 'local'
    ui.podeSeguir = local || vis.dono
    if (vis.fase === 'fim') { el.innerHTML = T.fim(vis, ui); return }
    ui.souVez = vis.fase === 'lances' && (local ? !vis.js[vis.vez].bot : vis.eu === vis.vez)
    ui.souProva = vis.fase === 'prova' && (local ? !vis.js[vis.prova.j].bot : vis.eu === vis.prova.j)
    const base = vis.lance ? vis.lance.n : 0
    if (ui.base !== base + '|' + vis.rodada) { ui.base = base + '|' + vis.rodada; ui.valor = base + 1 }
    el.innerHTML = T.jogo(vis, ui)
    relogio()
  }

  let ultimoSeg = -1
  function relogio() {
    if (!vis || !vis.dur) { el.querySelectorAll('.ap-relogio').forEach((r) => { r.hidden = true }); return }
    const resta = Math.max(0, prazoLocal - performance.now())
    const seg = Math.ceil(resta / 1000)
    el.querySelectorAll('[data-x="barra"]').forEach((b) => { b.style.width = (100 * resta) / vis.dur + '%' })
    el.querySelectorAll('[data-x="seg"]').forEach((b) => { b.textContent = seg })
    el.querySelectorAll('.ap-relogio').forEach((r) => r.classList.toggle('acabando', seg <= 5))
    if (vis.fase === 'prova' && seg <= 5 && seg > 0 && seg !== ultimoSeg) som('tick')
    ultimoSeg = seg
  }
  setInterval(() => { if (vis && !el.hidden && (vis.fase === 'lances' || vis.fase === 'prova')) relogio() }, 100)

  function sair() {
    if (H) clearInterval(H.laco)
    H = null
    if (sala.st.status !== 'off') sala.sair()
    vis = null
    render()
  }

  // ---------- botões ----------
  const nomesLocais = () => Array.from({ length: ui.n }, (_, i) => (ui.nomes[i] || '').trim() || `Jogador ${i + 1}`)
  const acoes = {
    n: (v) => { ui.n = Math.min(7, Math.max(2, ui.n + Number(v))); salvar(); render() },
    meta: (v) => { if (H && !H.J) { H.meta = Number(v); enviarTudo() } else { ui.meta = Number(v); salvar(); render() } },
    local: () => { novoHost(true, nomesLocais().map((nome, i) => ({ id: 'l' + i, nome, on: true }))); comecar() },
    bots: () => { novoHost(true, [{ id: 'l0', nome: ui.meuNome || 'Você', on: true }]); for (let k = 0; k < 3; k++) poeBot(); comecar() },
    criar: () => { novoHost(false, [{ id: MEU_ID, conn: null, nome: ui.meuNome || 'Jogador 1', on: true }]); ui.erro = ''; sala.criar() },
    entrar: () => { ui.codigo = (document.getElementById('ap-codigo') || {}).value || ''; ui.erro = ''; sala.entrar(ui.codigo) },
    'poe-bot': () => { if (H && !H.J && H.pessoas.length < 7) { poeBot(); enviarTudo() } },
    'tira-bot': (v) => { if (H && !H.J && H.pessoas[v] && H.pessoas[v].bot) { H.pessoas.splice(Number(v), 1); enviarTudo() } },
    convite: () => {
      const link = location.origin + location.pathname + '#aposto-' + sala.st.code
      const ok = () => { ui.msg = 'Convite copiado! Manda pros amigos.'; render() }
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(ok, () => { ui.msg = link; render() })
      else { ui.msg = link; render() }
    },
    comecar: () => { if (H && !H.J) comecar() },
    valor: (v) => { ui.valor += Number(v); render() },
    apostar: (v) => fazer({ type: 'apostar', n: Number(v) }),
    prova: () => fazer({ type: 'prova' }),
    'comecar-prova': () => fazer({ type: 'comecar-prova' }),
    tocar: (v) => { if (ui.souProva && vis.prova.comecou) fazer({ type: 'tocar', pos: Number(v) }) },
    proxima: () => { if (H && H.J && H.J.fase === 'resultado') { M.proximo(H.J); tick() } },
    denovo: () => { if (H) comecar() },
    sair: () => sair(),
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-a]')
    if (!b || b.disabled || !acoes[b.dataset.a]) return
    acoes[b.dataset.a](b.dataset.v, b)
  })
  el.addEventListener('input', (ev) => {
    const m = ev.target.id && ev.target.id.match(/^ap-nome-(\d)$/)
    if (m) { ui.nomes[Number(m[1])] = ev.target.value.slice(0, 14); salvar() }
    if (ev.target.id === 'ap-meu') { ui.meuNome = ev.target.value.slice(0, 14); guarda('mvd-imp-nome', ui.meuNome) }
    if (ev.target.id === 'ap-codigo') ui.codigo = ev.target.value
  })
  el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.id === 'ap-codigo') acoes.entrar() })

  let pronto = null
  window.Aposto = {
    letreiro: () => ['Aposto Que <em>Sei</em>', 'quem sabe mais de Marvel prova na hora'],
    esconder() { document.body.classList.remove('ap-foco') },
    abrir() { ui.meuNome = guarda('mvd-imp-nome') || ui.meuNome; if (!pronto) pronto = window.View.load(); pronto.then(render) },
    entrar(code) { ui.codigo = code; if (!pronto) pronto = window.View.load(); pronto.then(() => sala.entrar(code)) },
  }
})()
