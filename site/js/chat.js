// Chat da banca: um balão no canto da tela pra discutir nos jogos online (Impostor e Draft).
// Cada jogo cria o seu e cuida de levar as mensagens pela própria conexão:
//   const c = Chat.criar({ id: 'imp', enviar: (txt) => ... })   // o jogo manda o texto pra sala
//   c.receber({ nome, txt, cor })                               // chegou mensagem (inclusive a sua)
//   c.mostrar(true/false)                                       // aparece só quando está online e na tela do jogo
//   c.limpar()                                                   // sala nova, conversa nova
(function () {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const X = window.Sfx
  const t = (pt, en) => window.Lingua.t(pt, en)
  const VAZIO = () => `<li class="chat-vazio">${t('Ninguém falou nada ainda. Começa a discussão!', 'Nobody has said anything yet. Start the discussion!')}</li>`

  function criar({ id, enviar }) {
    const raiz = document.createElement('div')
    raiz.className = 'chat'
    raiz.hidden = true
    raiz.innerHTML = `<button class="chat-abre" type="button" aria-expanded="false">Chat <b hidden>0</b></button>
      <section class="chat-painel" hidden>
        <header><span></span><button class="chat-fecha" type="button">×</button></header>
        <ol class="chat-lista" aria-live="polite">${VAZIO()}</ol>
        <form class="chat-form"><input maxlength="160" autocomplete="off" enterkeyhint="send">
          <button class="btn" type="submit"></button></form>
      </section>`
    document.body.appendChild(raiz)
    const botao = raiz.querySelector('.chat-abre')
    const conta = botao.querySelector('b')
    const painel = raiz.querySelector('.chat-painel')
    const lista = raiz.querySelector('.chat-lista')
    const campo = raiz.querySelector('input')
    let naoLidas = 0
    const aberto = () => !painel.hidden
    // os textos do balão, na língua deste aparelho
    function pintar() {
      painel.setAttribute('aria-label', t('Chat da sala', 'Room chat'))
      raiz.querySelector('header span').textContent = t('Chat da sala', 'Room chat')
      raiz.querySelector('.chat-fecha').setAttribute('aria-label', t('Fechar o chat', 'Close the chat'))
      campo.placeholder = t('Escreva aqui…', 'Type here…')
      campo.setAttribute('aria-label', t('Mensagem', 'Message'))
      raiz.querySelector('.chat-form .btn').textContent = t('Enviar', 'Send')
      const vazio = lista.querySelector('.chat-vazio')
      if (vazio) vazio.outerHTML = VAZIO()
    }
    pintar()
    window.Lingua.aoMudar(pintar)

    function abrir(sim) {
      painel.hidden = !sim
      botao.setAttribute('aria-expanded', String(sim))
      if (sim) { naoLidas = 0; conta.hidden = true; lista.scrollTop = lista.scrollHeight; campo.focus() }
    }
    botao.addEventListener('click', () => abrir(!aberto()))
    raiz.querySelector('.chat-fecha').addEventListener('click', () => abrir(false))
    raiz.querySelector('form').addEventListener('submit', (ev) => {
      ev.preventDefault()
      const txt = campo.value.trim().slice(0, 160)
      if (!txt) return
      campo.value = ''
      enviar(txt)
      campo.focus()
    })

    return {
      id,
      receber(m) {
        const vazio = lista.querySelector('.chat-vazio')
        if (vazio) vazio.remove()
        const li = document.createElement('li')
        li.style.setProperty('--cor', `var(--c${(Number(m.cor) || 0) % 10})`)
        li.innerHTML = `<b>${esc(m.nome || '?')}</b> ${esc(m.txt || '')}`
        lista.appendChild(li)
        while (lista.children.length > 80) lista.firstChild.remove()
        lista.scrollTop = lista.scrollHeight
        if (!aberto() && !m.eu) { naoLidas += 1; conta.textContent = naoLidas; conta.hidden = false; if (X && X.on) X.tick() }
      },
      mostrar(sim) { raiz.hidden = !sim; if (!sim) abrir(false) },
      limpar() { lista.innerHTML = VAZIO(); naoLidas = 0; conta.hidden = true },
    }
  }

  window.Chat = { criar }
})()
