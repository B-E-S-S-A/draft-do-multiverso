// Tela inicial da banca: escolhe entre o Draft, o Impostor e o Adivinha. Mostra só um jogo por vez e troca o letreiro do toldo.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const telas = { home: document.getElementById('home'), draft: document.getElementById('app'), impostor: document.getElementById('impostor'), adivinha: document.getElementById('adivinha') }
  const h1 = document.querySelector('.sign h1')
  const sub = document.querySelector('.sign p')
  const voltar = document.getElementById('voltar')
  const LETREIRO = {
    home: ['Banca do <em>Multiverso</em>', 'três jogos de personagens da Marvel'],
    draft: ['Draft do <em>Multiverso</em>', 'leilão de personagens · HQ e MCU'],
  }
  let atual = 'home'

  function letreiro() {
    const l = atual === 'impostor' ? window.Impostor.letreiro() : atual === 'adivinha' ? window.Adivinha.letreiro() : LETREIRO[atual]
    h1.innerHTML = l[0]
    sub.textContent = l[1]
  }

  function ir(jogo) {
    atual = telas[jogo] ? jogo : 'home'
    document.body.dataset.jogo = atual
    for (const [k, el] of Object.entries(telas)) el.hidden = k !== atual
    voltar.hidden = atual === 'home'
    letreiro()
    if (atual === 'impostor') window.Impostor.abrir()
    if (atual === 'adivinha') window.Adivinha.abrir()
    window.scrollTo(0, 0)
  }

  // capas da vitrine: três do Draft (HQ e MCU) e, no Impostor, duas iguais e uma diferente
  const hq = (key) => E.lotOf('hq:' + D.hq.findIndex((h) => h.key === key))
  function vitrine() {
    const sorteio = E.shuffle(D.hq.map((_, i) => 'hq:' + i)).slice(0, 2).map(E.lotOf)
    const filme = E.shuffle(D.mcu.map((_, i) => 'mcu:' + i)).map(E.lotOf).find((l) => !D.works[l.w].tv)
    const mais = E.shuffle(D.hq.map((_, i) => 'hq:' + i)).slice(0, 3).map(E.lotOf)
    return { draft: [sorteio[0], filme, sorteio[1]], impostor: [hq('thor'), hq('thor'), hq('loki')], adivinha: mais }
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
        <div class="leque adivinha">${v.adivinha.map((l) => V.card(l)).join('')}<b class="leque-q" aria-hidden="true">?</b></div>
        <div class="jogo-texto">
          <h2>Adivinha do Multiverso</h2>
          <p>A capa aparece bem pixelada e vai clareando. Quem souber quem é, bate primeiro. Quanto mais cedo acertar, mais pontos.</p>
          <span class="lbl">2 a 4 jogadores · num aparelho só · HQ e MCU</span>
        </div>
        <div class="jogo-btns">
          <button class="btn big blue" type="button" data-ir="adivinha">Jogar Adivinha</button>
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
    ir(telas[pedido] ? pedido : 'home')
  })
})()
