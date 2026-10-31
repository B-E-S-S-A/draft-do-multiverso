// Minas do Multiverso: liga o motor (minas-motor.js), as telas e a sala online (sala.js).
// Num celular só, o aparelho passa de mão em mão pra plantar e depois fica no meio da mesa pro duelo.
// Online, quem cria a sala é o anfitrião: roda o motor, o relógio e os bots; cada um só recebe as próprias minas.
(function () {
  const M = window.MinasMotor
  const T = window.MinasTelas
  const X = window.Sfx
  const el = document.getElementById('minas')
  const sala = window.Sala.nova({ prefixo: 'mvminas-v1-', chave: 'mvd-sala-minas' })
  const BOTS = ['JARVIS', 'KAREN', 'Sexta-Feira', 'EDITH', 'Dum-E', 'Vigia']
  const ERROS = {
    servidor: 'Sem conexão com o servidor da sala. Confere a internet.', codigo: 'O código tem 4 letras ou números.',
    naoAchei: 'Não achei essa sala. Confere o código com quem criou.', naoConectou: 'Não conectou. Quem criou a sala está com o site aberto?',
    caiu: 'A sala fechou ou a conexão caiu.', cheia: 'Essa sala está cheia (7 no campo).',
  }
  const AVISOS = { naovale: 'Esse nome não vale pra esse tema.', repetida: 'Você já plantou essa.', fase: '' }
  const som = (f, p) => { if (X && X.on) X[f](p) }
  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  const MEU_ID = (() => {
    let v = ''
    try { v = sessionStorage.getItem('mvd-minas-id') || '' } catch (e) {}
    if (!v) { v = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mvd-minas-id', v) } catch (e) {} }
    return v
  })()

  const salvo = (() => { try { return JSON.parse(localStorage.getItem('mvd-minas') || '{}') } catch (e) { return {} } })()
  const ui = { n: Math.min(7, Math.max(2, Number(salvo.n) || 3)), nomes: Array.isArray(salvo.nomes) ? salvo.nomes.slice(0, 7) : [], vidas: [2, 3, 4].includes(salvo.vidas) ? salvo.vidas : 3,
    meuNome: guarda('mvd-imp-nome'), codigo: '', erro: '', status: '', msg: '', aviso: '', mina: '', vendo: -1, boomDono: undefined, digitando: false, duvida: '', estouro: '' }
  const salvar = () => guarda('mvd-minas', JSON.stringify({ n: ui.n, nomes: ui.nomes, vidas: ui.vidas }))
  let H = null
  let vis = null
  let prazoLocal = 0

  // ---------- anfitrião ----------
  function novoHost(local, pessoas) { H = { local, pessoas, vidas: ui.vidas, J: null, prazo: 0, dur: 0, botEm: 0, seguirEm: 0, fs: '', sig: '', laco: 0 } }
  const nomeBot = () => BOTS.find((n) => !H.pessoas.some((p) => p.nome === n)) || 'Bot ' + H.pessoas.length
  const poeBot = () => H.pessoas.push({ id: 'bot-' + Math.random().toString(36).slice(2, 7), nome: nomeBot(), bot: true, on: true })

  function comecar() {
    const jogam = H.pessoas.filter((p) => p.on)
    if (jogam.length < 2) return
    H.pessoas.forEach((p) => { p.j = jogam.indexOf(p) })
    H.J = M.novoJogo({ jogadores: jogam.map((p) => ({ nome: p.nome, bot: p.bot })), vidas: H.vidas, temas: window.ApostoTemas.todos() })
    H.fs = ''
    clearInterval(H.laco)
    H.laco = setInterval(tick, 150)
    tick()
  }

  function entrou(agora) {
    const J = H.J
    H.prazo = 0
    H.dur = 0
    if (J.fase === 'plantar' && !H.local) { H.prazo = agora + M.TEMPO_PLANTIO; H.dur = M.TEMPO_PLANTIO }
    if (J.fase === 'duelo') { H.prazo = agora + M.TEMPO_VEZ; H.dur = M.TEMPO_VEZ; H.botEm = agora + 1500 + Math.random() * 2000 }
    if (J.fase === 'resultado' || J.fase === 'toaa') H.seguirEm = agora + (J.fase === 'toaa' ? 11000 : 8000)
  }

  function tick() {
    if (!H || !H.J) return
    const J = H.J
    const agora = Date.now()
    const fs = () => [J.rodada, J.fase, J.vez, J.falas.length].join('|')
    if (fs() !== H.fs) { H.fs = fs(); entrou(agora) }
    if (J.fase === 'plantar' && H.prazo && agora >= H.prazo) M.tempoPlantio(J)
    else if (J.fase === 'duelo') {
      const f = M.falando(J)
      if (J.js[f].bot && agora >= H.botEm) M.botFala(J, f)
      else if (agora >= H.prazo) M.tempoVez(J)
    } else if ((J.fase === 'resultado' || J.fase === 'toaa') && !H.local && agora >= H.seguirEm) M.proximo(J)
    if (fs() !== H.fs) { H.fs = fs(); entrou(agora) }
    const sig = [H.fs, J.js.map((p) => p.vidas + '/' + p.minas.length + (p.bot ? 'b' : '')).join(), J.plantando, H.pessoas.map((p) => p.on).join()].join('|')
    if (sig !== H.sig) { H.sig = sig; enviarTudo() }
  }

  function visao(p) {
    const base = { code: sala.st.code, dono: p === H.pessoas[0], vidas: H.vidas, local: H.local }
    if (!H.J || p.j === undefined) return { ...base, fase: 'sala', pessoas: H.pessoas.map((x) => ({ nome: x.nome, bot: !!x.bot, on: x.on, voce: x === p, dono: x === H.pessoas[0] })) }
    const J = H.J
    const copia = (minas) => minas.map((m) => ({ n: m.n, explodiu: m.explodiu }))
    const v = { ...base, fase: J.fase, eu: p.j, rodada: J.rodada, tema: { titulo: J.tema.titulo }, par: [...J.par], falando: J.par[J.vez], dobro: J.dobro,
      ultimo: J.ultimo && { ...J.ultimo }, falas: J.falas.map((f) => ({ ...f })), plantando: J.plantando, evento: J.evento && { ...J.evento },
      js: J.js.map((x) => ({ nome: x.nome, vidas: x.vidas, bot: x.bot, plantou: x.minas.length >= 2, boomsDados: x.boomsDados })),
      resta: H.prazo ? Math.max(0, H.prazo - Date.now()) : 0, dur: H.dur }
    // cada um só vê as próprias minas; num celular só o aparelho guarda todas (e a tela mostra só a de quem está com ele)
    if (H.local) v.todas = J.js.map((x) => copia(x.minas))
    else if (p.j >= 0) v.minhas = copia(J.js[p.j].minas)
    return v
  }

  function enviarTudo() {
    if (!H) return
    for (const p of H.pessoas) if (p.conn && p.on) sala.enviar({ type: 'visao', v: visao(p) }, p.conn)
    receber(visao(H.pessoas[0]))
  }

  function acao(p, msg) {
    const J = H.J
    if (msg.type === 'nome' && !J) { p.nome = String(msg.nome || '').trim().slice(0, 14) || p.nome; enviarTudo(); return null }
    if (!J) return null
    let r = null
    // num celular só, quem age é quem está com o aparelho na vez: planta quem está plantando, fala quem está falando
    const quem = (padrao) => (H.local ? padrao : p.j)
    if (msg.type === 'plantar') r = M.plantar(J, quem(Number(msg.j)), String(msg.texto || '').slice(0, 40))
    if (msg.type === 'falei') M.falei(J, quem(M.falando(J)))
    if (msg.type === 'boom') M.boom(J, quem(Number(msg.dono)), Number(msg.mina), Number(msg.seq))
    if (msg.type === 'duvidar') M.duvidar(J, quem(J.ultimo ? J.par.find((x) => x !== J.ultimo.j) : -1), String(msg.texto || '').slice(0, 40))
    if (msg.type === 'proxima' && (H.local || p === H.pessoas[0])) M.proximo(J)
    tick()
    if (r && p.conn) sala.enviar({ type: 'plantio', r }, p.conn)
    return r
  }
  const fazer = (msg) => {
    if (H) { const r = acao(H.pessoas[0], msg); if (r) plantou(r) } else sala.enviar(msg)
  }
  function plantou(r) { ui.aviso = r.ok ? '' : AVISOS[r.motivo] || ''; if (r.ok) { ui.mina = ''; som('draw') } else som('undo'); render() }

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
      if (msg.type === 'plantio' && msg.r) plantou(msg.r)
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
        if (H.J) p.j = -1
        H.pessoas.push(p)
      }
      Object.assign(p, { conn: de, on: true, nome: String(msg.nome || '').trim().slice(0, 14) || p.nome || 'Jogador ' + H.pessoas.length })
      if (H.J && p.j >= 0 && H.J.js[p.j]) H.J.js[p.j].bot = false
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
    else if (H.J.js[p.j]) H.J.js[p.j].bot = true // caiu: um bot assume (e devolve se voltar)
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
  function estoura(txt) { ui.estouro = txt; clearTimeout(ui._e); ui._e = setTimeout(() => { ui.estouro = ''; render() }, 1400) }
  function sons(a, v) {
    if (v.rodada !== a.rodada) { ui.vendo = -1; ui.boomDono = undefined; ui.digitando = false; ui.aviso = ''; ui.mina = ''; som('draw') }
    if (v.fase === 'duelo' && a.fase === 'plantar') som('sold')
    if (v.falas.length > a.falas.length) som('tick')
    if ((v.fase === 'resultado' || v.fase === 'toaa') && a.fase === 'duelo' && v.evento) {
      ui.boomDono = undefined
      ui.digitando = false
      if (v.evento.tipo === 'boom') { estoura('BOOM!'); som('hammer'); setTimeout(() => som('undo'), 200); try { if (navigator.vibrate) navigator.vibrate([120, 60, 200]) } catch (e) {} }
      else som(v.evento.tipo === 'duvido' && v.evento.vale ? 'tick' : 'hammer')
    }
    if (v.fase === 'toaa' && a.fase !== 'toaa') setTimeout(() => som('win'), 900)
    if (v.fase === 'fim' && a.fase !== 'fim') som('win')
  }

  function render() {
    document.body.classList.toggle('mn-foco', !!vis && vis.fase === 'duelo' && !el.hidden)
    if (!vis) { el.innerHTML = T.entrada(ui); return }
    if (vis.fase === 'sala') { el.innerHTML = T.sala(vis, ui); return }
    ui.local = vis.local
    ui.podeSeguir = vis.local || vis.dono
    if (vis.fase === 'fim') { el.innerHTML = T.fim(vis, ui); return }
    // digitando (mina ou dúvida): não redesenha a tela inteira, pra não apagar o que está sendo escrito
    const campo = document.activeElement && ['mn-mina', 'mn-duvida'].includes(document.activeElement.id) ? document.activeElement : null
    const chave = [vis.fase, vis.rodada, vis.falas.length, vis.plantando, ui.vendo, ui.aviso, ui.boomDono, ui.digitando, ui.estouro, JSON.stringify(vis.minhas || (vis.todas && vis.todas[ui.vendo]) || [])].join('|')
    if (campo && chave === ui.chave) { relogio(); return }
    ui.chave = chave
    el.innerHTML = T.jogo(vis, ui)
    if (campo || ui.focar) { const novo = document.getElementById(campo ? campo.id : ui.focar); ui.focar = ''; if (novo) { novo.focus(); novo.setSelectionRange(novo.value.length, novo.value.length) } }
    relogio()
  }

  let ultimoSeg = -1
  function relogio() {
    if (!vis || !vis.dur) { el.querySelectorAll('.mn-relogio').forEach((r) => { r.hidden = true }); return }
    const resta = Math.max(0, prazoLocal - performance.now())
    const seg = Math.ceil(resta / 1000)
    el.querySelectorAll('[data-x="barra"]').forEach((b) => { b.style.width = (100 * resta) / vis.dur + '%' })
    el.querySelectorAll('[data-x="seg"]').forEach((b) => { b.textContent = seg })
    el.querySelectorAll('.mn-relogio').forEach((r) => r.classList.toggle('acabando', seg <= 3))
    if (vis.fase === 'duelo' && seg <= 3 && seg > 0 && seg !== ultimoSeg) som('tick')
    ultimoSeg = seg
  }
  setInterval(() => { if (vis && !el.hidden && (vis.fase === 'duelo' || vis.fase === 'plantar')) relogio() }, 100)

  function sair() {
    if (H) clearInterval(H.laco)
    H = null
    if (sala.st.status !== 'off') sala.sair()
    vis = null
    render()
  }

  // ---------- botões ----------
  const nomesLocais = () => Array.from({ length: ui.n }, (_, i) => (ui.nomes[i] || '').trim() || `Jogador ${i + 1}`)
  const valor = (id) => (document.getElementById(id) || {}).value || ''
  const acoes = {
    n: (v) => { ui.n = Math.min(7, Math.max(2, ui.n + Number(v))); salvar(); render() },
    vidas: (v) => { if (H && !H.J) { H.vidas = Number(v); enviarTudo() } else { ui.vidas = Number(v); salvar(); render() } },
    local: () => { novoHost(true, nomesLocais().map((nome, i) => ({ id: 'l' + i, nome, on: true }))); comecar() },
    bots: () => { novoHost(true, [{ id: 'l0', nome: ui.meuNome || 'Você', on: true }]); for (let k = 0; k < 3; k++) poeBot(); comecar() },
    criar: () => { novoHost(false, [{ id: MEU_ID, conn: null, nome: ui.meuNome || 'Jogador 1', on: true }]); ui.erro = ''; sala.criar() },
    entrar: () => { ui.codigo = valor('mn-codigo'); ui.erro = ''; sala.entrar(ui.codigo) },
    'poe-bot': () => { if (H && !H.J && H.pessoas.length < 7) { poeBot(); enviarTudo() } },
    'tira-bot': (v) => { if (H && !H.J && H.pessoas[v] && H.pessoas[v].bot) { H.pessoas.splice(Number(v), 1); enviarTudo() } },
    convite: () => {
      const link = location.origin + location.pathname + '#minas-' + sala.st.code
      const ok = () => { ui.msg = 'Convite copiado! Manda pros amigos.'; render() }
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(ok, () => { ui.msg = link; render() })
      else { ui.msg = link; render() }
    },
    comecar: () => { if (H && !H.J) comecar() },
    ver: (v) => { ui.vendo = Number(v); ui.aviso = ''; ui.focar = 'mn-mina'; render() },
    esconder: () => { ui.vendo = -1; render() },
    plantar: () => { const t = valor('mn-mina'); if (t.trim().length >= 2) fazer({ type: 'plantar', texto: t, j: ui.vendo }) },
    falei: () => fazer({ type: 'falei' }),
    'boom-abre': () => { ui.boomDono = null; render() },
    'boom-dono': (v) => { ui.boomDono = Number(v); render() },
    'boom-fecha': () => { ui.boomDono = undefined; render() },
    boom: (v, b) => { fazer({ type: 'boom', dono: Number(b.dataset.dono), mina: Number(v), seq: vis.ultimo ? vis.ultimo.seq : 0 }); ui.boomDono = undefined },
    'abre-duvida': () => { ui.digitando = true; ui.duvida = ''; ui.focar = 'mn-duvida'; render() },
    'fecha-duvida': () => { ui.digitando = false; render() },
    duvidar: () => { const t = valor('mn-duvida'); if (t.trim().length < 2) return; ui.digitando = false; fazer({ type: 'duvidar', texto: t }) },
    proxima: () => { if (H && H.J) fazer({ type: 'proxima' }) },
    denovo: () => { if (H) comecar() },
    sair: () => sair(),
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-m]')
    if (!b || b.disabled || !acoes[b.dataset.m]) return
    acoes[b.dataset.m](b.dataset.v, b)
  })
  el.addEventListener('input', (ev) => {
    const m = ev.target.id && ev.target.id.match(/^mn-nome-(\d)$/)
    if (m) { ui.nomes[Number(m[1])] = ev.target.value.slice(0, 14); salvar() }
    if (ev.target.id === 'mn-meu') { ui.meuNome = ev.target.value.slice(0, 14); guarda('mvd-imp-nome', ui.meuNome) }
    if (ev.target.id === 'mn-codigo') ui.codigo = ev.target.value
    if (ev.target.id === 'mn-mina') ui.mina = ev.target.value
    if (ev.target.id === 'mn-duvida') ui.duvida = ev.target.value
  })
  el.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return
    if (ev.target.id === 'mn-codigo') acoes.entrar()
    if (ev.target.id === 'mn-mina') acoes.plantar()
    if (ev.target.id === 'mn-duvida') acoes.duvidar()
  })

  window.Minas = {
    letreiro: () => ['Minas do <em>Multiverso</em>', 'fale um nome… se for mina, BOOM'],
    esconder() { document.body.classList.remove('mn-foco') },
    abrir() { ui.meuNome = guarda('mvd-imp-nome') || ui.meuNome; render() },
    entrar(code) { ui.codigo = code; sala.entrar(code) },
  }
})()
