// Memória do Multiverso: um jogo da memória calminho pra 2 a 4… até o multiverso dar erro.
// Depois do 3º par achado (ou de 35 s), a tela "quebra" e o jogo vira o Snap do Multiverso (snap.js).
// Os pares que cada um achou aqui viram escudos lá.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const X = window.Sfx
  const el = document.getElementById('memoria')
  const esc = V.esc
  const SAVE = 'mvd-memoria'
  const som = (f, p) => { if (X && X.on) X[f](p) }
  const vibrar = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms) } catch (e) {} }

  const C = { n: 2, nomes: ['', '', '', ''] }
  try { Object.assign(C, JSON.parse(localStorage.getItem(SAVE) || '{}')) } catch (e) {}
  C.n = Math.min(4, Math.max(2, Number(C.n) || 2))
  C.nomes = [0, 1, 2, 3].map((i) => String((C.nomes && C.nomes[i]) || ''))
  const salvar = () => { try { localStorage.setItem(SAVE, JSON.stringify(C)) } catch (e) {} }
  const nome = (p) => (C.nomes[p] && C.nomes[p].trim()) || `Jogador ${p + 1}`
  const cor = (p) => `--cor: var(--c${p})`

  let tela = 'regras'
  let M = null
  let quebraT = 0

  // ---------- memória ----------
  function novo() {
    const pers = E.shuffle(D.hq.map((_, i) => i)).slice(0, 8)
    M = { cartas: E.shuffle([...pers, ...pers]).map((hq) => ({ hq, aberta: false, dono: -1 })), vez: 0, abertas: [], pares: Array(C.n).fill(0), travado: false, achados: 0, pers }
    tela = 'memoria'
    clearTimeout(quebraT)
    quebraT = setTimeout(quebrar, 35000) // se estiverem demorando, o multiverso quebra sozinho
    render()
  }

  function virar(i) {
    const c = M && M.cartas[i]
    if (!c || tela !== 'memoria' || M.travado || c.aberta || c.dono >= 0) return
    c.aberta = true
    M.abertas.push(i)
    som('tick')
    pintar()
    if (M.abertas.length < 2) return
    const [a, b] = M.abertas
    M.abertas = []
    if (M.cartas[a].hq === M.cartas[b].hq) {
      M.cartas[a].dono = M.cartas[b].dono = M.vez
      M.pares[M.vez] += 1
      M.achados += 1
      som('sold')
      pintar()
      if (M.achados >= 3) { M.travado = true; setTimeout(quebrar, 900) }
    } else {
      M.travado = true
      setTimeout(() => {
        M.cartas[a].aberta = M.cartas[b].aberta = false
        M.travado = false
        M.vez = (M.vez + 1) % C.n
        pintar()
      }, 950)
    }
  }

  // ---------- o erro no multiverso ----------
  function quebrar() {
    if (tela !== 'memoria') return
    clearTimeout(quebraT)
    tela = 'glitch'
    C.visto = true
    salvar()
    const sec = el.querySelector('.mm-jogo')
    if (sec) sec.classList.add('quebrando')
    el.insertAdjacentHTML('beforeend', `<div class="mm-erro" role="alert"><b data-t="ERRO NO MULTIVERSO">ERRO NO MULTIVERSO</b><small>terra-616 · incursão detectada</small></div>`)
    som('hammer')
    vibrar([60, 40, 120])
    setTimeout(() => som('undo'), 500)
    setTimeout(() => { if (tela === 'glitch') snap(M.pares) }, 2600)
  }

  function snap(escudos) {
    tela = 'snap'
    const erro = el.querySelector('.mm-erro')
    if (erro) erro.remove()
    if (window.Hub) window.Hub.letreiro()
    window.Snap.comecar({ el, nomes: [...Array(C.n).keys()].map(nome), escudos, aoSair: () => { tela = 'regras'; if (window.Hub) window.Hub.letreiro(); render() } })
  }

  // ---------- telas ----------
  function telaRegras() {
    const nomes = [...Array(C.n).keys()].map((p) => `<label class="imp-nome" style="${cor(p)}"><span class="sr-only">Jogador ${p + 1}</span>
      <input id="mm-nome-${p}" maxlength="14" autocomplete="off" placeholder="Jogador ${p + 1}" value="${esc(C.nomes[p])}"></label>`).join('')
    return `<section class="setup mm">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>Jogo da memória</h2>
          <div class="field"><span class="lbl">Jogadores</span>
            <div class="stepper">
              <button class="btn paper step" type="button" data-m="n" data-v="-1" aria-label="Um a menos"${C.n <= 2 ? ' disabled' : ''}>−</button>
              <b class="imp-n">${C.n}</b>
              <button class="btn paper step" type="button" data-m="n" data-v="1" aria-label="Um a mais"${C.n >= 4 ? ' disabled' : ''}>+</button>
            </div>
            <div class="imp-nomes">${nomes}</div>
          </div>
        </div>
        <div class="panel">
          <h2>Como jogar</h2>
          <ol class="how">
            <li>Na sua vez, vire duas cartas.</li>
            <li>Achou um par? Fica com ele e joga de novo.</li>
            <li>Quem tiver mais pares no fim ganha.</li>
          </ol>
          <p class="note">Deixem o aparelho deitado na mesa, no meio de vocês.</p>
        </div>
      </div>
      <div class="go-row"><button class="btn big" type="button" data-m="comecar">Começar</button>
        ${C.visto ? '<button class="btn red" type="button" data-m="pular">Pular direto pro Snap</button>' : ''}</div>
    </section>`
  }

  function telaMemoria() {
    return `<section class="mm-jogo">
      <div class="imp-topo"><span class="hint" id="mm-vez"></span><button class="linkish" type="button" data-m="regras">Regras</button></div>
      <div class="mm-placar" id="mm-placar"></div>
      <div class="mm-grade">${M.cartas.map((c, i) => {
        const l = E.lotOf('hq:' + c.hq)
        return `<button class="mm-carta" type="button" data-m="virar" data-v="${i}" aria-label="Carta ${i + 1}">
          <span class="mm-face mm-verso"><b>?</b></span><span class="mm-face mm-frente">${V.cover(l)}<small>${esc(l.n)}</small></span></button>`
      }).join('')}</div>
    </section>`
  }

  // atualiza só o que mudou (as cartas giram sem a grade ser redesenhada)
  function pintar() {
    if (!M || tela === 'regras') return
    el.querySelectorAll('.mm-carta').forEach((b, i) => {
      const c = M.cartas[i]
      b.classList.toggle('aberta', c.aberta || c.dono >= 0)
      b.classList.toggle('achada', c.dono >= 0)
      if (c.dono >= 0) b.style.setProperty('--cor', `var(--c${c.dono})`)
    })
    const vez = document.getElementById('mm-vez')
    if (vez) { vez.textContent = `Vez de ${nome(M.vez)}`; vez.setAttribute('style', cor(M.vez)) }
    const pl = document.getElementById('mm-placar')
    if (pl) pl.innerHTML = [...Array(C.n).keys()].map((p) => `<span class="${p === M.vez ? 'vez' : ''}" style="${cor(p)}">${esc(nome(p))} <b>${M.pares[p]}</b></span>`).join('')
  }

  function render() {
    if (tela === 'snap' || tela === 'glitch') return
    if (tela === 'memoria' && M) { el.innerHTML = telaMemoria(); pintar(); return }
    tela = 'regras'
    el.innerHTML = telaRegras()
  }

  const acoes = {
    n: (v) => { C.n = Math.min(4, Math.max(2, C.n + Number(v))); salvar(); render() },
    comecar: () => { novo(); som('draw'); window.scrollTo(0, 0) },
    pular: () => { clearTimeout(quebraT); snap(Array(C.n).fill(0)) },
    regras: () => { clearTimeout(quebraT); tela = 'regras'; render() },
    virar: (v) => virar(Number(v)),
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-m]')
    if (!b || b.disabled) return
    acoes[b.dataset.m](b.dataset.v)
  })
  el.addEventListener('input', (ev) => {
    const m = ev.target.id && ev.target.id.match(/^mm-nome-(\d)$/)
    if (!m) return
    C.nomes[Number(m[1])] = ev.target.value.slice(0, 14)
    salvar()
  })

  let pronto = null
  window.Memoria = {
    letreiro: () => (tela === 'snap' ? ['Snap do <em>Multiverso</em>', 'bata primeiro!'] : ['Memória do <em>Multiverso</em>', 'ache os pares, sem pressa']),
    abrir() { if (!pronto) pronto = V.load(); pronto.then(render) },
    sair() { if (tela === 'snap' && window.Snap) window.Snap.parar(); clearTimeout(quebraT); if (tela !== 'regras') { tela = 'regras' } },
  }
})()
