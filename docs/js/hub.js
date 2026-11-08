// Tela inicial da banca: escolhe entre o Draft, o Impostor, o Aposto Que Sei, a Grade, o Arquivo Secreto, o Laboratório e a Missão Secreta. Mostra só um jogo por vez e troca o letreiro do toldo.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const L = window.Lingua
  const t = L.t
  const telas = { home: document.getElementById('home'), draft: document.getElementById('app'), impostor: document.getElementById('impostor'), aposto: document.getElementById('aposto'), grade: document.getElementById('grade'), arquivo: document.getElementById('arquivo'), lab: document.getElementById('lab'), missao: document.getElementById('missao') }
  const h1 = document.querySelector('.sign h1')
  const sub = document.querySelector('.sign p')
  const voltar = document.getElementById('voltar')
  const LETREIRO = {
    home: () => [t('Banca do <em>Multiverso</em>', 'Multiverse <em>Newsstand</em>'), t('jogos de personagens da Marvel pra turma', 'Marvel character games for the gang')],
    draft: () => [t('Draft do <em>Multiverso</em>', 'Multiverse <em>Draft</em>'), t('leilão de personagens · HQ e MCU', 'character auction · comics and MCU')],
  }
  let atual = 'home'

  function letreiro() {
    const l = atual === 'impostor' ? window.Impostor.letreiro() : atual === 'aposto' ? window.Aposto.letreiro() : atual === 'grade' ? window.Grade.letreiro() : atual === 'arquivo' ? window.Arquivo.letreiro() : atual === 'lab' ? window.Lab.letreiro() : atual === 'missao' ? window.Missao.letreiro() : LETREIRO[atual]()
    h1.innerHTML = l[0]
    sub.textContent = l[1]
    voltar.textContent = t('← Jogos', '← Games')
  }

  function ir(jogo) {
    if (atual === 'aposto' && jogo !== 'aposto') window.Aposto.esconder()
    if (atual === 'grade' && jogo !== 'grade') window.Grade.esconder()
    atual = telas[jogo] ? jogo : 'home'
    document.body.dataset.jogo = atual
    for (const [k, el] of Object.entries(telas)) el.hidden = k !== atual
    voltar.hidden = atual === 'home'
    letreiro()
    if (atual === 'impostor') window.Impostor.abrir()
    if (atual === 'aposto') window.Aposto.abrir()
    if (atual === 'grade') window.Grade.abrir()
    if (atual === 'arquivo') window.Arquivo.abrir()
    if (atual === 'lab') window.Lab.abrir()
    if (atual === 'missao') window.Missao.abrir()
    if (atual !== 'home' && window.Uatu) window.Uatu.momento('abriu-' + atual)
    if (window.Retorno) window.Retorno.visita(atual)
    window.scrollTo(0, 0)
  }

  // capas da vitrine: três do Draft (HQ e MCU) e, no Impostor, duas iguais e uma diferente
  const hq = (key) => E.lotOf('hq:' + D.hq.findIndex((h) => h.key === key))
  function vitrine() {
    const sorteio = E.shuffle(D.hq.map((_, i) => 'hq:' + i)).slice(0, 2).map(E.lotOf)
    const filme = E.shuffle(D.mcu.map((_, i) => 'mcu:' + i)).map(E.lotOf).find((l) => !D.works[l.w].tv)
    return { draft: [sorteio[0], filme, sorteio[1]], impostor: [hq('thor'), hq('thor'), hq('loki')] }
  }

  // a capa da Grade: um jogo da velha de verdade, com capas nas casas e o risco na diagonal de quem ganhou
  function capaGrade() {
    const casas = [['spider-man', 'p1'], [], ['doctor-doom', 'p2'], ['magneto', 'p2'], ['hulk', 'p1'], [], [], ['loki', 'p2'], ['captain-america', 'p1']]
    return `<div class="capa-grade" aria-hidden="true"><div>${casas.map(([k, cor]) => (k ? `<i class="${cor}">${V.cover(hq(k))}</i>` : '<i></i>')).join('')}</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"><line class="t" x1="8" y1="8" x2="92" y2="92"/><line x1="8" y1="8" x2="92" y2="92"/></svg></div>`
  }

  // a capa do Arquivo Secreto: uma ficha com foto em branco e tarjas pretas
  const capaArquivo = () => `<div class="capa-arquivo" aria-hidden="true"><div class="topo"><u>?</u><b>${t('CONFIDENCIAL', 'CLASSIFIED')}</b></div><i></i><i></i><i></i><p>${t('Quem é?', 'Who is it?')}</p></div>`

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
      ${jogo(capaGrade(), t('Grade do Multiverso', 'Multiverse Grid'),
        t('Um grid com uma categoria em cada linha e coluna ("Fase 4 do MCU" × "Tem irmão"). Diga um personagem que vale nas duas e a casa é sua. Quem fechar a linha primeiro ganha.',
          'A grid with a category on every row and column ("MCU Phase 4" × "Has a sibling"). Name a character who fits both and the square is yours. First to fill a line wins.'),
        t('1 contra 1 · grid do tamanho que quiser · num celular só ou online', '1 vs 1 · any grid size you want · on one phone or online'),
        `<button class="btn big" type="button" data-ir="grade">${t('Jogar Grade', 'Play Grid')}</button>${online('grade-online')}`)}
      ${jogo(capaArquivo(), t('Arquivo Secreto', 'Secret File'),
        t('A ficha de um personagem vai sendo revelada, uma pista por vez. Quanto antes você acertar quem é, mais pontos ganha. Errou, perde 1 e tenta na próxima.',
          'A character’s file opens one clue at a time. The sooner you guess who it is, the more points you get. Miss, lose 1 and try on the next one.'),
        t('2 a 8 jogadores · HQ, filmes ou os dois · num celular só ou online', '2 to 8 players · comics, movies or both · on one phone or online'),
        `<button class="btn big" type="button" data-ir="arquivo">${t('Jogar Arquivo', 'Play Secret File')}</button>${online('arquivo-online')}`)}
      ${jogo(leque([hq('hulk'), hq('high-evolutionary'), hq('spider-man')]), t('Laboratório do Alto Evolucionário', 'The High Evolutionary’s Lab'),
        t('Sai um personagem e você decide o que ele vira no seu herói: a Força, o Corpo, a Agilidade, a Inteligência… Sem trocar e sem saber quem vem depois. No fim, os heróis se enfrentam em mata-mata e a turma vota.',
          'A character shows up and you decide what they become in your hero: the Strength, the Body, the Agility, the Intelligence… No changing it, and no knowing who is next. Then the heroes face off in a knockout and the gang votes.'),
        t('3 a 8 jogadores · num celular só ou online', '3 to 8 players · on one phone or online'),
        `<button class="btn big red" type="button" data-ir="lab">${t('Jogar Laboratório', 'Play the Lab')}</button>${online('lab-online')}`)}
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
    else if (b.dataset.ir === 'aposto-online') { ir('aposto'); foca('ap-meu') }
    else if (b.dataset.ir === 'grade-online') { ir('grade'); foca('gd-meu') }
    else if (b.dataset.ir === 'arquivo-online') { ir('arquivo'); foca('aq-meu') }
    else if (b.dataset.ir === 'lab-online') { ir('lab'); foca('lab-meu') }
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
    const salaGd = pedido.match(/^grade-([A-Za-z0-9]{4})$/)
    if (salaGd) { ir('grade'); window.Grade.entrar(salaGd[1]); return }
    const salaAq = pedido.match(/^arquivo-([A-Za-z0-9]{4})$/)
    if (salaAq) { ir('arquivo'); window.Arquivo.entrar(salaAq[1]); return }
    const salaLab = pedido.match(/^lab-([A-Za-z0-9]{4})$/)
    if (salaLab) { ir('lab'); window.Lab.entrar(salaLab[1]); return }
    const salaMi = pedido.match(/^missao-([A-Za-z0-9]{4})$/)
    if (salaMi) { ir('missao'); window.Missao.entrar(salaMi[1]); return }
    ir(telas[pedido] ? pedido : 'home')
  })
})()
