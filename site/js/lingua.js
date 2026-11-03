// Língua da banca (PT ou EN), escolhida por pessoa: fica guardada neste aparelho e vale pra todos os jogos.
// Numa sala online cada um vê o jogo na sua língua (o anfitrião manda os dados, cada aparelho escreve na própria).
//   Lingua.en()           → true se está em inglês
//   Lingua.t('oi', 'hi')  → o texto na língua atual
//   Lingua.aoMudar(fn)    → avisa quando a pessoa troca
(function () {
  const CHAVE = 'mvd-lingua'
  const guardada = (() => { try { return localStorage.getItem(CHAVE) || '' } catch (e) { return '' } })()
  // quem já tinha escolhido inglês no Impostor continua em inglês
  const doImpostor = (() => { try { return (JSON.parse(localStorage.getItem('mvd-impostor') || '{}').lingua) || '' } catch (e) { return '' } })()
  let atual = ['pt', 'en'].includes(guardada) ? guardada : doImpostor === 'en' ? 'en' : 'pt'
  const ouvintes = []

  function definir(l) {
    if (!['pt', 'en'].includes(l) || l === atual) return
    atual = l
    try { localStorage.setItem(CHAVE, l) } catch (e) {}
    document.documentElement.lang = l === 'en' ? 'en' : 'pt-BR'
    pintar()
    ouvintes.forEach((fn) => { try { fn(l) } catch (e) {} })
  }

  // botão no toldo, ao lado do som
  const botao = document.getElementById('lingua')
  function pintar() {
    if (!botao) return
    botao.innerHTML = atual === 'en' ? '<b>EN</b> · pt' : '<b>PT</b> · en'
    botao.setAttribute('aria-label', atual === 'en' ? 'Language: English (tap for Portuguese)' : 'Língua: português (toque pra inglês)')
  }
  if (botao) botao.addEventListener('click', () => definir(atual === 'en' ? 'pt' : 'en'))
  document.documentElement.lang = atual === 'en' ? 'en' : 'pt-BR'
  pintar()

  window.Lingua = {
    atual: () => atual,
    en: () => atual === 'en',
    t: (pt, en) => (atual === 'en' ? en : pt),
    definir,
    aoMudar: (fn) => ouvintes.push(fn),
  }
})()
