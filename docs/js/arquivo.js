// Arquivo Secreto: liga o motor (arquivo-motor.js), as telas (arquivo-telas.js) e a sala online (mesa.js).
// Num celular só, cada pista é de uma pessoa. Online (e testando contra bots), todo mundo chuta ao mesmo tempo.
(function () {
  const M = window.ArquivoMotor
  const T = window.ArquivoTelas
  const GD = window.GradeDados
  const X = window.Sfx
  const el = document.getElementById('arquivo')
  const t = (pt, en) => window.Lingua.t(pt, en)
  const som = (f) => { if (X && X.on) X[f]() }
  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  const salvo = (() => { try { return JSON.parse(localStorage.getItem('mvd-arquivo') || '{}') } catch (e) { return {} } })()
  const ui = { n: Number.isInteger(salvo.n) && salvo.n >= 2 && salvo.n <= 8 ? salvo.n : 3, nomes: Array.isArray(salvo.nomes) ? salvo.nomes.slice(0, 8) : [], versao: GD.versao(salvo.versao),
    meuNome: guarda('mvd-imp-nome'), codigo: '', msg: '', busca: '', aviso: '', avisoTipo: '', estouro: '', visto: 0, podeSeguir: false, focar: false, forma: '' }
  const salvar = () => guarda('mvd-arquivo', JSON.stringify({ n: ui.n, nomes: ui.nomes, versao: ui.versao }))
  let prazoLocal = 0

  const m = window.Mesa.nova({
    prefixo: 'mvarquivo-v1-', chave: 'arquivo', max: 8,
    opcoes: (H) => ({ versao: H.versao }),
    visao,
    acao,
    tick,
    aoVisao: novaVisao,
    aoMudar: render,
    autoComecar: () => comecar(),
    aoCair: (p, H) => { if (H.J.js[p.j]) H.J.js[p.j].bot = true },
    aoVoltar: (p, H) => { if (H.J.js[p.j]) H.J.js[p.j].bot = false },
  })

  // ---------- anfitrião ----------
  function comecar() {
    const H = m.H
    const jogam = H.pessoas.filter((p) => p.on)
    if (jogam.length < 2) return
    H.pessoas.forEach((p) => { p.j = jogam.indexOf(p) })
    const soPessoasNoMesmoCelular = H.local && !jogam.some((p) => p.bot)
    H.J = M.novoJogo({ versao: H.versao, modo: soPessoasNoMesmoCelular ? 'turno' : 'junto', jogadores: jogam.map((p) => ({ nome: p.nome, bot: p.bot })) })
    H.fs = ''
    H.sig = ''
    m.ligarLaco()
    tick(H)
  }

  function tick(H) {
    const J = H.J
    if (!J) return
    const agora = Date.now()
    const fs = [J.fase, J.n, J.pista].join('|')
    if (fs !== H.fs) {
      H.fs = fs
      H.prazo = J.fase === 'pista' && J.modo === 'junto' ? agora + M.PRAZO : 0
      H.dur = H.prazo ? M.PRAZO : 0
      H.botEm = J.js.map(() => agora + 2500 + Math.random() * 9000)
    }
    if (J.fase === 'pista') {
      // só falta bot decidir: eles não fazem ninguém esperar
      const humanoFalta = J.js.some((p, j) => !p.bot && M.podeChutar(J, j))
      J.js.forEach((p, j) => {
        if (J.fase !== 'pista' || !p.bot || !M.podeChutar(J, j) || (humanoFalta && agora < H.botEm[j]) || (!humanoFalta && agora < Math.min(H.botEm[j], (H.soBots || (H.soBots = agora + 900))))) return
        const b = M.botAcao(J, j)
        if (b.passar) M.passar(J, j); else M.chutar(J, j, b.key)
      })
      if (humanoFalta) H.soBots = 0
      if (J.fase === 'pista' && H.prazo && agora >= H.prazo) M.tempo(J)
    }
    const sig = [J.fase, J.n, J.pista, J.seq, H.pessoas.map((p) => p.on + p.nome).join()].join('|')
    if (sig !== H.sig) { H.sig = sig; m.enviarTudo() }
  }

  function visao(p, H) {
    const J = H.J
    const eu = J.modo === 'turno' ? J.vez : p.j
    const f = J.fase === 'fim' ? null : M.ficha(J)
    const js = J.js.map((x, i) => ({ nome: x.nome, bot: x.bot, pts: x.pts, certos: x.certos, acertou: J.por[i].acertou >= 0, pistaAcerto: J.por[i].acertou, tentou: J.por[i].tentou, ganho: J.por[i].ganho, primeiro: J.por[i].primeiro }))
    return { fase: J.fase, modo: J.modo, versao: J.versao, n: J.n, total: J.total, pista: J.pista, vez: J.vez, eu, js, seq: J.seq, ultimo: J.ultimo && { ...J.ultimo },
      pistas: f ? f.pistas.slice(0, J.fase === 'pista' ? J.pista + 1 : M.PONTOS.length) : [],
      meu: { ...J.por[eu], errados: [...J.por[eu].errados] }, pode: M.podeChutar(J, eu),
      revela: J.fase === 'revela' ? { key: f.key } : null, resta: H.prazo ? Math.max(0, H.prazo - Date.now()) : 0, dur: H.dur || 0 }
  }

  function acao(p, msg) {
    const H = m.H
    const J = H.J
    if (!J) return
    const manda = H.local || p === H.pessoas[0]
    if (msg.type === 'seguir' && manda) M.seguir(J)
    else if (msg.type === 'denovo' && manda && J.fase === 'fim') { comecar(); return }
    else {
      const quem = J.modo === 'turno' ? J.vez : p.j
      if (quem === undefined || quem < 0 || J.js[quem].bot) return
      if (msg.type === 'chute') {
        const r = M.chutar(J, quem, String(msg.key || ''))
        if (r && r.repetido && p === H.pessoas[0]) avisar(t('Você já errou com esse. Escolha outro.', 'You already missed with that one. Pick another.'), 'erro')
      }
      if (msg.type === 'passa') M.passar(J, quem)
    }
    tick(H)
  }

  // ---------- desenho ----------
  function avisar(txt, tipo) {
    ui.aviso = txt
    ui.avisoTipo = tipo || 'calmo'
    clearTimeout(ui._a)
    ui._a = setTimeout(() => { ui.aviso = ''; pintaAviso() }, 2600)
    pintaAviso()
  }
  const pintaAviso = () => { const a = document.getElementById('aq-aviso'); if (a) a.innerHTML = T.aviso(ui) }
  function estoura(txt) {
    ui.estouro = txt
    clearTimeout(ui._e)
    ui._e = setTimeout(() => { ui.estouro = ''; const e = document.getElementById('aq-estouro'); if (e) e.innerHTML = '' }, 1300)
    const e = document.getElementById('aq-estouro')
    if (e) e.innerHTML = T.estouro(ui)
  }

  function novaVisao(a, v) {
    prazoLocal = performance.now() + (v.resta || 0)
    if (v.fase !== 'sala') novidades(a, v)
    render()
  }

  function novidades(a, v) {
    const U = window.Uatu
    if (!a || a.fase === 'sala' || a.fase === 'fim') { ui.visto = v.ultimo ? v.ultimo.seq : 0; ui.busca = ''; som('draw'); return }
    const mudouFicha = v.n !== a.n
    if (mudouFicha) { ui.busca = ''; som('draw') } else if (v.fase === 'pista' && v.pista !== a.pista) som('tick')
    const u = v.ultimo
    if (u && u.seq !== ui.visto) {
      ui.visto = u.seq
      const meu = u.j === v.eu
      const nomeDele = v.js[u.j] ? v.js[u.j].nome : ''
      if (u.ok) {
        if (meu || v.modo === 'turno') { estoura('+' + u.ganho); som('sold'); ui.busca = '' }
        else if (v.fase === 'pista') avisar(t(`${nomeDele} acertou!`, `${nomeDele} got it!`), 'ok')
        if (u.pista <= 1 && U) U.momento('arquivo-cedo', { nome: nomeDele, pista: u.pista + 1 })
        if (meu && u.pista === 0 && v.modo === 'junto' && window.Conquistas) window.Conquistas.liga('pista1')
      } else if (u.passou) { if (meu) ui.busca = '' } else if (meu || v.modo === 'turno') {
        ui.busca = ''
        som('undo')
        avisar(v.modo === 'turno' ? t(`${nomeDele} errou. −1`, `${nomeDele} missed. −1`) : t('Não é esse. −1 ponto.', 'Not that one. −1 point.'), 'erro')
        if (U) U.momento('arquivo-errou')
      }
    }
    if (v.fase === 'revela' && a.fase !== 'revela') {
      ui.busca = ''
      setTimeout(() => som('win'), 200)
      if (!v.js.some((p) => p.acertou) && U) U.momento('arquivo-ninguem')
    }
    if (v.fase === 'fim' && a.fase !== 'fim') {
      setTimeout(() => som('win'), 200)
      const top = [...v.js].sort((x, y) => y.pts - x.pts)[0]
      if (U) U.momento('arquivo-fim', { nome: top.nome })
      if (!v.local && v.js[v.eu] && v.js[v.eu].pts === top.pts && window.Conquistas) window.Conquistas.vitoria('arquivo')
    }
  }

  function render() {
    const v = m.vis
    if (!v) { el.innerHTML = T.entrada(ui, m); return }
    if (v.fase === 'sala') { el.innerHTML = T.sala(v, ui); return }
    ui.podeSeguir = v.local || v.dono
    const qual = v.n + ':' + v.pista
    ui.entrou = qual !== ui.qual
    ui.qual = qual
    // digitando: só troca a ficha e o placar, pra não perder o que está sendo escrito
    const forma = [v.fase, v.n, v.pode, v.modo === 'turno' ? v.vez : ''].join('|')
    const campo = document.activeElement && document.activeElement.id === 'aq-busca' ? document.activeElement : null
    if (campo && forma === ui.forma) {
      const a = document.getElementById('aq-pasta')
      const b = document.getElementById('aq-placar')
      if (a) a.outerHTML = T.pasta(v, ui.entrou)
      if (b) b.outerHTML = T.placar(v)
      const c = document.getElementById('aq-atual')
      if (c) c.innerHTML = T.atual(v)
      relogio()
      return
    }
    ui.forma = forma
    el.innerHTML = T.jogo(v, ui)
    const busca = document.getElementById('aq-busca')
    if (busca && (campo || ui.focar || (v.pode && matchMedia('(hover: hover)').matches))) { ui.focar = false; busca.focus(); busca.setSelectionRange(busca.value.length, busca.value.length) }
    relogio()
  }
  function relogio() {
    const caixa = document.getElementById('aq-relogio')
    const v = m.vis
    if (!caixa || !v || !v.dur) return
    const resta = Math.max(0, prazoLocal - performance.now())
    caixa.querySelector('[data-x="barra"]').style.width = (100 * resta) / v.dur + '%'
    caixa.querySelector('[data-x="seg"]').textContent = Math.ceil(resta / 1000)
    caixa.classList.toggle('acabando', resta < 5000)
  }
  setInterval(() => { if (m.vis && !el.hidden && m.vis.fase === 'pista') relogio() }, 100)
  function sugerir() {
    const s = document.getElementById('aq-sugestoes')
    if (s && m.vis) s.innerHTML = T.sugestoes(m.vis, ui)
  }

  // ---------- botões ----------
  const nomesLocais = () => Array.from({ length: ui.n }, (_, i) => (ui.nomes[i] || '').trim() || `${t('Jogador', 'Player')} ${i + 1}`)
  const valor = (id) => (document.getElementById(id) || {}).value || ''
  const BOTS = ['JARVIS', 'F.R.I.D.A.Y.', 'Ultron', 'E.D.I.T.H.', 'Visão', 'Rocket', 'Groot']
  const acoes = {
    n: (v) => { ui.n = Math.min(8, Math.max(2, ui.n + Number(v))); salvar(); render() },
    versao: (v) => {
      const novo = GD.versao(v)
      if (m.H && !m.H.J) { m.H.versao = novo; m.enviarTudo(); return }
      ui.versao = novo; salvar(); render()
    },
    local: () => { m.host(true, nomesLocais().map((nome, i) => ({ id: 'l' + i, nome, on: true })), { versao: ui.versao }); comecar() },
    bots: () => {
      m.host(true, [{ id: 'l0', nome: ui.meuNome || (ui.nomes[0] || '').trim() || t('Você', 'You'), on: true }, ...BOTS.slice(0, 3).map((nome, i) => ({ id: 'b' + i, nome, bot: true, on: true }))], { versao: ui.versao })
      comecar()
    },
    criar: () => { m.meuNome = ui.meuNome; m.criar(ui.meuNome || t('Jogador 1', 'Player 1'), { versao: ui.versao }) },
    entrar: () => { ui.codigo = valor('aq-codigo'); m.meuNome = ui.meuNome; m.entrar(ui.codigo) },
    'poe-bot': () => { if (m.H) m.poeBot(BOTS[m.H.pessoas.filter((p) => p.bot).length % BOTS.length]) },
    'tira-bot': (v) => m.tiraBot(Number(v)),
    convite: () => window.Mesa.convite('arquivo', m.sala.st.code, (txt) => { ui.msg = txt; render() }),
    comecar: () => { if (m.H && !m.H.J) comecar() },
    escolhe: (key) => { m.fazer({ type: 'chute', key }); ui.busca = '' },
    passa: () => { m.fazer({ type: 'passa' }); ui.busca = '' },
    seguir: () => m.fazer({ type: 'seguir' }),
    denovo: () => m.fazer({ type: 'denovo' }),
    sair: () => { m.sair(); ui.busca = ''; render() },
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-q]')
    if (!b || b.disabled || !acoes[b.dataset.q]) return
    acoes[b.dataset.q](b.dataset.v, b)
  })
  el.addEventListener('input', (ev) => {
    const a = ev.target.id && ev.target.id.match(/^aq-nome-(\d)$/)
    if (a) { ui.nomes[Number(a[1])] = ev.target.value.slice(0, 14); salvar() }
    if (ev.target.id === 'aq-meu') { ui.meuNome = ev.target.value.slice(0, 14); guarda('mvd-imp-nome', ui.meuNome) }
    if (ev.target.id === 'aq-codigo') ui.codigo = ev.target.value
    if (ev.target.id === 'aq-busca') { ui.busca = ev.target.value; sugerir() }
  })
  el.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return
    if (ev.target.id === 'aq-codigo') acoes.entrar()
    if (ev.target.id === 'aq-busca' && m.vis) {
      // Enter escolhe o primeiro da lista
      const k = window.GradeTelas.achar(ui.busca, m.vis.versao).find((x) => !m.vis.meu.errados.includes(x))
      if (k) acoes.escolhe(k)
    }
  })
  window.Lingua.aoMudar(() => { if (!el.hidden) { ui.forma = ''; render() } })

  window.Arquivo = {
    letreiro: () => [t('Arquivo <em>Secreto</em>', 'Secret <em>File</em>'), t('uma pista por vez · quanto antes acertar, mais pontos', 'one clue at a time · the sooner you guess, the more points')],
    esconder() {},
    abrir() { ui.meuNome = guarda('mvd-imp-nome') || ui.meuNome; render() },
    entrar(code) { ui.codigo = code; m.meuNome = ui.meuNome; m.entrar(code) },
    partida: {
      criar(nome, aoCodigo) { ui.meuNome = nome; m.meuNome = nome; m.criar(nome, { versao: 'ambos', auto: true, aoCodigo }); render() },
      entrar(code, nome) { ui.meuNome = nome; ui.codigo = code; m.meuNome = nome; m.entrar(code) },
    },
  }
})()
