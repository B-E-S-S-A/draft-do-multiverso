// Identidade Secreta: liga o motor (identidade-motor.js), as telas (identidade-telas.js) e a sala online (mesa.js).
// Online é sempre 1 contra 1, cada um no seu celular. Contra o computador, a partida é local e com a lista pronta.
(function () {
  const M = window.IdentidadeMotor
  const T = window.IdentidadeTelas
  const GD = window.GradeDados
  const X = window.Sfx
  const el = document.getElementById('identidade')
  const t = (pt, en) => window.Lingua.t(pt, en)
  const som = (f) => { if (X && X.on) X[f]() }
  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  const salvo = (() => { try { return JSON.parse(localStorage.getItem('mvd-identidade') || '{}') } catch (e) { return {} } })()
  const ui = { versao: GD.versao(salvo.versao), qtd: M.qtdValida(salvo.qtd), modo: M.modoValido(salvo.modo), meuNome: guarda('mvd-imp-nome'), codigo: '', msg: '',
    chutando: false, alvo: '', caiu: '', rodada: 0, forma: '' }
  const salvar = () => guarda('mvd-identidade', JSON.stringify({ versao: ui.versao, qtd: ui.qtd, modo: ui.modo }))
  const BOTS = ['JARVIS', 'Ultron', 'F.R.I.D.A.Y.', 'Visão', 'E.D.I.T.H.']

  const m = window.Mesa.nova({
    prefixo: 'mvidentidade-v1-', chave: 'identidade', max: 2,
    opcoes: (H) => ({ versao: H.versao, qtd: H.qtd, modo: H.modo }),
    visao,
    acao,
    tick,
    aoVisao: novaVisao,
    aoMudar: render,
    autoComecar: () => comecar(),
    // caiu alguém: na lista pronta o computador assume; no clássico, espera a pessoa voltar
    aoCair: (p, H) => { if (!H.J) return; if (H.J.modo === 'lista') H.J.js[p.j].bot = true; else H.caiu = p.nome },
    aoVoltar: (p, H) => { if (!H.J) return; H.J.js[p.j].bot = false; H.caiu = '' },
  })

  // ---------- anfitrião ----------
  function comecar() {
    const H = m.H
    const jogam = H.pessoas.filter((p) => p.on)
    if (jogam.length < 2) return
    H.pessoas.forEach((p) => { p.j = jogam.indexOf(p) })
    H.rodada = (H.rodada || 0) + 1
    H.placar = H.placar || [0, 0]
    H.contou = false
    H.caiu = ''
    // quem começa vai alternando a cada partida
    H.J = M.novoJogo({ versao: H.versao, qtd: H.qtd, modo: jogam.some((p) => p.bot) ? 'lista' : H.modo, jogadores: jogam.map((p) => ({ nome: p.nome, bot: p.bot })), comeca: H.rodada === 1 ? undefined : 1 - H.primeiro })
    H.primeiro = H.J.vez
    H.sig = ''
    H.botSig = ''
    m.ligarLaco()
    tick(H)
  }

  function tick(H) {
    const J = H.J
    if (!J) return
    const agora = Date.now()
    // o computador pensa um pouco antes de cada jogada
    if (J.fase === 'jogo' && J.js[J.vez].bot) {
      const s = [J.vez, J.etapa, J.seq].join('|')
      if (s !== H.botSig) { H.botSig = s; H.botEm = agora + (J.etapa === 'virar' ? 1300 : 1600 + Math.random() * 1200) }
      if (agora >= H.botEm) {
        const b = M.botAcao(J, J.vez)
        if (b.tipo === 'pergunta') M.perguntar(J, J.vez, b.id)
        else if (b.tipo === 'passa') M.passar(J, J.vez)
        else M.chutar(J, J.vez, b.key)
      }
    }
    if (J.fase === 'fim' && !H.contou) { H.contou = true; H.placar[J.res.vencedor] += 1 }
    const sig = [J.seq, J.fase, H.caiu, H.placar.join(), H.pessoas.map((p) => p.on + p.nome).join()].join('|')
    if (sig !== H.sig) { H.sig = sig; m.enviarTudo() }
  }

  function visao(p, H) {
    const J = H.J
    const eu = p.j === undefined ? 0 : p.j
    return { ...M.visaoDe(J, eu), rodada: H.rodada, placar: H.placar, caiu: H.caiu || '' }
  }

  function acao(p, msg) {
    const H = m.H
    const J = H.J
    if (!J) return
    const j = p.j
    if (j === undefined || !J.js[j]) return
    if (msg.type === 'denovo') { if ((H.local || p === H.pessoas[0]) && J.fase === 'fim') comecar(); return }
    if (J.js[j].bot) return
    if (msg.type === 'pergunta') M.perguntar(J, j, String(msg.id || ''))
    if (msg.type === 'escreve') M.escrever(J, j, msg.txt)
    if (msg.type === 'responde') M.responder(J, j, String(msg.r || ''))
    if (msg.type === 'vira') M.virar(J, j, String(msg.key || ''))
    if (msg.type === 'passa') M.passar(J, j)
    if (msg.type === 'chute') M.chutar(J, j, String(msg.key || ''))
    tick(H)
  }

  // ---------- desenho ----------
  function novaVisao(a, v) {
    if (v.fase !== 'sala') novidades(a, v)
    render()
  }

  function novidades(a, v) {
    const U = window.Uatu
    ui.caiu = v.caiu
    if (!a || a.fase === 'sala' || a.rodada !== v.rodada) { ui.chutando = false; ui.alvo = ''; som('draw'); return }
    // chegou resposta nova
    if (v.log.length > a.log.length) {
      const x = v.log[v.log.length - 1]
      som(x.r === 'sim' ? 'sold' : 'tick')
    }
    if (v.vez !== a.vez && v.vez === v.eu && v.fase === 'jogo') som('tick')
    if (v.fase === 'fim' && a.fase !== 'fim') {
      ui.chutando = false
      ui.alvo = ''
      const r = v.res
      setTimeout(() => som(r.vencedor === v.eu ? 'win' : 'undo'), 150)
      if (U) U.momento(r.certo ? 'identidade-acertou' : 'identidade-errou', { nome: v.js[r.quem].nome })
      if (!v.local && r.vencedor === v.eu && window.Conquistas) window.Conquistas.vitoria('identidade')
    }
  }

  function render() {
    const v = m.vis
    if (!v) { el.innerHTML = T.entrada(ui, m); ui.rodada = 0; return }
    if (v.fase === 'sala') { el.innerHTML = T.sala(v, ui); ui.rodada = 0; return }
    const tab = document.getElementById('se-tab')
    if (!tab || ui.rodada !== v.rodada) {
      ui.rodada = v.rodada
      el.innerHTML = T.jogo(v, ui)
      ui.forma = T.forma(v, ui)
      return
    }
    // mesma partida: só vira as cartas que mudaram, troca o placar e, se precisar, o painel
    for (const b of tab.querySelectorAll('.se-carta')) {
      const k = b.dataset.v
      const caiu = v.meu.caidos.includes(k)
      b.classList.toggle('caiu', caiu)
      b.classList.toggle('alvo', ui.alvo === k)
      b.classList.toggle('segredo', v.fase === 'fim' && v.res.segredos.includes(k))
      b.setAttribute('aria-pressed', caiu)
      b.disabled = v.fase === 'fim'
    }
    tab.classList.toggle('chutando', ui.chutando)
    const barra = document.getElementById('se-barra')
    if (barra) barra.outerHTML = T.barra(v, v.placar)
    const forma = T.forma(v, ui)
    if (forma !== ui.forma) {
      ui.forma = forma
      const caixa = document.getElementById('se-acao')
      if (caixa) caixa.innerHTML = T.acao(v, ui)
      const log = document.getElementById('se-log')
      if (log) log.outerHTML = T.log(v)
    }
  }

  // ---------- botões ----------
  const valor = (id) => (document.getElementById(id) || {}).value || ''
  function regra(k, v) {
    const novo = k === 'versao' ? GD.versao(v) : k === 'qtd' ? M.qtdValida(v) : M.modoValido(v)
    if (m.H && !m.H.J) { m.H[k] = novo; m.enviarTudo(); return }
    ui[k] = novo
    salvar()
    render()
  }
  const acoes = {
    versao: (v) => regra('versao', v),
    qtd: (v) => regra('qtd', v),
    modo: (v) => regra('modo', v),
    bots: () => {
      m.host(true, [{ id: 'l0', nome: ui.meuNome || t('Você', 'You'), on: true }, { id: 'b0', nome: BOTS[Math.floor(Math.random() * BOTS.length)], bot: true, on: true }], { versao: ui.versao, qtd: ui.qtd, modo: 'lista' })
      comecar()
    },
    criar: () => { m.meuNome = ui.meuNome; m.criar(ui.meuNome || t('Jogador 1', 'Player 1'), { versao: ui.versao, qtd: ui.qtd, modo: ui.modo }) },
    entrar: () => { ui.codigo = valor('se-codigo'); m.meuNome = ui.meuNome; m.entrar(ui.codigo) },
    convite: () => window.Mesa.convite('identidade', m.sala.st.code, (txt) => { ui.msg = txt; render() }),
    comecar: () => { if (m.H && !m.H.J) comecar() },
    carta: (key, b) => {
      const v = m.vis
      if (!v || v.fase !== 'jogo') return
      if (ui.chutando) {
        if (b.classList.contains('caiu')) return
        ui.alvo = key
        render()
        return
      }
      // vira na hora e avisa o anfitrião
      b.classList.toggle('caiu')
      som('tick')
      m.fazer({ type: 'vira', key })
    },
    chutar: () => { ui.chutando = true; ui.alvo = ''; render() },
    volta: () => { ui.chutando = false; ui.alvo = ''; render() },
    confirma: () => { const k = ui.alvo; ui.chutando = false; ui.alvo = ''; if (k) m.fazer({ type: 'chute', key: k }) },
    pergunta: (id) => m.fazer({ type: 'pergunta', id }),
    escreve: () => { const txt = valor('se-perg').trim(); if (txt) m.fazer({ type: 'escreve', txt }) },
    responde: (r) => m.fazer({ type: 'responde', r }),
    passa: () => m.fazer({ type: 'passa' }),
    denovo: () => m.fazer({ type: 'denovo' }),
    sair: () => { m.sair(); ui.chutando = false; ui.alvo = ''; ui.caiu = ''; render() },
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-q]')
    if (!b || b.disabled || !acoes[b.dataset.q]) return
    acoes[b.dataset.q](b.dataset.v, b)
  })
  el.addEventListener('input', (ev) => {
    if (ev.target.id === 'se-meu') { ui.meuNome = ev.target.value.slice(0, 14); guarda('mvd-imp-nome', ui.meuNome) }
    if (ev.target.id === 'se-codigo') ui.codigo = ev.target.value
  })
  el.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return
    if (ev.target.id === 'se-codigo') acoes.entrar()
    if (ev.target.id === 'se-perg') acoes.escreve()
  })
  window.Lingua.aoMudar(() => { if (!el.hidden) { ui.rodada = 0; render() } })

  window.Identidade = {
    letreiro: () => [t('Identidade <em>Secreta</em>', 'Secret <em>Identity</em>'), t('pergunte, vire as cartas e descubra quem é', 'ask, flip the cards and find out who it is')],
    abrir() { ui.meuNome = guarda('mvd-imp-nome') || ui.meuNome; ui.rodada = 0; render() },
    entrar(code) { ui.codigo = code; m.meuNome = ui.meuNome; m.entrar(code) },
    // partida com gente desconhecida: sempre com a lista pronta, sem texto livre entre estranhos
    partida: {
      criar(nome, aoCodigo) { ui.meuNome = nome; m.meuNome = nome; m.criar(nome, { versao: 'ambos', qtd: M.CLASSICO, modo: 'lista', auto: true, aoCodigo }); render() },
      entrar(code, nome) { ui.meuNome = nome; ui.codigo = code; m.meuNome = nome; m.entrar(code) },
    },
  }
})()
