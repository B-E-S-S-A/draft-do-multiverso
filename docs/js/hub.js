// Tela inicial da banca: escolhe entre o Draft, o Impostor, o Aposto Que Sei, as Minas e a Missão Secreta. Mostra só um jogo por vez e troca o letreiro do toldo.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const L = window.Lingua
  const t = L.t
  const telas = { home: document.getElementById('home'), draft: document.getElementById('app'), impostor: document.getElementById('impostor'), aposto: document.getElementById('aposto'), minas: document.getElementById('minas'), missao: document.getElementById('missao') }
  const h1 = document.querySelector('.sign h1')
  const sub = document.querySelector('.sign p')
  const voltar = document.getElementById('voltar')
  const LETREIRO = {
    home: () => [t('Banca do <em>Multiverso</em>', 'Multiverse <em>Newsstand</em>'), t('jogos de personagens da Marvel pra turma', 'Marvel character games for the gang')],
    draft: () => [t('Draft do <em>Multiverso</em>', 'Multiverse <em>Draft</em>'), t('leilão de personagens · HQ e MCU', 'character auction · comics and MCU')],
  }
  let atual = 'home'

  function letreiro() {
    const l = atual === 'impostor' ? window.Impostor.letreiro() : atual === 'aposto' ? window.Aposto.letreiro() : atual === 'minas' ? window.Minas.letreiro() : atual === 'missao' ? window.Missao.letreiro() : LETREIRO[atual]()
    h1.innerHTML = l[0]
    sub.textContent = l[1]
    voltar.textContent = t('← Jogos', '← Games')
  }

  function ir(jogo) {
    if (atual === 'aposto' && jogo !== 'aposto') window.Aposto.esconder()
    if (atual === 'minas' && jogo !== 'minas') window.Minas.esconder()
    atual = telas[jogo] ? jogo : 'home'
    document.body.dataset.jogo = atual
    for (const [k, el] of Object.entries(telas)) el.hidden = k !== atual
    voltar.hidden = atual === 'home'
    letreiro()
    if (atual === 'impostor') window.Impostor.abrir()
    if (atual === 'aposto') window.Aposto.abrir()
    if (atual === 'minas') window.Minas.abrir()
    if (atual === 'missao') window.Missao.abrir()
    window.scrollTo(0, 0)
  }

  // capas da vitrine: três do Draft (HQ e MCU) e, no Impostor, duas iguais e uma diferente
  const hq = (key) => E.lotOf('hq:' + D.hq.findIndex((h) => h.key === key))
  function vitrine() {
    const sorteio = E.shuffle(D.hq.map((_, i) => 'hq:' + i)).slice(0, 2).map(E.lotOf)
    const filme = E.shuffle(D.mcu.map((_, i) => 'mcu:' + i)).map(E.lotOf).find((l) => !D.works[l.w].tv)
    return { draft: [sorteio[0], filme, sorteio[1]], impostor: [hq('thor'), hq('thor'), hq('loki')] }
  }

  let v = null
  function home() {
    v = v || vitrine()
    const leque = (lots, impostor) => `<div class="leque${impostor ? ' impostor' : ''}">${lots.map((l) => V.card(l)).join('')}</div>`
    const jogo = (capas, titulo, texto, lbl, botoes) => `<article class="panel jogo">${capas}
        <div class="jogo-texto"><h2>${titulo}</h2><p>${texto}</p><span class="lbl">${lbl}</span></div>
        <div class="jogo-btns">${botoes}</div></article>`
    const online = (ir) => `<button class="btn green" type="button" data-ir="${ir}">${t('Jogar online', 'Play online')}</button>`
    telas.home.innerHTML = `<section class="home">
      ${jogo(leque(v.draft), t('Draft do Multiverso', 'Multiverse Draft'),
        t('Leilão pra 2 jogadores. Cada um começa com R$20, dá lances nos personagens que aparecem e monta o time mais forte.',
          'An auction for 2 players. Each starts with R$20, bids on the characters that show up and builds the strongest team.'),
        t('2 jogadores · HQ e MCU · dá pra jogar online', '2 players · comics and MCU · can be played online'),
        `<button class="btn big" type="button" data-ir="draft">${t('Jogar Draft', 'Play Draft')}</button>${online('draft-online')}`)}
      ${jogo(leque(v.impostor, true), t('Impostor do Multiverso', 'Multiverse Impostor'),
        t('Todo mundo recebe o mesmo personagem, menos o impostor, que recebe um parecido. Deem dicas e descubram quem é.',
          'Everyone gets the same character except the impostor, who gets a similar one. Give clues and find out who it is.'),
        t('3 a 10 jogadores · num celular só ou online', '3 to 10 players · on one phone or online'),
        `<button class="btn big red" type="button" data-ir="impostor">${t('Jogar Impostor', 'Play Impostor')}</button>${online('impostor-online')}`)}
      ${jogo(leque([hq('wolverine'), hq('green-goblin'), hq('groot')]), t('Aposto Que Sei', 'Bet I Know'),
        t('Sai um tema ("inimigos do Homem-Aranha") e cada um aposta quantos nomes sabe, sem limite. Quem apostou mais prova na hora, falando ou escrevendo. Nome raro vale mais. Tem truco.',
          'A theme comes up ("Spider-Man villains") and everyone bets how many names they know, no limit. The top bidder proves it on the spot, saying or typing them. Rare names are worth more. Has truco.'),
        t('2 a 7 jogadores · num celular só ou online', '2 to 7 players · on one phone or online'),
        `<button class="btn big" type="button" data-ir="aposto">${t('Jogar Aposto', 'Play Bet I Know')}</button>${online('aposto-online')}`)}
      ${jogo(leque([hq('venom'), hq('scarlet-witch'), hq('green-goblin')]), t('Minas do Multiverso', 'Multiverse Mines'),
        t('Cada um esconde 2 minas em nomes do tema. Dois duelam falando nomes, um de cada vez. Falou a mina de alguém? BOOM, perde uma vida. Último vivo ganha.',
          'Everyone hides 2 mines in names from the theme. Two players duel saying names, one at a time. Said someone\'s mine? BOOM, you lose a life. Last one alive wins.'),
        t('2 a 7 jogadores · num celular só ou online · ninguém fica de fora', '2 to 7 players · on one phone or online · nobody sits out'),
        `<button class="btn big red" type="button" data-ir="minas">${t('Jogar Minas', 'Play Mines')}</button>${online('minas-online')}`)}
      <h2 class="home-secao">${t('Pra noite toda', 'For the whole night')} <small>${t('rola enquanto vocês fazem outra coisa', 'runs while you do something else')}</small></h2>
      ${jogo(leque([hq('black-widow'), hq('nick-fury'), hq('mystique')]), t('Missão Secreta', 'Secret Mission'),
        t('Cada um recebe uma missão com um alvo: "faça o Lipe dizer Wakanda". Cumpra sem ninguém perceber. Desconfiou de alguém? Te peguei!',
          'Everyone gets a mission with a target: "make Lipe say Wakanda". Pull it off without anyone noticing. Suspect someone? Gotcha!'),
        t('3 a 16 jogadores · cada um no seu celular · dá pra entrar no meio', '3 to 16 players · each on their own phone · can join midway'),
        `<button class="btn big red" type="button" data-ir="missao">${t('Jogar Missão', 'Play Mission')}</button>`)}
    </section>`
  }

  telas.home.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-ir]')
    if (!b) return
    const foca = (id) => setTimeout(() => { const n = document.getElementById(id); if (n) { n.scrollIntoView({ block: 'center' }); n.focus() } }, 300)
    if (b.dataset.ir === 'draft-online') { ir('draft'); window.Draft.irParaSala() }
    else if (b.dataset.ir === 'impostor-online') { ir('impostor'); foca('imp-on-nome') }
    else if (b.dataset.ir === 'minas-online') { ir('minas'); foca('mn-meu') }
    else if (b.dataset.ir === 'aposto-online') { ir('aposto'); foca('ap-meu') }
    else ir(b.dataset.ir)
  })
  voltar.addEventListener('click', () => ir('home'))

  // trocou a língua: redesenha a vitrine e o letreiro (cada jogo cuida da própria tela)
  L.aoMudar(() => { home(); letreiro() })

  window.Hub = { ir, letreiro }
  V.load().then(() => {
    home()
    const pedido = location.hash.replace('#', '')
    // link de convite: #sala-XXXX abre o Draft e já entra na sala
    const sala = pedido.match(/^sala-([A-Za-z0-9]{4})$/)
    if (sala) { ir('draft'); window.Draft.entrarSala(sala[1]); return }
    const salaImp = pedido.match(/^imp-([A-Za-z0-9]{4})$/)
    if (salaImp) { ir('impostor'); window.ImpostorOnline.entrar(salaImp[1]); return }
    const salaAp = pedido.match(/^aposto-([A-Za-z0-9]{4})$/)
    if (salaAp) { ir('aposto'); window.Aposto.entrar(salaAp[1]); return }
    const salaMn = pedido.match(/^minas-([A-Za-z0-9]{4})$/)
    if (salaMn) { ir('minas'); window.Minas.entrar(salaMn[1]); return }
    const salaMi = pedido.match(/^missao-([A-Za-z0-9]{4})$/)
    if (salaMi) { ir('missao'); window.Missao.entrar(salaMi[1]); return }
    ir(telas[pedido] ? pedido : 'home')
  })
})()
