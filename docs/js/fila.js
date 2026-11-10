// Procurar partida: junta duas pessoas aleatórias sem servidor próprio, usando endereços conhecidos no mesmo serviço das salas.
// Quem chega tenta ocupar uma "vaga" da fila. Se ela já tem dono, é porque alguém está esperando: as duas pessoas se falam,
// sorteiam um jogo que as duas aceitam, quem esperava cria uma sala normal e manda o código pra outra.
(function () {
  const t = (pt, en) => window.Lingua.t(pt, en)
  const PREFIXO = 'mvfila-v1-'
  const VAGAS = 5
  const AVISO_MS = 60000
  const JOGOS = { draft: ['Draft', 'Draft'], grade: ['Grade', 'Grid'], arquivo: ['Arquivo Secreto', 'Secret File'], aposto: ['Aposto Que Sei', 'Bet I Know'], identidade: ['Identidade Secreta', 'Secret Identity'] }
  const CONTROLE = { draft: () => window.Draft, grade: () => window.Grade, arquivo: () => window.Arquivo, aposto: () => window.Aposto, identidade: () => window.Identidade }
  let b = null // a busca em andamento
  let aleatoria = false

  const dorme = (ms) => new Promise((ok) => setTimeout(ok, ms))
  const meuNome = () => { try { return (localStorage.getItem('mvd-imp-nome') || JSON.parse(localStorage.getItem('mvd-destino') || '{}').nome || '').slice(0, 14) } catch (e) { return '' } }

  function encerrar(busca) {
    busca.vivo = false
    busca.tempos.forEach(clearTimeout)
    busca.peers.forEach((p) => { try { p.destroy() } catch (e) {} })
    if (busca.cobra) busca.cobra.parar()
    if (busca.el) busca.el.remove()
    if (b === busca) b = null
  }
  function cancelar() { if (b) encerrar(b) }

  // ---------- tenta ocupar a vaga; se já tem dono, alguém está esperando ----------
  function ocupar(busca, n) {
    return new Promise((ok) => {
      const p = new window.Peer(PREFIXO + n)
      busca.peers.push(p)
      const fim = setTimeout(() => { try { p.destroy() } catch (e) {} ok('erro') }, 8000)
      p.on('open', () => { clearTimeout(fim); busca.minha = p; p.on('connection', (c) => receber(busca, c)); ok('esperando') })
      p.on('error', (e) => { if (busca.minha === p) return; clearTimeout(fim); try { p.destroy() } catch (x) {} ok(e.type === 'unavailable-id' ? 'ocupada' : 'erro') })
    })
  }
  // alguém achou a minha vaga
  function receber(busca, c) {
    c.on('data', (m) => {
      if (!m || m.t !== 'oi' || !busca.vivo) return
      const comum = busca.pareado ? [] : busca.jogos.filter((j) => Array.isArray(m.jogos) && m.jogos.includes(j))
      if (!comum.length) { try { c.send({ t: 'nao' }) } catch (e) {} setTimeout(() => c.close(), 300); return }
      busca.pareado = true
      const jogo = comum[Math.floor(Math.random() * comum.length)]
      c.send({ t: 'par', jogo })
      achou(busca, jogo, () => {
        CONTROLE[jogo]().partida.criar(meuNome() || t('Agente', 'Agent'), (code) => { c.send({ t: 'sala', code }); setTimeout(() => encerrar(busca), 1500) })
      })
    })
  }
  // tento entrar na vaga de alguém. Devolve true se formou par.
  function juntar(busca, n) {
    return new Promise((ok) => {
      if (!busca.vivo || busca.pareado || !busca.ligacao) return ok(false)
      const c = busca.ligacao.connect(PREFIXO + n, { reliable: true })
      let jogo = null
      const desiste = setTimeout(() => { try { c.close() } catch (e) {} ok(false) }, 5000)
      c.on('open', () => c.send({ t: 'oi', jogos: busca.jogos }))
      c.on('close', () => { if (!jogo) { clearTimeout(desiste); ok(false) } })
      c.on('data', (m) => {
        if (!m) return
        if (m.t === 'nao') { clearTimeout(desiste); c.close(); ok(false) }
        if (m.t === 'par' && JOGOS[m.jogo] && !busca.pareado) {
          clearTimeout(desiste)
          busca.pareado = true
          jogo = m.jogo
          // se eu também estava esperando, largo a minha vaga
          if (busca.minha) { try { busca.minha.destroy() } catch (e) {} busca.minha = null }
          achou(busca, jogo, () => {})
          busca.tempos.push(setTimeout(() => { if (busca.vivo) { busca.pareado = false; pintar(busca); varrer(busca) } }, 25000))
          ok(true)
        }
        if (m.t === 'sala' && jogo) {
          CONTROLE[jogo]().partida.entrar(String(m.code || ''), meuNome() || t('Agente', 'Agent'))
          setTimeout(() => encerrar(busca), 1200)
        }
      })
    })
  }

  async function varrer(busca) {
    if (!busca.ligacao) {
      busca.ligacao = new window.Peer()
      busca.peers.push(busca.ligacao)
      busca.ligacao.on('error', () => {})
      await new Promise((ok) => { busca.ligacao.on('open', ok); setTimeout(ok, 8000) })
    }
    while (busca.vivo && !busca.pareado) {
      if (busca.minha) {
        // já estou esperando numa vaga: de vez em quando olho as anteriores, pra não ficar cada um esperando num canto
        for (let n = 0; n < busca.vaga && busca.vivo && !busca.pareado; n++) if (await juntar(busca, n)) return
        await dorme(8000)
        continue
      }
      for (let n = 0; n < VAGAS && busca.vivo && !busca.pareado && !busca.minha; n++) {
        const r = await ocupar(busca, n)
        if (!busca.vivo || busca.pareado) return
        if (r === 'esperando') { busca.vaga = n; break }
        if (r === 'ocupada' && (await juntar(busca, n))) return
      }
      if (!busca.minha) await dorme(3000)
    }
  }

  // ---------- a tela ----------
  function achou(busca, jogo, seguir) {
    aleatoria = true
    if (window.Conquistas) window.Conquistas.marca('ale')
    if (busca.cobra) { busca.cobra.parar(); busca.cobra = null }
    busca.achou = jogo
    pintar(busca)
    setTimeout(() => { window.Hub.ir(jogo); seguir() }, 900)
  }
  function pintar(busca) {
    const caixa = busca.el && busca.el.querySelector('.fila-corpo')
    if (!caixa) return
    if (busca.achou) { caixa.innerHTML = `<h3>${t('Achamos alguém!', 'Found someone!')}</h3><p>${t('Indo pra', 'Heading to')} <b>${t(JOGOS[busca.achou][0], JOGOS[busca.achou][1])}</b>…</p>`; return }
    if (busca.jogando) return
    const qual = busca.jogos.length > 1 ? t('qualquer jogo', 'any game') : t(JOGOS[busca.jogos[0]][0], JOGOS[busca.jogos[0]][1])
    caixa.innerHTML = `<h3>${t('Procurando alguém', 'Looking for someone')}<i class="fila-pontos"></i></h3><p>${qual} · <b data-f="tempo">0:00</b></p>
      ${busca.avisou ? `<p class="fila-aviso">${t('Ninguém apareceu ainda. Quer jogar enquanto espera?', 'Nobody has shown up yet. Want to play while you wait?')}</p>
        <div class="online-row"><button class="btn" type="button" data-f="cobra">${t('Jogar a Cobra da Hidra', 'Play Hydra’s Snake')}</button><button class="linkish" type="button" data-f="segue">${t('continuar só procurando', 'just keep searching')}</button></div>` : ''}`
  }
  function procurar(jogos) {
    if (typeof window.Peer !== 'function') return
    cancelar()
    const busca = { vivo: true, jogos, peers: [], tempos: [], pareado: false, inicio: Date.now(), vaga: 0 }
    b = busca
    busca.el = document.createElement('div')
    busca.el.className = 'ap-passa fila'
    busca.el.setAttribute('role', 'dialog')
    busca.el.innerHTML = `<div class="fila-caixa"><span class="lbl">${t('Procurar partida', 'Find a match')}</span><div class="fila-corpo"></div><div class="fila-jogo"></div>
      <p class="note">${t('Você vai jogar com uma pessoa de verdade, que também está procurando.', 'You will play with a real person who is also searching.')}</p>
      <button class="linkish" type="button" data-f="cancela">${t('cancelar', 'cancel')}</button></div>`
    document.body.appendChild(busca.el)
    busca.el.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-f]')
      if (!a) return
      if (a.dataset.f === 'cancela') encerrar(busca)
      if (a.dataset.f === 'segue') { busca.avisou = false; pintar(busca) }
      if (a.dataset.f === 'cobra') { busca.jogando = true; busca.el.querySelector('.fila-corpo').innerHTML = `<h3 class="fila-mini">${t('Ainda procurando', 'Still searching')}<i class="fila-pontos"></i></h3>`; busca.cobra = window.Cobra.iniciar(busca.el.querySelector('.fila-jogo')) }
    })
    pintar(busca)
    busca.tempos.push(setInterval(() => {
      const x = busca.el && busca.el.querySelector('[data-f="tempo"]')
      const s = Math.floor((Date.now() - busca.inicio) / 1000)
      if (x) x.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
    }, 500))
    busca.tempos.push(setTimeout(() => { if (busca.vivo && !busca.achou && !busca.jogando) { busca.avisou = true; pintar(busca) } }, AVISO_MS))
    varrer(busca)
  }

  // qualquer botão com data-fila abre a procura: "todos" na tela inicial, ou o nome do jogo dentro dele
  document.addEventListener('click', (ev) => {
    const x = ev.target.closest && ev.target.closest('[data-fila]')
    if (x) procurar(x.dataset.fila === 'todos' ? Object.keys(JOGOS) : [x.dataset.fila])
  })

  window.Fila = { procurar, cancelar, aleatoria: () => aleatoria, sairDaPartida: () => { aleatoria = false } }
})()
