// Tela inicial da banca: escolhe entre o Draft, o Impostor, a Bolsa e a Missão Secreta. Mostra só um jogo por vez e troca o letreiro do toldo.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const telas = { home: document.getElementById('home'), draft: document.getElementById('app'), impostor: document.getElementById('impostor'), bolsa: document.getElementById('bolsa'), missao: document.getElementById('missao') }
  const h1 = document.querySelector('.sign h1')
  const sub = document.querySelector('.sign p')
  const voltar = document.getElementById('voltar')
  const LETREIRO = {
    home: ['Banca do <em>Multiverso</em>', 'jogos de personagens da Marvel pra turma'],
    draft: ['Draft do <em>Multiverso</em>', 'leilão de personagens · HQ e MCU'],
  }
  let atual = 'home'

  function letreiro() {
    const l = atual === 'impostor' ? window.Impostor.letreiro() : atual === 'bolsa' ? window.Bolsa.letreiro() : atual === 'missao' ? window.Missao.letreiro() : LETREIRO[atual]
    h1.innerHTML = l[0]
    sub.textContent = l[1]
  }

  function ir(jogo) {
    if (atual === 'bolsa' && jogo !== 'bolsa') window.Bolsa.esconder()
    atual = telas[jogo] ? jogo : 'home'
    document.body.dataset.jogo = atual
    for (const [k, el] of Object.entries(telas)) el.hidden = k !== atual
    voltar.hidden = atual === 'home'
    letreiro()
    if (atual === 'impostor') window.Impostor.abrir()
    if (atual === 'bolsa') window.Bolsa.abrir()
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

  function home() {
    const v = vitrine()
    const leque = (lots, impostor) => `<div class="leque${impostor ? ' impostor' : ''}">${lots.map((l) => V.card(l)).join('')}</div>`
    telas.home.innerHTML = `<section class="home">
      <article class="panel jogo">
        ${leque(v.draft)}
        <div class="jogo-texto">
          <h2>Draft do Multiverso</h2>
          <p>Leilão pra 2 jogadores. Cada um começa com R$20, dá lances nos personagens que aparecem e monta o time mais forte.</p>
          <span class="lbl">2 jogadores · HQ e MCU · dá pra jogar online</span>
        </div>
        <div class="jogo-btns">
          <button class="btn big" type="button" data-ir="draft">Jogar Draft</button>
          <button class="btn green" type="button" data-ir="draft-online">Jogar online</button>
        </div>
      </article>
      <article class="panel jogo">
        ${leque(v.impostor, true)}
        <div class="jogo-texto">
          <h2>Impostor do Multiverso</h2>
          <p>Todo mundo recebe o mesmo personagem, menos o impostor, que recebe um parecido. Deem dicas e descubram quem é.</p>
          <span class="lbl">3 a 10 jogadores · num celular só ou online · PT / EN</span>
        </div>
        <div class="jogo-btns">
          <button class="btn big red" type="button" data-ir="impostor">Jogar Impostor</button>
          <button class="btn green" type="button" data-ir="impostor-online">Jogar online</button>
        </div>
      </article>
      <article class="panel jogo">
        ${leque([hq('iron-man'), hq('loki'), hq('howard')])}
        <div class="jogo-texto">
          <h2>Bolsa do Multiverso</h2>
          <p>Os personagens viram ações e o Clarim Diário mexe nos preços. Compre na baixa, venda na alta… mas tem boato no ar e um Skrull que sabe todas as notícias.</p>
          <span class="lbl">2 a 10 jogadores · cada um no seu celular · telão opcional</span>
        </div>
        <div class="jogo-btns">
          <button class="btn big green" type="button" data-ir="bolsa">Jogar Bolsa</button>
        </div>
      </article>
      <h2 class="home-secao">Pra noite toda <small>rola enquanto vocês fazem outra coisa</small></h2>
      <article class="panel jogo">
        ${leque([hq('black-widow'), hq('nick-fury'), hq('mystique')])}
        <div class="jogo-texto">
          <h2>Missão Secreta</h2>
          <p>Cada um recebe uma missão com um alvo: "faça o Lipe dizer Wakanda". Cumpra sem ninguém perceber. Desconfiou de alguém? Te peguei!</p>
          <span class="lbl">3 a 16 jogadores · cada um no seu celular · dá pra entrar no meio</span>
        </div>
        <div class="jogo-btns">
          <button class="btn big red" type="button" data-ir="missao">Jogar Missão</button>
        </div>
      </article>
    </section>`
  }

  telas.home.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-ir]')
    if (!b) return
    if (b.dataset.ir === 'draft-online') { ir('draft'); window.Draft.irParaSala() } else if (b.dataset.ir === 'impostor-online') {
      ir('impostor')
      setTimeout(() => { const n = document.getElementById('imp-on-nome'); if (n) { n.scrollIntoView({ block: 'center' }); n.focus() } }, 300)
    } else ir(b.dataset.ir)
  })
  voltar.addEventListener('click', () => ir('home'))

  window.Hub = { ir, letreiro }
  V.load().then(() => {
    home()
    const pedido = location.hash.replace('#', '')
    // link de convite: #sala-XXXX abre o Draft e já entra na sala
    const sala = pedido.match(/^sala-([A-Za-z0-9]{4})$/)
    if (sala) { ir('draft'); window.Draft.entrarSala(sala[1]); return }
    const salaImp = pedido.match(/^imp-([A-Za-z0-9]{4})$/)
    if (salaImp) { ir('impostor'); window.ImpostorOnline.entrar(salaImp[1]); return }
    const salaBo = pedido.match(/^bolsa-([A-Za-z0-9]{4})$/)
    if (salaBo) { ir('bolsa'); window.Bolsa.entrar(salaBo[1]); return }
    const salaMi = pedido.match(/^missao-([A-Za-z0-9]{4})$/)
    if (salaMi) { ir('missao'); window.Missao.entrar(salaMi[1]); return }
    ir(telas[pedido] ? pedido : 'home')
  })
})()
