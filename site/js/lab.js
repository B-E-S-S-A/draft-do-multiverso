// Laboratório do Alto Evolucionário: liga o motor (lab-motor.js), as telas (lab-telas.js) e a sala online (mesa.js).
// Num celular só, cada um monta o herói inteiro escondido e o aparelho passa de mão em mão. Online, todos veem o mesmo personagem na hora.
(function () {
  const M = window.LabMotor
  const T = window.LabTelas
  const X = window.Sfx
  const el = document.getElementById('lab')
  const t = (pt, en) => window.Lingua.t(pt, en)
  const som = (f) => { if (X && X.on) X[f]() }
  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  const salvo = (() => { try { return JSON.parse(localStorage.getItem('mvd-lab') || '{}') } catch (e) { return {} } })()
  const listaOk = (x) => Array.isArray(x) && x.length >= M.MIN_TOPICOS && x.length <= M.MAX_TOPICOS && x.every((y) => typeof y === 'string')
  const ui = { n: Number.isInteger(salvo.n) && salvo.n >= M.MIN && salvo.n <= M.MAX ? salvo.n : 4, nomes: Array.isArray(salvo.nomes) ? salvo.nomes.slice(0, 8) : [], topicos: listaOk(salvo.topicos) ? salvo.topicos.map((x) => x.slice(0, 14)) : [...M.PADRAO],
    meuNome: guarda('mvd-imp-nome'), codigo: '', msg: '', viu: -1, precisaPassar: false, podeSeguir: false, novo: false, pers: '', trava: 0 }
  const salvar = () => guarda('mvd-lab', JSON.stringify({ n: ui.n, nomes: ui.nomes, topicos: ui.topicos }))
  let prazoLocal = 0

  const m = window.Mesa.nova({
    prefixo: 'mvlab-v2-', chave: 'lab', max: M.MAX,
    opcoes: (H) => ({ topicos: H.topicos }),
    visao,
    acao,
    tick,
    aoVisao: novaVisao,
    aoMudar: render,
    aoCair: (p, H) => { if (H.J.js[p.j]) H.J.js[p.j].bot = true },
    aoVoltar: (p, H) => { if (H.J.js[p.j]) H.J.js[p.j].bot = false },
  })

  // ---------- anfitrião ----------
  function comecar() {
    const H = m.H
    const jogam = H.pessoas.filter((p) => p.on)
    if (jogam.length < M.MIN) return
    H.pessoas.forEach((p) => { p.j = jogam.indexOf(p) })
    const soPessoasNoMesmoCelular = H.local && !jogam.some((p) => p.bot)
    H.J = M.novoJogo({ modo: soPessoasNoMesmoCelular ? 'turno' : 'junto', topicos: H.topicos, jogadores: jogam.map((p) => ({ nome: p.nome, bot: p.bot })) })
    H.fs = ''
    H.sig = ''
    m.ligarLaco()
    tick(H)
  }
  // num celular só, o aparelho faz por quem é o próximo que falta
  const proximoHumano = (J) => { const j = M.pendentes(J).find((x) => !J.js[x].bot); return j === undefined ? -1 : j }

  function tick(H) {
    const J = H.J
    if (!J) return
    const agora = Date.now()
    const fs = [J.fase, J.fase === 'montar' ? M.rodada(J) : '', J.nDuelo, J.historia.length].join('|')
    if (fs !== H.fs) {
      H.fs = fs
      const dur = H.local ? 0 : J.fase === 'montar' ? M.PRAZO_COLOCAR : J.fase === 'duelo' ? M.PRAZO_VOTAR : 0
      H.prazo = dur ? agora + dur : 0
      H.dur = dur
      H.botEm = J.js.map(() => agora + (J.fase === 'montar' ? 400 + Math.random() * 1000 : 1500 + Math.random() * 3000))
    }
    if (J.fase === 'montar' || J.fase === 'duelo') {
      for (const j of M.pendentes(J)) {
        if (!J.js[j].bot || agora < H.botEm[j]) continue
        if (J.fase === 'montar') M.autoColocar(J, j)
        else if (J.fase === 'duelo') M.autoVotar(J, j)
      }
      if (H.prazo && agora >= H.prazo && (J.fase === 'montar' || J.fase === 'duelo')) M.forcar(J)
    }
    const sig = [J.seq, H.pessoas.map((p) => p.on + p.nome).join()].join('|')
    if (sig !== H.sig) { H.sig = sig; m.enviarTudo() }
  }

  function visao(p, H) {
    const J = H.J
    const eu = H.local ? proximoHumano(J) : p.j
    const base = { fase: J.fase, eu, seq: J.seq, topicos: J.topicos, js: J.js.map((x) => ({ nome: x.nome, bot: x.bot })), humanos: H.local ? J.js.filter((x) => !x.bot).length : 1,
      faltam: M.pendentes(J).map((j) => J.js[j].nome), resta: H.prazo ? Math.max(0, H.prazo - Date.now()) : 0, dur: H.dur || 0 }
    if (J.fase === 'montar') {
      // num celular só com bots, depois que a pessoa termina continua mostrando o herói dela
      const quem = eu >= 0 ? eu : H.local ? H.pessoas[0].j : -1
      return { ...base, meu: quem >= 0 ? { heroi: [...J.js[quem].heroi], pers: M.daVez(J, quem), n: M.colocados(J, quem) } : null }
    }
    if (J.fase === 'fim') {
      return { ...base, campeaoJ: J.campeao, campeao: { heroi: [...J.js[J.campeao].heroi], donoNome: J.js[J.campeao].nome },
        historia: J.historia.map((d) => ({ ganhou: J.js[d.ganhou].nome, perdeu: J.js[d.ganhou === d.a ? d.b : d.a].nome, placar: [...d.placar].sort((x, y) => y - x), desempate: d.desempate, vivos: d.vivos })) }
    }
    const d = J.duelo
    const ultimo = !J.fila.length && J.proxima.length === 0
    const dados = { ...base, duelo: { a: [...J.js[d.a].heroi], b: [...J.js[d.b].heroi], vivos: J.vivos, nDuelo: J.nDuelo, total: J.totalRodada, ultimo },
      podeVotar: eu >= 0 && M.podeVotar(J, eu), meu: { noDuelo: !H.local && (p.j === d.a || p.j === d.b) } }
    if (J.fase === 'resultado') dados.resultado = { ganhouJ: d.ganhou, ganhou: d.ganhou === d.a ? 'a' : 'b', placar: d.placar, desempate: d.desempate, donos: [J.js[d.a].nome, J.js[d.b].nome] }
    return dados
  }

  function acao(p, msg) {
    const H = m.H
    const J = H.J
    if (!J) return
    const manda = H.local || p === H.pessoas[0]
    if (msg.type === 'seguir' && manda) M.seguir(J)
    else if (msg.type === 'denovo' && manda && J.fase === 'fim') { comecar(); return }
    else {
      const quem = H.local ? proximoHumano(J) : p.j
      if (quem === undefined || quem < 0 || J.js[quem].bot) return
      if (msg.type === 'coloca') M.colocar(J, quem, Number(msg.topico))
      if (msg.type === 'voto') M.votar(J, quem, String(msg.lado || ''))
    }
    tick(H)
  }

  // ---------- desenho ----------
  function novaVisao(a, v) {
    prazoLocal = performance.now() + (v.resta || 0)
    if (v.fase !== 'sala') novidades(a, v)
    render()
  }
  function novidades(a, v) {
    const U = window.Uatu
    if (!a || a.fase === 'sala' || a.fase === 'fim') { ui.viu = -1; ui.pers = '' }
    // saiu personagem novo: uma batidinha, e por um instante não aceita toque (pra um toque duplo não gastar o próximo)
    const pers = v.fase === 'montar' && v.meu ? v.meu.pers || '' : ''
    ui.novo = !!pers && pers !== ui.pers
    if (ui.novo) { som('draw'); ui.trava = Date.now() + 350 }
    if (v.fase === 'montar') ui.pers = pers
    if (v.fase !== 'resultado') fecharVigia()
    const duelo = (x) => (x && x.duelo ? x.duelo.vivos + '-' + x.duelo.nDuelo : '')
    if (v.fase === 'duelo' && duelo(a) !== duelo(v)) { som('draw'); ui.viu = -1; if (U) U.momento('lab-duelo') }
    if (v.fase === 'resultado' && (!a || a.fase !== 'resultado')) {
      som('sold')
      if (v.resultado.desempate) abrirVigia(v)
      if (v.resultado.desempate && !v.local && v.resultado.ganhouJ === v.eu && window.Conquistas) window.Conquistas.liga('labvigia')
    }
    if (v.fase === 'fim' && (!a || a.fase !== 'fim')) {
      setTimeout(() => som('win'), 200)
      if (U) U.momento('lab-campeao', { nome: v.campeao.donoNome })
      if (!v.local && v.campeaoJ === v.eu && window.Conquistas) window.Conquistas.vitoria('lab')
    }
  }

  // deu empate: tela cheia com o Vigia. Ele aparece, fala, fica indo de um herói pro outro e escolhe. Toque pra pular.
  let vigia = null
  function fecharVigia() {
    if (!vigia) return
    vigia.tempos.forEach(clearTimeout)
    vigia.el.remove()
    vigia = null
  }
  function abrirVigia(v) {
    fecharVigia()
    const caixa = document.createElement('div')
    caixa.className = 'lab-vigia'
    caixa.setAttribute('role', 'dialog')
    caixa.innerHTML = T.vigia(v)
    document.body.appendChild(caixa)
    const eu = { el: caixa, tempos: [] }
    vigia = eu
    const aos = (ms, f) => eu.tempos.push(setTimeout(f, ms))
    const op = (x) => caixa.querySelector(`[data-x="${x}"]`)
    const acende = (x) => { op('a').classList.toggle('on', x === 'a'); op('b').classList.toggle('on', x === 'b') }
    som('draw')
    aos(1100, () => caixa.classList.add('fala'))
    aos(2400, () => caixa.classList.add('escolhe'))
    // vai de um pro outro, cada vez mais devagar, e termina em quem ganhou
    const g = v.resultado.ganhou
    const outro = g === 'a' ? 'b' : 'a'
    const passos = [g, outro, g, outro, g, outro, g, outro, g]
    let quando = 2500
    passos.forEach((x, i) => { aos(quando, () => { acende(x); som('tick') }); quando += 130 + i * 42 })
    aos(quando + 250, () => { caixa.classList.add('decidiu'); som('win') })
    aos(quando + 3400, fecharVigia)
    aos(900, () => caixa.addEventListener('click', fecharVigia))
  }

  function render() {
    const v = m.vis
    if (!v) { el.innerHTML = T.entrada(ui, m); return }
    if (v.fase === 'sala') {
      // o dono está escrevendo um tópico: não redesenha embaixo do dedo dele
      const foco = document.activeElement && document.activeElement.id
      if (!(foco && foco.startsWith('lab-top-'))) el.innerHTML = T.sala(v, ui)
      return
    }
    ui.podeSeguir = v.local || v.dono
    // mais de uma pessoa no mesmo celular: antes de cada uma, a tela de passar
    ui.precisaPassar = v.local && v.humanos > 1 && v.eu >= 0 && ui.viu !== v.eu && (v.fase === 'montar' || (v.fase === 'duelo' && v.podeVotar))
    el.innerHTML = T.jogo(v, ui)
    relogio()
  }
  function relogio() {
    const caixa = document.getElementById('lab-relogio')
    const v = m.vis
    if (!caixa || !v || !v.dur) return
    const resta = Math.max(0, prazoLocal - performance.now())
    caixa.querySelector('[data-x="barra"]').style.width = (100 * resta) / v.dur + '%'
    caixa.querySelector('[data-x="seg"]').textContent = Math.ceil(resta / 1000)
    caixa.classList.toggle('acabando', resta < 5000)
  }
  setInterval(() => { if (m.vis && !el.hidden && (m.vis.fase === 'montar' || m.vis.fase === 'duelo')) relogio() }, 100)

  // ---------- botões ----------
  const nomesLocais = () => Array.from({ length: ui.n }, (_, i) => (ui.nomes[i] || '').trim() || `${t('Jogador', 'Player')} ${i + 1}`)
  const valor = (id) => (document.getElementById(id) || {}).value || ''
  // os tópicos: na sala valem pra todo mundo; fora dela, ficam guardados neste aparelho
  const alvoTopicos = () => (m.H && !m.H.J ? m.H : ui)
  function mudouTopicos(a) {
    if (a === ui) salvar()
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur()
    if (a === ui) render(); else m.enviarTudo()
  }
  const BOTS = ['JARVIS', 'F.R.I.D.A.Y.', 'Ultron', 'E.D.I.T.H.', 'Visão', 'Rocket', 'Groot']
  const acoes = {
    n: (v) => { ui.n = Math.min(M.MAX, Math.max(M.MIN, ui.n + Number(v))); salvar(); render() },
    'mais-topico': () => { const a = alvoTopicos(); if (a.topicos.length < M.MAX_TOPICOS) { a.topicos.push(''); mudouTopicos(a); const n = document.getElementById('lab-top-' + (a.topicos.length - 1)); if (n) n.focus() } },
    'topicos-padrao': () => { const a = alvoTopicos(); a.topicos = [...M.PADRAO]; mudouTopicos(a) },
    local: () => { m.host(true, nomesLocais().map((nome, i) => ({ id: 'l' + i, nome, on: true })), { topicos: ui.topicos }); comecar() },
    bots: () => { m.host(true, [{ id: 'l0', nome: ui.meuNome || (ui.nomes[0] || '').trim() || t('Você', 'You'), on: true }, ...BOTS.slice(0, 3).map((nome, i) => ({ id: 'b' + i, nome, bot: true, on: true }))], { topicos: ui.topicos }); comecar() },
    criar: () => { m.meuNome = ui.meuNome; m.criar(ui.meuNome || t('Jogador 1', 'Player 1'), { topicos: [...ui.topicos] }) },
    entrar: () => { ui.codigo = valor('lab-codigo'); m.meuNome = ui.meuNome; m.entrar(ui.codigo) },
    'poe-bot': () => { if (m.H) m.poeBot(BOTS[m.H.pessoas.filter((p) => p.bot).length % BOTS.length]) },
    'tira-bot': (v) => m.tiraBot(Number(v)),
    convite: () => window.Mesa.convite('lab', m.sala.st.code, (txt) => { ui.msg = txt; render() }),
    comecar: () => { if (m.H && !m.H.J) comecar() },
    visto: () => { ui.viu = m.vis.eu; ui.trava = Date.now() + 350; render() },
    coloca: (v) => {
      if (Date.now() < ui.trava) return
      const pers = m.vis.meu && m.vis.meu.pers
      som('sold')
      if (window.Uatu && pers) window.Uatu.momento('lab-coloca', { topico: T.topico(m.vis.topicos[Number(v)]), pers: T.nomePers(pers) })
      m.fazer({ type: 'coloca', topico: v })
    },
    voto: (v) => m.fazer({ type: 'voto', lado: v }),
    seguir: () => m.fazer({ type: 'seguir' }),
    denovo: () => m.fazer({ type: 'denovo' }),
    sair: () => { m.sair(); ui.pers = ''; fecharVigia(); render() },
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-l]')
    if (!b || b.disabled || !acoes[b.dataset.l]) return
    acoes[b.dataset.l](b.dataset.v, b)
  })
  el.addEventListener('input', (ev) => {
    const a = ev.target.id && ev.target.id.match(/^lab-nome-(\d)$/)
    if (a) { ui.nomes[Number(a[1])] = ev.target.value.slice(0, 14); salvar() }
    if (ev.target.id === 'lab-meu') { ui.meuNome = ev.target.value.slice(0, 14); guarda('mvd-imp-nome', ui.meuNome) }
    if (ev.target.id === 'lab-codigo') ui.codigo = ev.target.value
    const tp = ev.target.id && ev.target.id.match(/^lab-top-(\d+)$/)
    if (tp) { const a = alvoTopicos(); a.topicos[Number(tp[1])] = ev.target.value.slice(0, 14); if (a === ui) salvar() }
  })
  // terminou de escrever um tópico na sala: aí sim os outros veem
  el.addEventListener('change', (ev) => { if (ev.target.id && ev.target.id.startsWith('lab-top-') && m.H && !m.H.J) m.enviarTudo() })
  el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.id === 'lab-codigo') acoes.entrar() })
  window.Lingua.aoMudar(() => { if (!el.hidden) render() })

  window.Lab = {
    letreiro: () => [t('Laboratório do <em>Alto Evolucionário</em>', 'The High Evolutionary’s <em>Lab</em>'), t('monte um herói com pedaços da Marvel · a turma vota', 'build a hero from pieces of Marvel · the gang votes')],
    esconder() {},
    abrir() { ui.meuNome = guarda('mvd-imp-nome') || ui.meuNome; render() },
    entrar(code) { ui.codigo = code; m.meuNome = ui.meuNome; m.entrar(code) },
  }
})()
