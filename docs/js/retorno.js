// Conta visitas e leva as sugestões pro servidorzinho (worker/banca.js). Enquanto API estiver vazio, nada disso liga e o botão não aparece.
(function () {
  const API = ''
  const t = (pt, en) => window.Lingua.t(pt, en)
  const COOLDOWN = 60000
  const envia = (rota, dados) => fetch(API + rota, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(dados), keepalive: true })
  const lembra = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v) } catch (e) { return null } return null }
  let pagina = 'home'

  // cada página conta uma vez por visita (sem cookie, sem cadastro)
  function visita(p) {
    pagina = p
    if (!API || lembra('mvd-viu-' + p)) return
    lembra('mvd-viu-' + p, '1')
    envia('/visita', { p }).catch(() => {})
  }

  const ERROS = {
    curto: () => t('Escreve um pouquinho mais.', 'Write a little more.'),
    longo: () => t('Ficou comprido demais (máximo 500 letras).', 'That is too long (500 characters at most).'),
    link: () => t('Sem links, por favor.', 'No links, please.'),
    contato: () => t('Não coloque e-mail nem telefone.', 'Please do not include email or phone numbers.'),
    inutil: () => t('Não deu pra entender. Escreve de novo?', 'That did not make sense. Try again?'),
    muitas: () => t('Você já mandou bastante hoje. Volta mais tarde.', 'You have sent plenty today. Come back later.'),
    cheio: () => t('A caixa do Vigia está cheia hoje. Tenta amanhã.', 'The Watcher’s inbox is full today. Try tomorrow.'),
  }
  const FALHOU = () => t('Não consegui enviar. Tenta de novo daqui a pouco.', 'Could not send it. Try again in a bit.')

  let caixa = null
  let abriu = 0
  let tipo = 'sugestao'
  function fechar() { if (caixa) { caixa.remove(); caixa = null } }
  function aviso(txt) { const a = caixa && caixa.querySelector('.rt-aviso'); if (a) a.textContent = txt }
  function abrir() {
    fechar()
    abriu = Date.now()
    tipo = 'sugestao'
    caixa = document.createElement('div')
    caixa.className = 'ap-passa rt'
    caixa.setAttribute('role', 'dialog')
    caixa.innerHTML = `<form class="rt-caixa" novalidate>
      <h3>${t('Conta pro Vigia', 'Tell the Watcher')}</h3>
      <p>${t('Sugestão, erro, ideia de jogo. Eu observo tudo.', 'A suggestion, a bug, a game idea. I observe everything.')}</p>
      <div class="presets"><button class="preset" type="button" data-rt="sugestao" aria-pressed="true">${t('Sugestão', 'Suggestion')}</button><button class="preset" type="button" data-rt="erro" aria-pressed="false">${t('Achei um erro', 'Found a bug')}</button></div>
      <label><span class="sr-only">${t('Mensagem', 'Message')}</span><textarea id="rt-texto" maxlength="500" rows="4" placeholder="${t('Escreve aqui…', 'Write here…')}"></textarea></label>
      <label class="rt-isca" aria-hidden="true">Site<input id="rt-site" name="site" tabindex="-1" autocomplete="off"></label>
      <p class="note">${t('Não coloque dados pessoais.', 'Please do not include personal details.')}</p>
      <p class="rt-aviso" role="status"></p>
      <div class="go-row"><button class="linkish" type="button" data-rt="fecha">${t('fechar', 'close')}</button><button class="btn" type="submit">${t('Mandar', 'Send')}</button></div>
    </form>`
    document.body.appendChild(caixa)
    caixa.addEventListener('click', (ev) => {
      if (ev.target === caixa) return fechar()
      const b = ev.target.closest('[data-rt]')
      if (!b) return
      if (b.dataset.rt === 'fecha') return fechar()
      tipo = b.dataset.rt
      caixa.querySelectorAll('.preset').forEach((x) => x.setAttribute('aria-pressed', x === b))
    })
    caixa.querySelector('form').addEventListener('submit', enviar)
    caixa.querySelector('textarea').focus()
  }
  async function enviar(ev) {
    ev.preventDefault()
    const texto = caixa.querySelector('#rt-texto').value.trim()
    if (texto.length < 8) return aviso(ERROS.curto())
    let ultima = 0
    try { ultima = Number(localStorage.getItem('mvd-sugeriu') || 0) } catch (e) {}
    if (Date.now() - ultima < COOLDOWN) return aviso(t('Espera um minutinho pra mandar outra.', 'Wait a minute before sending another.'))
    const botao = caixa.querySelector('button[type="submit"]')
    botao.disabled = true
    try {
      const r = await envia('/sugestao', { texto, tipo, p: pagina, ms: Date.now() - abriu, site: caixa.querySelector('#rt-site').value })
      const d = await r.json()
      if (!caixa) return
      if (d.ok) {
        try { localStorage.setItem('mvd-sugeriu', String(Date.now())) } catch (e) {}
        fechar()
        if (window.Uatu) window.Uatu.falar(t('Anotado. E não, não vou contar quem mandou.', 'Noted. And no, I will not tell who sent it.'))
        return
      }
      aviso((ERROS[d.erro] || FALHOU)())
    } catch (e) { aviso(FALHOU()) }
    if (caixa) botao.disabled = false
  }

  // o botão fica no rodapé, em todas as telas
  function botao() {
    const rodape = document.querySelector('.rodape')
    if (!rodape) return
    let b = document.getElementById('sugerir')
    if (!b) {
      rodape.insertAdjacentHTML('beforeend', ' <button class="linkish" id="sugerir" type="button"></button>')
      b = document.getElementById('sugerir')
      b.addEventListener('click', abrir)
    }
    b.textContent = t('Mandar sugestão ou erro', 'Send a suggestion or bug')
  }
  if (API) { botao(); window.Lingua.aoMudar(botao) }

  window.Retorno = { visita }
})()
