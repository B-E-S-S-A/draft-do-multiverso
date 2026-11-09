// Mesa: a parte online e de sala que os jogos novos dividem (quem entra, quem cai, bots e a visão de cada um).
// Quem cria a sala é o anfitrião e manda no jogo; os outros só recebem a sua "visão" e mandam ações.
//   const m = Mesa.nova({ prefixo, chave, max, visao, opcoes, acao, tick, aoVisao, aoMudar, aoCair, aoVoltar })
//   visao(p) → o que a pessoa p vê do jogo · opcoes() → as regras que aparecem na sala de espera
//   acao(p, msg) → p fez alguma coisa · tick() → roda 5 vezes por segundo enquanto há jogo
(function () {
  const t = (pt, en) => window.Lingua.t(pt, en)
  const ERROS = {
    servidor: () => t('Sem conexão com o servidor da sala. Confere a internet.', 'No connection to the room server. Check your internet.'),
    codigo: () => t('O código tem 4 letras ou números.', 'The code has 4 letters or numbers.'),
    naoAchei: () => t('Não achei essa sala. Confere o código com quem criou.', 'Could not find that room. Check the code with the host.'),
    naoConectou: () => t('Não conectou. Quem criou a sala está com o site aberto?', 'Could not connect. Does the host have the site open?'),
    caiu: () => t('A sala fechou ou a conexão caiu.', 'The room closed or the connection dropped.'),
    cheia: () => t('Essa sala está cheia ou o jogo já começou.', 'This room is full or the game has already started.'),
  }

  function nova(o) {
    const sala = window.Sala.nova({ prefixo: o.prefixo, chave: 'mvd-sala-' + o.chave })
    const MEU_ID = (() => {
      let v = ''
      try { v = sessionStorage.getItem('mvd-' + o.chave + '-id') || '' } catch (e) {}
      if (!v) { v = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mvd-' + o.chave + '-id', v) } catch (e) {} }
      return v
    })()
    const m = { H: null, vis: null, erro: '', status: '', meuNome: '', sala }

    function enviarTudo() {
      const H = m.H
      if (!H) return
      for (const p of H.pessoas) if (p.conn && p.on) sala.enviar({ type: 'visao', v: visaoDe(p) }, p.conn)
      receber(visaoDe(H.pessoas[0]))
    }
    function visaoDe(p) {
      const H = m.H
      const base = { code: sala.st.code, dono: p === H.pessoas[0], local: H.local, ...o.opcoes(H),
        pessoas: H.pessoas.map((x) => ({ nome: x.nome, bot: !!x.bot, on: x.on, voce: x === p, dono: x === H.pessoas[0] })) }
      return H.J ? { ...base, ...o.visao(p, H) } : { ...base, fase: 'sala' }
    }
    function receber(v) {
      const a = m.vis
      m.vis = v
      o.aoVisao(a, v)
    }
    const laco = () => { const H = m.H; if (H && H.J) o.tick(H) }

    m.host = (local, pessoas, extra) => {
      if (m.H) clearInterval(m.H.laco)
      m.H = { local, pessoas, J: null, laco: 0, ...extra }
    }
    m.ligarLaco = () => { clearInterval(m.H.laco); m.H.laco = setInterval(laco, 200) }
    m.enviarTudo = enviarTudo
    m.criar = (nome, extra) => { m.host(false, [{ id: MEU_ID, conn: null, nome, on: true }], extra); m.erro = ''; sala.criar() }
    m.entrar = (code) => { m.erro = ''; sala.entrar(code) }
    m.fazer = (msg) => { if (m.H) o.acao(m.H.pessoas[0], msg); else sala.enviar(msg) }
    m.poeBot = (nome) => { const H = m.H; if (H && !H.J && H.pessoas.length < o.max) { H.pessoas.push({ id: 'bot-' + Math.random().toString(36).slice(2, 7), nome, bot: true, on: true }); enviarTudo() } }
    m.tiraBot = (i) => { const H = m.H; if (H && !H.J && H.pessoas[i] && H.pessoas[i].bot) { H.pessoas.splice(i, 1); enviarTudo() } }
    m.sair = () => {
      if (m.H) clearInterval(m.H.laco)
      m.H = null
      if (sala.st.status !== 'off') sala.sair()
      m.vis = null
    }

    sala.aoStatus = (st) => {
      if (st.status === 'off') { if (m.H && !m.H.local) { clearInterval(m.H.laco); m.H = null } if (!m.H) m.vis = null; m.erro = st.erro ? (ERROS[st.erro] || ERROS.caiu)() : ''; m.status = '' }
      if (st.status === 'creating' || st.status === 'joining') m.status = t('Conectando…', 'Connecting…')
      if (st.status === 'hosting' && m.H) { m.status = ''; enviarTudo(); if (m.H.aoCodigo) { const f = m.H.aoCodigo; m.H.aoCodigo = null; f(st.code) } }
      if (st.status === 'connected') { m.status = ''; sala.enviar({ type: 'oi', id: MEU_ID, nome: m.meuNome }) }
      o.aoMudar()
    }
    sala.aoDados = (msg, de) => {
      if (!msg || typeof msg !== 'object') return
      if (de === 'host') {
        if (msg.type === 'cheia') { sala.sair(); m.erro = ERROS.cheia(); o.aoMudar(); return }
        if (msg.type === 'visao' && msg.v) receber(msg.v)
        return
      }
      const H = m.H
      if (!H) return
      if (msg.type === 'oi') {
        const id = String(msg.id || '').slice(0, 20)
        let p = H.pessoas.find((x) => x.id === id)
        if (!p) {
          // sala cheia de bots: um bot que estava esperando dá lugar a uma pessoa
          const bot = H.pessoas.findIndex((x) => x.bot)
          if (!H.J && H.pessoas.length >= o.max && bot > 0) H.pessoas.splice(bot, 1)
          if (!id || H.J || H.pessoas.length >= o.max) { sala.enviar({ type: 'cheia' }, de); setTimeout(() => sala.fechar(de), 300); return }
          p = { id, conn: de, nome: '', on: true }
          H.pessoas.push(p)
        }
        Object.assign(p, { conn: de, on: true, nome: String(msg.nome || '').trim().slice(0, 14) || p.nome || t('Jogador', 'Player') + ' ' + H.pessoas.length })
        if (H.J && o.aoVoltar) o.aoVoltar(p, H)
        enviarTudo()
        if (H.auto && !H.J && o.autoComecar) o.autoComecar(H) // veio da fila: começa sozinho quando a outra pessoa chega
        return
      }
      const p = H.pessoas.find((x) => x.conn === de)
      if (!p) return
      if (msg.type === 'nome' && !H.J) { p.nome = String(msg.nome || '').trim().slice(0, 14) || p.nome; enviarTudo(); return }
      o.acao(p, msg)
    }
    sala.aoSair = (de) => {
      const H = m.H
      if (!H) return
      const p = H.pessoas.find((x) => x.conn === de)
      if (!p) return
      p.on = false
      p.conn = null
      if (!H.J) H.pessoas = H.pessoas.filter((x) => x !== p)
      else if (o.aoCair) o.aoCair(p, H)
      enviarTudo()
    }
    return m
  }

  // copia o link de convite; se não der, devolve o link pra pessoa copiar na mão
  function convite(prefixo, code, pronto) {
    const link = location.origin + location.pathname + '#' + prefixo + '-' + code
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => pronto(t('Convite copiado! Manda pra turma.', 'Invite copied! Send it to the gang.')), () => pronto(link))
    else pronto(link)
  }

  window.Mesa = { nova, convite }
})()
