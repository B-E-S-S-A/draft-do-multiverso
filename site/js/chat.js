// Chat da banca: um balão no canto da tela pra discutir nos jogos online (Impostor e Draft).
// Cada jogo cria o seu e cuida de levar as mensagens pela própria conexão:
//   const c = Chat.criar({ id: 'imp', enviar: (txt) => ... })   // o jogo manda o texto pra sala
//   c.receber({ nome, txt, cor })                               // chegou mensagem (inclusive a sua)
//   c.mostrar(true/false)                                       // aparece só quando está online e na tela do jogo
//   c.limpar()                                                   // sala nova, conversa nova
(function () {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const X = window.Sfx

  function criar({ id, enviar }) {
    const raiz = document.createElement('div')
    raiz.className = 'chat'
    raiz.hidden = true
    raiz.innerHTML = `<button class="chat-abre" type="button" aria-expanded="false">Chat <b hidden>0</b></button>
      <section class="chat-painel" hidden aria-label="Chat da sala">
        <header><span>Chat da sala</span><button class="chat-fecha" type="button" aria-label="Fechar o chat">×</button></header>
        <ol class="chat-lista" aria-live="polite"><li class="chat-vazio">Ninguém falou nada ainda. Começa a discussão!</li></ol>
        <form class="chat-form"><input maxlength="160" autocomplete="off" enterkeyhint="send" placeholder="Escreva aqui…" aria-label="Mensagem">
          <button class="btn" type="submit">Enviar</button></form>
      </section>`
    document.body.appendChild(raiz)
    const botao = raiz.querySelector('.chat-abre')
    const conta = botao.querySelector('b')
    const painel = raiz.querySelector('.chat-painel')
    const lista = raiz.querySelector('.chat-lista')
    const campo = raiz.querySelector('input')
    let naoLidas = 0
    const aberto = () => !painel.hidden

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
      limpar() { lista.innerHTML = '<li class="chat-vazio">Ninguém falou nada ainda. Começa a discussão!</li>'; naoLidas = 0; conta.hidden = true },
    }
  }

  window.Chat = { criar }
})()
