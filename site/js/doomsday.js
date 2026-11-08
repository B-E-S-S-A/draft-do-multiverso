// A contagem regressiva pra Vingadores: Doomsday, no topo da tela inicial. A data é a do Brasil (meia-noite de Brasília).
(function () {
  const t = (pt, en) => window.Lingua.t(pt, en)
  const ALVO = Date.parse('2026-12-17T00:00:00-03:00')
  const partes = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60] }
  const doisDigitos = (n, i) => (i === 0 ? String(n) : String(n).padStart(2, '0'))
  const jaEstreou = () => t('Já está nos cinemas!', 'Now in theaters!')

  function tempo() {
    const rotulos = [t('dias', 'days'), t('horas', 'hours'), t('min', 'min'), t('seg', 'sec')]
    return `<div class="dd-tempo" role="timer">${partes(ALVO - Date.now()).map((n, i) => `<div><b data-dd="${i}">${doisDigitos(n, i)}</b><small>${rotulos[i]}</small></div>`).join('')}</div>`
  }
  function banner() {
    const acabou = Date.now() >= ALVO
    return `<section class="panel dd" aria-label="${t('Contagem regressiva para Vingadores: Doomsday', 'Countdown to Avengers: Doomsday')}">
      <img class="dd-foto" src="img/doom.webp" alt="" width="400" height="400" draggable="false">
      <div class="dd-titulo"><span class="lbl">${acabou ? t('A espera acabou', 'The wait is over') : t('Faltam', 'Coming in')}</span>
        <h2>${t('Vingadores', 'Avengers')}: <em>Doomsday</em></h2>
        <p>${t('Estreia 17 de dezembro nos cinemas', 'In theaters December 17 in Brazil')}</p>
        ${window.Invasao && window.Invasao.status() ? `<p class="dd-invasao">${window.Invasao.status()}</p>` : ''}
        <button class="btn" type="button" data-ir="destino">${acabou ? t('Minha carteirinha', 'My ID card') : t('Desafio de hoje', 'Today’s challenge')}</button></div>
      ${acabou ? `<p class="dd-ja">${jaEstreou()}</p>` : tempo()}
    </section>`
  }
  // atualiza só os números, sem redesenhar a tela
  setInterval(() => {
    const caixa = document.querySelector('.dd-tempo')
    if (!caixa) return
    const resta = ALVO - Date.now()
    if (resta <= 0) { caixa.outerHTML = `<p class="dd-ja">${jaEstreou()}</p>`; return }
    partes(resta).forEach((n, i) => { const b = caixa.querySelector(`[data-dd="${i}"]`); const v = doisDigitos(n, i); if (b && b.textContent !== v) b.textContent = v })
  }, 1000)

  window.Doomsday = { banner }
})()
