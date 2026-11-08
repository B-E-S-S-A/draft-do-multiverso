// Dias de Destino: um desafio por dia até a estreia de Doomsday, com patente e carteirinha. Tudo fica guardado neste aparelho.
(function () {
  const M = window.DestinoMotor
  const T = window.DestinoTelas
  const K = window.DestinoCartao
  const X = window.Sfx
  const el = document.getElementById('destino')
  const t = (pt, en) => window.Lingua.t(pt, en)
  const som = (f) => { if (X && X.on) X[f]() }
  const CHAVE = 'mvd-destino'
  const e = (() => { try { const d = JSON.parse(localStorage.getItem(CHAVE) || '{}'); return { nome: String(d.nome || ''), fav: String(d.fav || ''), dias: d.dias && typeof d.dias === 'object' ? d.dias : {}, andamento: d.andamento || null, cartao: K.normaliza(d.cartao) } } catch (x) { return { nome: '', fav: '', dias: {}, andamento: null, cartao: K.normaliza() } } })()
  const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(e)) } catch (x) {} }
  const ui = { tela: 'painel', nome: e.nome, fav: e.fav, cartao: { ...e.cartao }, busca: '', aviso: '', avisoTipo: '', editando: false, casa: -1, res: null, entrou: false, novo: false, trava: 0 }

  function resumoDoDia() {
    const dia = M.diaDe()
    const noPeriodo = M.noPeriodo(dia)
    const i = M.numero(dia)
    const pontos = M.total(e.dias)
    const ontem = i > 0 ? M.dataDo(i - 1) : ''
    return { dia, i, n: i + 1, noPeriodo, tipo: noPeriodo ? M.tipoDe(i) : '', feito: e.dias[dia] || null, dias: e.dias, pontos, patente: M.patente(pontos),
      seq: e.dias[dia] ? M.sequencia(e.dias, dia) : ontem && e.dias[ontem] ? M.sequencia(e.dias, ontem) : 0, andando: !!(e.andamento && e.andamento.i === i) }
  }

  function dadosDoCartao(r, cartao, nome, fav) {
    const p = r.patente
    const progresso = p.proxima === null ? 1 : (r.pontos - p.piso) / (p.proxima - p.piso)
    return { nome: nome === undefined ? e.nome : nome, fav: fav === undefined ? e.fav : fav, cartao: cartao || e.cartao, patente: T.nomePatente(p), pontos: r.pontos, seq: r.seq, feitos: Object.keys(e.dias).length, total: M.TOTAL, progresso,
      falta: p.proxima === null ? t('Patente máxima', 'Top rank') : t(`Faltam ${p.proxima - r.pontos} pontos`, `${p.proxima - r.pontos} points to go`) }
  }

  function render() {
    if (!e.nome || !e.fav || ui.tela === 'criar') { el.innerHTML = T.criar(ui); previa(); return }
    if (ui.tela === 'jogo' && e.andamento) {
      el.innerHTML = T.desafio(e.andamento, ui)
      ui.entrou = false
      ui.novo = false
      const b = document.getElementById('ds-busca')
      if (b && ui.focar) { ui.focar = false; b.focus(); b.setSelectionRange(b.value.length, b.value.length) }
      return
    }
    ui.tela = 'painel'
    const r = resumoDoDia()
    el.innerHTML = T.painel(ui, r)
    K.desenhar(document.getElementById('ds-canvas'), dadosDoCartao(r))
    relogio()
  }
  // a carteirinha na tela de editar, mudando conforme a pessoa mexe
  function previa() {
    const c = document.getElementById('ds-canvas')
    if (c) K.desenhar(c, dadosDoCartao(resumoDoDia(), ui.cartao, ui.nome, ui.fav))
  }
  function relogio() {
    const b = document.getElementById('ds-prox')
    if (!b) return
    const s = Math.floor(M.paraAmanha() / 1000)
    b.textContent = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':')
  }
  let diaVisto = M.diaDe()
  setInterval(() => {
    if (el.hidden) return
    relogio()
    // virou o dia com a tela aberta: mostra o desafio novo
    if (M.diaDe() !== diaVisto) { diaVisto = M.diaDe(); if (ui.tela === 'painel') render() }
  }, 1000)

  function avisar(txt, tipo) { ui.aviso = txt; ui.avisoTipo = tipo || 'calmo'; clearTimeout(ui._a); ui._a = setTimeout(() => { ui.aviso = ''; const x = el.querySelector('.gd-aviso.erro'); if (x) x.remove() }, 2600) } // tira só o aviso, pra não atrapalhar quem está digitando

  // terminou o desafio: guarda os pontos uma vez só
  function concluir() {
    const st = e.andamento
    if (!st || !st.fim || ui.res) return
    ui.res = M.registrar(e.dias, M.dataDo(st.i), st.tipo, M.pontosDe(st))
    if (!ui.res) return
    salvar()
    setTimeout(() => som(ui.res && ui.res.pontos > 0 ? 'win' : 'undo'), 150)
    const U = window.Uatu
    if (U && ui.res.subiu) U.momento('destino-patente', { patente: T.nomePatente(ui.res.patente) })
    else if (U) U.momento(ui.res.pontos > 0 ? 'destino-feito' : 'destino-zerou')
  }
  const depois = () => { concluir(); salvar(); render() }

  const acoes = {
    jogar: () => {
      const r = resumoDoDia()
      if (!r.noPeriodo || r.feito) return
      if (!e.andamento || e.andamento.i !== r.i) e.andamento = M.novo(r.i)
      ui.tela = 'jogo'; ui.busca = ''; ui.aviso = ''; ui.casa = -1; ui.res = null; ui.entrou = true; ui.novo = true; ui.trava = Date.now() + 350; ui.focar = true
      salvar(); som('draw'); render()
    },
    voltar: () => { ui.tela = 'painel'; ui.editando = false; ui.busca = ''; ui.aviso = ''; if (e.andamento && e.andamento.fim) { e.andamento = null; ui.res = null; salvar() } render() },
    editar: () => { ui.tela = 'criar'; ui.editando = true; ui.nome = e.nome; ui.fav = e.fav; ui.cartao = { ...e.cartao }; ui.busca = ''; ui.aviso = ''; render() },
    tema: (v) => { ui.cartao.tema = v; render() },
    equipe: (v) => { ui.cartao.equipe = v || ''; render() },
    carimbo: (v) => { ui.cartao.carimbo = v; render() },
    lado: (v) => { ui.cartao.lado = v; render() },
    fav: (k) => { ui.fav = k; ui.busca = ''; render() },
    'salvar-cartao': () => {
      ui.nome = (document.getElementById('ds-nome') || {}).value || ui.nome
      if (!ui.nome.trim()) { ui.aviso = t('Escreve seu nome.', 'Write your name.'); render(); return }
      if (!ui.fav) { ui.aviso = t('Escolhe um personagem.', 'Pick a character.'); render(); return }
      e.nome = ui.nome.trim().slice(0, 14); e.fav = ui.fav; e.cartao = K.normaliza(ui.cartao)
      ui.tela = 'painel'; ui.editando = false; ui.aviso = ''; salvar(); render()
    },
    baixar: () => { const c = document.getElementById('ds-canvas'); if (c) K.baixar(c, e.nome) },
    // ---------- ficha ----------
    escolhe: (k) => {
      const st = e.andamento
      const r = M.chutarFicha(st, k)
      if (!r) return
      ui.busca = ''; ui.entrou = true; ui.focar = true
      if (r.ok) som('sold')
      else { som('undo'); if (!st.fim) avisar(t('Não é esse. −5 pontos.', 'Not that one. −5 points.'), 'erro') }
      depois()
    },
    pula: () => { M.pularFicha(e.andamento); ui.busca = ''; ui.entrou = true; ui.focar = true; som('tick'); depois() },
    // ---------- grade ----------
    casa: (v) => { const i = Number(v); ui.casa = ui.casa === i ? -1 : i; ui.busca = ''; ui.focar = true; render() },
    'grade-escolhe': (k) => {
      const st = e.andamento
      const r = M.chutarGrade(st, ui.casa, k)
      if (!r) return
      ui.busca = ''
      if (r.ok) { ui.casa = -1; som('sold') } else { ui.focar = true; som('undo'); if (!st.fim) avisar(t(`Não vale aí. Sobraram ${st.vidas}.`, `That does not fit. ${st.vidas} left.`), 'erro') }
      if (st.fim) ui.casa = -1
      depois()
    },
    termina: () => { e.andamento.fim = true; ui.casa = -1; depois() },
    // ---------- herói do dia ----------
    coloca: (v) => {
      if (Date.now() < ui.trava) return
      if (!M.colocarLab(e.andamento, Number(v))) return
      ui.novo = true; ui.trava = Date.now() + 350
      som('sold'); depois()
    },
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-d], [data-q="escolhe"]')
    if (!b || b.disabled) return
    if (b.dataset.q === 'escolhe') return acoes.escolhe(b.dataset.v)
    if (acoes[b.dataset.d]) acoes[b.dataset.d](b.dataset.v, b)
  })
  el.addEventListener('input', (ev) => {
    const id = ev.target.id
    if (id === 'ds-nome') { ui.nome = ev.target.value.slice(0, 14); previa() }
    if (id === 'ds-codinome') { ui.cartao.codinome = ev.target.value.slice(0, 20); previa() }
    if (id === 'ds-lema') { ui.cartao.lema = ev.target.value.slice(0, 44); previa() }
    if (id === 'ds-fav') { ui.busca = ev.target.value; document.getElementById('ds-sug').innerHTML = T.sugestoesFav(ui) }
    if (id === 'ds-busca') {
      ui.busca = ev.target.value
      const st = e.andamento
      const caixa = document.getElementById('ds-sug')
      if (st.tipo === 'grade') caixa.innerHTML = T.sugestoesGrade(st, ui)
      else caixa.innerHTML = window.ArquivoTelas.sugestoes({ versao: 'ambos', meu: { errados: st.errados } }, ui)
    }
  })
  el.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' || ev.target.id !== 'ds-busca') return
    const st = e.andamento
    const k = window.GradeTelas.achar(ui.busca, 'ambos').find((x) => (st.tipo === 'grade' ? !st.casas.includes(x) : !st.errados.includes(x)))
    if (k) { if (st.tipo === 'grade') acoes['grade-escolhe'](k); else acoes.escolhe(k) }
  })
  window.Lingua.aoMudar(() => { if (!el.hidden) render() })

  window.Destino = {
    letreiro: () => [t('Dias de <em>Destino</em>', 'Days of <em>Doom</em>'), t('um desafio por dia até a estreia · suba de patente', 'one challenge a day until the premiere · rank up')],
    esconder() {},
    abrir() { render() },
  }
})()
