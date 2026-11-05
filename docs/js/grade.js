// Grade do Multiverso: liga o motor (grade-motor.js), as telas (grade-telas.js) e a sala online (sala.js). É 1 contra 1.
// Num celular só os dois jogam no mesmo aparelho, passando a vez. Online, quem cria a sala é o anfitrião e manda no jogo.
(function () {
  const M = window.GradeMotor
  const T = window.GradeTelas
  const X = window.Sfx
  const el = document.getElementById('grade')
  const sala = window.Sala.nova({ prefixo: 'mvgrade-v1-', chave: 'mvd-sala-grade' })
  const t = (pt, en) => window.Lingua.t(pt, en)
  const ERROS = {
    servidor: () => t('Sem conexão com o servidor da sala. Confere a internet.', 'No connection to the room server. Check your internet.'),
    codigo: () => t('O código tem 4 letras ou números.', 'The code has 4 letters or numbers.'),
    naoAchei: () => t('Não achei essa sala. Confere o código com quem criou.', 'Could not find that room. Check the code with the host.'),
    naoConectou: () => t('Não conectou. Quem criou a sala está com o site aberto?', 'Could not connect. Does the host have the site open?'),
    caiu: () => t('A sala fechou ou a conexão caiu.', 'The room closed or the connection dropped.'),
    cheia: () => t('Essa sala já tem dois jogadores.', 'This room already has two players.'),
  }
  const som = (f, p) => { if (X && X.on) X[f](p) }
  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  const MEU_ID = (() => {
    let v = ''
    try { v = sessionStorage.getItem('mvd-grade-id') || '' } catch (e) {}
    if (!v) { v = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mvd-grade-id', v) } catch (e) {} }
    return v
  })()

  const salvo = (() => { try { return JSON.parse(localStorage.getItem('mvd-grade') || '{}') } catch (e) { return {} } })()
  const ui = { tam: [3, 4, 5].includes(salvo.tam) ? salvo.tam : 3, roubar: salvo.roubar === true, relogio: [0, 30, 60].includes(salvo.relogio) ? salvo.relogio : 0,
    nomes: Array.isArray(salvo.nomes) ? salvo.nomes.slice(0, 2) : [], meuNome: guarda('mvd-imp-nome'), codigo: '', erro: '', status: '', msg: '',
    casa: -1, busca: '', aviso: '', dica: '', revela: -1, nova: -1, treme: -1, estouro: '', visto: 0 }
  const salvar = () => guarda('mvd-grade', JSON.stringify({ tam: ui.tam, roubar: ui.roubar, relogio: ui.relogio, nomes: ui.nomes }))
  let H = null
  let vis = null
  let prazoLocal = 0

  // ---------- anfitrião ----------
  function novoHost(local, pessoas) { H = { local, pessoas, tam: ui.tam, roubar: ui.roubar, relogio: ui.relogio, J: null, comeca: Math.round(Math.random()), vitorias: [0, 0], prazo: 0, dur: 0, botEm: 0, fs: '', sig: '', laco: 0, contou: false } }
  const poeBot = () => H.pessoas.push({ id: 'bot-' + Math.random().toString(36).slice(2, 7), nome: 'JARVIS', bot: true, on: true })

  function comecar() {
    const jogam = H.pessoas.filter((p) => p.on).slice(0, 2)
    if (jogam.length < 2) return
    H.pessoas.forEach((p) => { p.j = jogam.indexOf(p) })
    H.J = M.novoJogo({ N: H.tam, roubar: H.roubar, comeca: H.comeca, jogadores: jogam.map((p) => ({ nome: p.nome, bot: p.bot, nivel: 0.72 })) })
    H.comeca = 1 - H.comeca // na próxima, começa o outro
    H.fs = ''
    H.contou = false
    clearInterval(H.laco)
    H.laco = setInterval(tick, 200)
    tick()
  }

  function tick() {
    if (!H || !H.J) return
    const J = H.J
    const agora = Date.now()
    const fs = () => [J.fase, J.vez, J.seq].join('|')
    if (fs() !== H.fs) {
      H.fs = fs()
      H.prazo = J.fase === 'jogo' && H.relogio ? agora + H.relogio * 1000 : 0
      H.dur = H.prazo ? H.relogio * 1000 : 0
      H.botEm = agora + 1800 + Math.random() * 1800
    }
    if (J.fase === 'jogo') {
      if (J.js[J.vez].bot && agora >= H.botEm) {
        const b = M.botJogada(J, J.vez)
        if (b.passar) M.passar(J, J.vez)
        else M.jogar(J, J.vez, b.casa, b.key)
      } else if (H.prazo && agora >= H.prazo) M.passar(J, J.vez, true)
    }
    if (J.fase === 'fim' && !H.contou) { H.contou = true; if (J.fim.ganhou >= 0) H.vitorias[J.fim.ganhou] += 1 }
    const sig = [fs(), H.pessoas.map((p) => p.on + p.nome).join()].join('|')
    if (sig !== H.sig) { H.sig = sig; enviarTudo() }
  }

  function visao(p) {
    const base = { code: sala.st.code, dono: p === H.pessoas[0], local: H.local, tam: H.tam, roubar: H.roubar, relogio: H.relogio }
    if (!H.J) return { ...base, fase: 'sala', pessoas: H.pessoas.map((x) => ({ nome: x.nome, bot: !!x.bot, on: x.on, voce: x === p, dono: x === H.pessoas[0] })) }
    const J = H.J
    return { ...base, fase: J.fase, eu: p.j, N: J.N, roubar: J.roubar, linhas: [...J.linhas], colunas: [...J.colunas],
      casas: J.casas.map((c) => c && { ...c }), usados: [...J.usados], vez: J.vez, ultimo: J.ultimo && { ...J.ultimo, falhou: J.ultimo.falhou && [...J.ultimo.falhou] },
      fim: J.fim && { ...J.fim }, vitorias: [...H.vitorias],
      js: J.js.map((x, i) => ({ nome: x.nome, bot: x.bot, casas: M.contaCasas(J, i) })),
      resta: H.prazo ? Math.max(0, H.prazo - Date.now()) : 0, dur: H.dur }
  }

  function enviarTudo() {
    if (!H) return
    for (const p of H.pessoas) if (p.conn && p.on) sala.enviar({ type: 'visao', v: visao(p) }, p.conn)
    receber(visao(H.pessoas[0]))
  }

  function acao(p, msg) {
    const J = H.J
    if (msg.type === 'nome' && !J) { p.nome = String(msg.nome || '').trim().slice(0, 14) || p.nome; enviarTudo(); return }
    if (!J) return
    // num celular só, o aparelho joga por quem está na vez
    const quem = H.local ? J.vez : p.j
    if (quem < 0 || quem === undefined || (J.js[quem] && J.js[quem].bot)) return
    if (msg.type === 'jogar') {
      const r = M.jogar(J, quem, Number(msg.casa), String(msg.key || ''))
      if (r && r.usado) avisar(p, String(msg.key))
    }
    if (msg.type === 'passar') M.passar(J, quem)
    tick()
  }
  const fazer = (msg) => { if (H) acao(H.pessoas[0], msg); else sala.enviar(msg) }
  // escolheu alguém que já foi usado: só quem escolheu fica sabendo (não perde a vez)
  function avisar(p, key) { if (p === H.pessoas[0]) jaUsado(key); else if (p.conn) sala.enviar({ type: 'usado', key }, p.conn) }
  function jaUsado(key) { ui.aviso = t(`${T.nome(key)} já foi usado. Escolha outro.`, `${T.nome(key)} was already used. Pick someone else.`); som('undo'); limpaAviso(); render() }
  function limpaAviso() { clearTimeout(ui._a); ui._a = setTimeout(() => { ui.aviso = ''; render() }, 2600) }

  // ---------- sala online ----------
  sala.aoStatus = (st) => {
    if (st.status === 'off') { if (H && !H.local) { clearInterval(H.laco); H = null } if (!H) vis = null; ui.erro = st.erro ? (ERROS[st.erro] || ERROS.caiu)() : ''; ui.status = '' }
    if (st.status === 'creating' || st.status === 'joining') ui.status = t('Conectando…', 'Connecting…')
    if (st.status === 'hosting' && H) { ui.status = ''; enviarTudo() }
    if (st.status === 'connected') sala.enviar({ type: 'oi', id: MEU_ID, nome: ui.meuNome })
    render()
  }
  sala.aoDados = (msg, de) => {
    if (!msg || typeof msg !== 'object') return
    if (de === 'host') {
      if (msg.type === 'cheia') { sala.sair(); ui.erro = ERROS.cheia(); render(); return }
      if (msg.type === 'usado') jaUsado(String(msg.key || ''))
      if (msg.type === 'visao' && msg.v) receber(msg.v)
      return
    }
    if (!H) return
    if (msg.type === 'oi') {
      const id = String(msg.id || '').slice(0, 20)
      let p = H.pessoas.find((x) => x.id === id)
      if (!p) {
        // é 1 contra 1: um bot que estava esperando sai pra dar lugar a uma pessoa
        const bot = H.pessoas.findIndex((x) => x.bot)
        if (!H.J && bot > 0) H.pessoas.splice(bot, 1)
        if (!id || H.pessoas.length >= 2) { sala.enviar({ type: 'cheia' }, de); setTimeout(() => sala.fechar(de), 300); return }
        p = { id, conn: de, nome: '', on: true }
        H.pessoas.push(p)
      }
      Object.assign(p, { conn: de, on: true, nome: String(msg.nome || '').trim().slice(0, 14) || p.nome || t('Jogador 2', 'Player 2') })
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
    else if (H.J.js[p.j]) H.J.js[p.j].bot = true // caiu no meio: o bot assume até ele voltar
    H.sig = ''
    enviarTudo()
  }

  // ---------- desenho ----------
  function receber(v) {
    const a = vis
    vis = v
    prazoLocal = performance.now() + (v.resta || 0)
    if (v.fase === 'jogo' || v.fase === 'fim') novidades(a, v)
    render()
  }
  function estoura(txt) { ui.estouro = txt; clearTimeout(ui._e); ui._e = setTimeout(() => { ui.estouro = ''; render() }, 1300) }
  function novidades(a, v) {
    const u = v.ultimo
    if (!a || a.fase === 'sala' || (a.fase === 'fim' && v.fase === 'jogo')) { ui.casa = -1; ui.busca = ''; ui.revela = -1; ui.visto = u ? u.seq : 0; som('draw'); return }
    if (u && u.seq !== ui.visto) {
      ui.visto = u.seq
      ui.aviso = ''
      if (u.ok) { ui.nova = u.casa; som('sold'); if (u.roubou >= 0) estoura(t('ROUBOU!', 'STOLEN!')) }
      else if (u.passou) som('tick')
      else { ui.treme = u.casa; som('undo') }
      clearTimeout(ui._n)
      ui._n = setTimeout(() => { ui.nova = -1; ui.treme = -1; render() }, 900)
      // a vez passou: fecha a ficha
      ui.casa = -1
      ui.busca = ''
    }
    if (v.fase === 'fim' && a.fase !== 'fim') { ui.casa = -1; setTimeout(() => som('win'), 350); if (v.fim.motivo === 'linha') estoura(t('LINHA!', 'LINE!')) }
  }

  function render() {
    // durante a partida a tela é só do grid (sem o toldo), pra caber no celular
    document.body.classList.toggle('gd-foco', !!vis && (vis.fase === 'jogo' || vis.fase === 'fim') && !el.hidden)
    if (!vis) { el.innerHTML = T.entrada(ui); return }
    if (vis.fase === 'sala') { el.innerHTML = T.sala(vis, ui); return }
    ui.local = vis.local
    ui.podeSeguir = vis.local || vis.dono
    ui.souVez = vis.fase === 'jogo' && (vis.local ? !vis.js[vis.vez].bot : vis.eu === vis.vez)
    if (!ui.souVez) { ui.casa = -1; ui.busca = '' }
    // digitando o nome: só troca a lista de sugestões, pra não perder o que está sendo escrito
    const campo = document.activeElement && document.activeElement.id === 'gd-busca' ? document.activeElement : null
    const chave = [vis.fase, vis.vez, vis.ultimo && vis.ultimo.seq, ui.casa, ui.aviso, ui.dica, ui.revela, ui.nova, ui.treme, ui.estouro, window.Lingua.atual()].join('|')
    if (campo && chave === ui.chave) { relogio(); return }
    ui.chave = chave
    el.innerHTML = T.jogo(vis, ui)
    const busca = document.getElementById('gd-busca')
    if (busca && (campo || ui.focar)) { ui.focar = false; busca.focus(); busca.setSelectionRange(busca.value.length, busca.value.length) }
    relogio()
  }
  function sugerir() {
    const s = document.getElementById('gd-sugestoes')
    if (s && vis) s.innerHTML = T.sugestoes(vis, ui)
  }

  let ultimoSeg = -1
  function relogio() {
    const caixa = el.querySelector('.gd-relogio')
    if (!caixa || !vis || !vis.dur) return
    const resta = Math.max(0, prazoLocal - performance.now())
    const seg = Math.ceil(resta / 1000)
    caixa.querySelector('[data-x="barra"]').style.width = (100 * resta) / vis.dur + '%'
    caixa.querySelector('[data-x="seg"]').textContent = seg
    caixa.classList.toggle('acabando', seg <= 5)
    if (ui.souVez && seg <= 5 && seg > 0 && seg !== ultimoSeg) som('tick')
    ultimoSeg = seg
  }
  setInterval(() => { if (vis && !el.hidden && vis.fase === 'jogo') relogio() }, 100)

  function sair() {
    if (H) clearInterval(H.laco)
    H = null
    if (sala.st.status !== 'off') sala.sair()
    vis = null
    ui.casa = -1
    render()
  }

  // ---------- botões ----------
  const nomesLocais = () => [0, 1].map((i) => (ui.nomes[i] || '').trim() || `${t('Jogador', 'Player')} ${i + 1}`)
  const valor = (id) => (document.getElementById(id) || {}).value || ''
  // muda uma opção: na sala (antes de começar) vale pra todo mundo; fora dela, fica guardada neste aparelho
  function opcao(k, v) {
    const alvo = H && !H.J ? H : ui
    alvo[k] = v
    if (alvo === H) enviarTudo(); else { salvar(); render() }
  }
  const acoes = {
    tam: (v) => opcao('tam', Math.min(5, Math.max(3, Number(v)))),
    roubar: (v) => opcao('roubar', v === '1'),
    relogio: (v) => opcao('relogio', Number(v)),
    local: () => { novoHost(true, nomesLocais().map((nome, i) => ({ id: 'l' + i, nome, on: true }))); comecar() },
    bot: () => { novoHost(true, [{ id: 'l0', nome: ui.meuNome || (ui.nomes[0] || '').trim() || t('Você', 'You'), on: true }]); poeBot(); comecar() },
    criar: () => { novoHost(false, [{ id: MEU_ID, conn: null, nome: ui.meuNome || t('Jogador 1', 'Player 1'), on: true }]); ui.erro = ''; sala.criar() },
    entrar: () => { ui.codigo = valor('gd-codigo'); ui.erro = ''; sala.entrar(ui.codigo) },
    'poe-bot': () => { if (H && !H.J && H.pessoas.length < 2) { poeBot(); enviarTudo() } },
    'tira-bot': (v) => { if (H && !H.J && H.pessoas[v] && H.pessoas[v].bot) { H.pessoas.splice(Number(v), 1); enviarTudo() } },
    convite: () => {
      const link = location.origin + location.pathname + '#grade-' + sala.st.code
      const ok = () => { ui.msg = t('Convite copiado! Manda pro seu adversário.', 'Invite copied! Send it to your opponent.'); render() }
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(ok, () => { ui.msg = link; render() })
      else { ui.msg = link; render() }
    },
    comecar: () => { if (H && !H.J) comecar() },
    dica: (v) => { ui.dica = ui.dica === v ? '' : v; render() },
    casa: (v) => {
      const i = Number(v)
      if (vis.fase === 'fim') { ui.revela = ui.revela === i ? -1 : i; render(); return }
      if (!ui.souVez) return
      const c = vis.casas[i]
      if (c && !(vis.roubar && c.dono !== vis.vez)) { ui.aviso = c.dono === vis.vez ? t('Essa casa já é sua.', 'That square is already yours.') : t('Essa casa já tem dono (no clássico não dá pra roubar).', 'That square is taken (no stealing in classic).'); limpaAviso(); render(); return }
      ui.casa = ui.casa === i ? -1 : i
      ui.busca = ''
      ui.focar = ui.casa >= 0
      render()
      if (ui.casa >= 0) { const f = document.getElementById('gd-ficha'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }
    },
    fecha: () => { ui.casa = -1; ui.busca = ''; render() },
    escolhe: (key) => { if (ui.casa < 0) return; fazer({ type: 'jogar', casa: ui.casa, key }); ui.busca = '' },
    passar: () => { ui.casa = -1; fazer({ type: 'passar' }) },
    denovo: () => { if (H) comecar() },
    sair: () => sair(),
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-g]')
    if (!b || b.disabled || !acoes[b.dataset.g] || b.type === 'range') return
    acoes[b.dataset.g](b.dataset.v, b)
  })
  el.addEventListener('input', (ev) => {
    const m = ev.target.id && ev.target.id.match(/^gd-nome-(\d)$/)
    if (m) { ui.nomes[Number(m[1])] = ev.target.value.slice(0, 14); salvar() }
    if (ev.target.id === 'gd-meu') { ui.meuNome = ev.target.value.slice(0, 14); guarda('mvd-imp-nome', ui.meuNome) }
    if (ev.target.id === 'gd-codigo') ui.codigo = ev.target.value
    if (ev.target.id === 'gd-busca') { ui.busca = ev.target.value; sugerir() }
    if (ev.target.dataset && ev.target.dataset.g === 'tam') {
      // o rótulo do slider acompanha o dedo; a mudança vale quando solta
      const n = Number(ev.target.value)
      const box = ev.target.closest('.gd-slider')
      if (box) { box.querySelector('b').textContent = n + '×' + n; box.querySelector('small').textContent = (n === 3 ? t('jogo da velha · ', 'tic-tac-toe · ') : '') + t(`faça ${n} em linha`, `get ${n} in a row`) }
    }
  })
  el.addEventListener('change', (ev) => { if (ev.target.dataset && ev.target.dataset.g === 'tam') acoes.tam(ev.target.value) })
  el.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return
    if (ev.target.id === 'gd-codigo') acoes.entrar()
    if (ev.target.id === 'gd-busca') {
      // Enter escolhe o primeiro da lista que ainda não foi usado
      const k = T.achar(ui.busca).find((x) => !vis.usados.includes(x))
      if (k) acoes.escolhe(k)
    }
  })

  // trocou a língua: redesenha (o jogo não muda, só a escrita)
  window.Lingua.aoMudar(() => { if (!el.hidden) { ui.chave = ''; render() } })

  window.Grade = {
    letreiro: () => [t('Grade do <em>Multiverso</em>', 'Multiverse <em>Grid</em>'), t('um personagem que vale nas duas · feche a linha', 'one character that fits both · fill the line')],
    esconder() { document.body.classList.remove('gd-foco') },
    abrir() { ui.meuNome = guarda('mvd-imp-nome') || ui.meuNome; render() },
    entrar(code) { ui.codigo = code; sala.entrar(code) },
  }
})()
