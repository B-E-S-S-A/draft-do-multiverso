// Telas dos Dias de Destino. Recebem o estado e devolvem HTML; quem manda é destino.js.
(function () {
  const V = window.View
  const E = window.Engine
  const M = window.DestinoMotor
  const esc = V.esc
  const t = (pt, en) => window.Lingua.t(pt, en)
  const en = () => window.Lingua.en()
  const GD = () => window.GradeDados
  const GT = () => window.GradeTelas
  const AT = () => window.ArquivoTelas
  const indice = {}
  E.D.hq.forEach((h, i) => { indice[h.key] = i })
  const lote = (key) => E.lotOf('hq:' + indice[key])
  const capa = (key) => V.cover(lote(key))
  const nome = (key) => GT().nome(key)
  const ident = (key) => V.idDe(lote(key)) || ''

  const TIPOS = {
    ficha: () => [t('Ficha secreta', 'Secret file'), t('Descubra o personagem com o mínimo de pistas.', 'Work out the character with as few clues as you can.')],
    grade: () => [t('Grade 3×3', '3×3 Grid'), t(`Preencha o grid inteiro. Você pode errar só ${M.VIDAS - 1} vezes.`, `Fill the whole grid. You can only miss ${M.VIDAS - 1} times.`)],
    lab: () => [t('Herói do dia', 'Hero of the day'), t('Monte seu herói com os 8 personagens de hoje.', 'Build your hero from today’s 8 characters.')],
  }
  const nomePatente = (p) => (en() ? p.en : p.pt)

  // ---------- criar ou editar a carteirinha ----------
  function sugestoesFav(ui) {
    if (!ui.busca.trim()) return `<p class="gd-vazio">${t('Comece a digitar um nome.', 'Start typing a name.')}</p>`
    const lista = GT().achar(ui.busca, 'ambos').slice(0, 5)
    if (!lista.length) return `<p class="gd-vazio">${t('Ninguém com esse nome na lista.', 'Nobody by that name on the list.')}</p>`
    return lista.map((k) => `<button class="gd-sug" type="button" data-d="fav" data-v="${k}"><span class="gd-mini">${capa(k)}</span><b>${esc(nome(k))}</b><small>${esc(ident(k))}</small></button>`).join('')
  }
  function criar(ui) {
    return `<section class="ds"><div class="panel ds-criar">
      <h2>${t('Crie sua carteirinha', 'Create your ID card')}</h2>
      <p>${t('Um desafio por dia até a estreia de Doomsday. Cada um dá pontos, e os pontos sobem sua patente.', 'One challenge a day until Doomsday opens. Each one earns points, and points raise your rank.')}</p>
      <label class="imp-meu-nome"><span class="lbl">${t('Seu nome', 'Your name')}</span><input id="ds-nome" maxlength="14" autocomplete="off" value="${esc(ui.nome)}"></label>
      <div class="field"><span class="lbl">${t('Seu personagem favorito', 'Your favorite character')}</span>
        ${ui.fav ? `<div class="gd-sug primeira"><span class="gd-mini">${capa(ui.fav)}</span><b>${esc(nome(ui.fav))}</b><small>${esc(ident(ui.fav))}</small></div>` : ''}
        <label class="gd-busca"><span class="sr-only">${t('Personagem', 'Character')}</span><input id="ds-fav" maxlength="30" autocomplete="off" placeholder="${t('Procurar personagem…', 'Search for a character…')}" value="${esc(ui.busca)}"></label>
        <div class="gd-sugestoes" id="ds-sug">${sugestoesFav(ui)}</div>
      </div>
      ${ui.aviso ? `<p class="neterr" role="alert">${esc(ui.aviso)}</p>` : ''}
      <div class="go-row">${ui.editando ? `<button class="linkish" type="button" data-d="voltar">${t('voltar', 'back')}</button>` : ''}<button class="btn big" type="button" data-d="salvar-cartao">${ui.editando ? t('Salvar', 'Save') : t('Criar', 'Create')}</button></div>
    </div></section>`
  }

  // ---------- a tela principal: o desafio de hoje, a carteirinha, os dias e as patentes ----------
  function painel(ui, r) {
    const [titulo, texto] = r.tipo ? TIPOS[r.tipo]() : ['', '']
    const hoje = !r.noPeriodo ? `<div class="panel ds-hoje"><span class="lbl">${t('O especial acabou', 'The special is over')}</span><h2>${t('Essa é sua patente final', 'This is your final rank')}</h2></div>`
      : r.feito ? `<div class="panel ds-hoje"><span class="lbl">${t(`Dia ${r.n} de ${M.TOTAL}`, `Day ${r.n} of ${M.TOTAL}`)}</span>
          <h2>${t('Feito por hoje!', 'Done for today!')}</h2><p class="ds-ganhou">+${r.feito.p + r.feito.b} ${t('pontos', 'points')}</p>
          <p>${t('Próximo desafio em', 'Next challenge in')} <b id="ds-prox"></b></p></div>`
        : `<div class="panel ds-hoje"><span class="lbl">${t(`Dia ${r.n} de ${M.TOTAL}`, `Day ${r.n} of ${M.TOTAL}`)} · ${t('desafio de hoje', 'today’s challenge')}</span>
          <h2>${titulo}</h2><p>${texto}</p>
          ${r.seq > 0 ? `<p class="note">${t(`Você está em ${r.seq} ${r.seq === 1 ? 'dia seguido' : 'dias seguidos'}: jogar hoje vale +${M.bonus(r.seq + 1)} de bônus.`, `You are on a ${r.seq}-day streak: playing today is worth +${M.bonus(r.seq + 1)} bonus.`)}</p>` : ''}
          <button class="btn big red" type="button" data-d="jogar">${r.andando ? t('Continuar', 'Continue') : t('Jogar', 'Play')}</button></div>`
    const cal = Array.from({ length: M.TOTAL }, (_, i) => {
      const d = M.dataDo(i)
      const cls = r.dias[d] ? 'feito' : i === r.n - 1 ? 'hoje' : i < r.n - 1 ? 'perdeu' : ''
      return `<i class="${cls}" title="${t('Dia', 'Day')} ${i + 1}">${i + 1}</i>`
    }).join('')
    const degraus = M.PATENTES.map(([p, pt, enn], i) => `<li class="${i === r.patente.i ? 'atual' : i < r.patente.i ? 'foi' : ''}"><span>${en() ? enn : pt}</span><b>${p}</b></li>`).join('')
    return `<section class="ds">
      <div class="ds-grid">
        ${hoje}
        <div class="panel ds-cartao"><canvas id="ds-canvas" width="1080" height="640" role="img" aria-label="${t('Sua carteirinha de agente', 'Your agent ID card')}"></canvas>
          <div class="online-row"><button class="btn" type="button" data-d="baixar">${t('Baixar carteirinha', 'Download ID card')}</button><button class="linkish" type="button" data-d="editar">${t('editar', 'edit')}</button></div></div>
        <div class="panel ds-dias"><h2>${t('Os dias', 'The days')}</h2><div class="ds-cal">${cal}</div></div>
        <div class="panel ds-patentes"><h2>${t('Patentes', 'Ranks')}</h2><ol>${degraus}</ol></div>
      </div>
    </section>`
  }

  // ---------- os desafios ----------
  const topo = (rot) => `<div class="imp-topo"><span class="hint">${rot}</span><button class="linkish" type="button" data-d="voltar">${t('voltar', 'back')}</button></div>`
  const aviso = (ui) => (ui.aviso ? `<p class="gd-aviso ${ui.avisoTipo || 'calmo'}" role="status">${esc(ui.aviso)}</p>` : '')

  function fimDoDia(ui, nd) {
    const r = ui.res
    if (!r) return ''
    return `<div class="panel ds-res"><span class="lbl">${t('Resultado de hoje', 'Today’s result')}</span>
      <p class="ds-ganhou">+${r.pontos} ${t('pontos', 'points')}</p>
      ${r.bonus ? `<p>+${r.bonus} ${t(`de bônus por ${r.seq} dias seguidos`, `bonus for a ${r.seq}-day streak`)}</p>` : ''}
      ${r.subiu ? `<p class="ds-subiu"><small>${t('Nova patente', 'New rank')}</small><b>${esc(nomePatente(r.patente))}</b></p>` : `<p>${t('Patente', 'Rank')}: <b>${esc(nomePatente(r.patente))}</b> · ${r.total} ${t('pontos', 'points')}</p>`}
      ${nd || ''}<button class="btn big" type="button" data-d="voltar">${t('Ver carteirinha', 'See ID card')}</button></div>`
  }

  function ficha(st, ui) {
    const d = M.desafio(st.i)
    const v = { fase: st.fim ? 'revela' : 'pista', versao: 'ambos', n: 0, total: 1, rotulo: TIPOS.ficha()[0], pista: st.pista, pistas: st.fim ? d.pistas : d.pistas.slice(0, st.pista + 1), revela: { key: d.key }, meu: { errados: st.errados } }
    const vale = Math.max(5, [100, 80, 60, 40, 25, 10][st.pista] - 5 * st.errados.length)
    const lado = st.fim ? fimDoDia(ui, st.acertou ? '' : `<p>${t('Dessa vez não deu.', 'Not this time.')}</p>`) : `<div class="panel aq-chute">
        <span class="lbl">${t('Quem é?', 'Who is it?')} · ${t(`vale ${vale}`, `worth ${vale}`)}</span>
        <p class="aq-atual">${AT().atual(v)}</p>
        <label class="gd-busca"><span class="sr-only">${t('Personagem', 'Character')}</span><input id="ds-busca" maxlength="30" autocomplete="off" autocapitalize="words" enterkeyhint="go" placeholder="${t('Comece a digitar um nome…', 'Start typing a name…')}" value="${esc(ui.busca)}"></label>
        <div class="gd-sugestoes" id="ds-sug">${AT().sugestoes(v, ui)}</div>
        <button class="btn paper" type="button" data-d="pula">${st.pista < 5 ? t('Passar pra próxima pista', 'Skip to the next clue') : t('Desistir', 'Give up')}</button></div>`
    return `<section class="aq-jogo">${topo(TIPOS.ficha()[0])}<div class="aq-palco">${AT().pasta(v, ui.entrou)}<aside class="aq-lado">${aviso(ui)}${lado}</aside></div></section>`
  }

  const texto = (id) => GD().textos(GD().porId[id], 'ambos')[en() ? 'en' : 'pt']
  function sugestoesGrade(st, ui) {
    if (!ui.busca.trim()) return `<p class="gd-vazio">${t('Os nomes aparecem aqui conforme você digita.', 'Names show up here as you type.')}</p>`
    const lista = GT().achar(ui.busca, 'ambos').slice(0, 6)
    if (!lista.length) return `<p class="gd-vazio">${t('Ninguém com esse nome na lista.', 'Nobody by that name on the list.')}</p>`
    return lista.map((k, i) => { const usado = st.casas.includes(k); return `<button class="gd-sug${usado ? ' usado' : ''}${i === 0 ? ' primeira' : ''}" type="button" data-d="grade-escolhe" data-v="${k}"${usado ? ' disabled' : ''}><span class="gd-mini">${capa(k)}</span><b>${esc(nome(k))}</b><small>${usado ? t('já foi usado', 'already used') : esc(ident(k))}</small></button>` }).join('')
  }
  function grade(st, ui) {
    const d = M.desafio(st.i)
    const cab = (id, lado) => `<div class="gd-cab ${lado}" title="${esc(texto(id)[1])}">${esc(texto(id)[0])}</div>`
    let h = `<div class="gd-canto"><b>${st.vidas}</b><small>${st.vidas === 1 ? t('vida', 'life') : t('vidas', 'lives')}</small></div>` + d.colunas.map((id) => cab(id, 'col')).join('')
    for (let r = 0; r < 3; r++) {
      h += cab(d.linhas[r], 'lin')
      for (let c = 0; c < 3; c++) {
        const i = r * 3 + c
        const k = st.casas[i]
        const cls = ['gd-casa', k ? 'cheia p2' : 'vazia', !k && !st.fim ? 'pode' : '', ui.casa === i ? 'escolhida' : ''].filter(Boolean).join(' ')
        h += `<button class="${cls}" type="button" data-d="casa" data-v="${i}"${st.fim || k ? ' disabled' : ''}>${k ? `<span class="gd-carta">${capa(k)}</span><span class="gd-fita">${esc(nome(k))}</span>` : !st.fim ? '<i class="gd-mais">+</i>' : ''}</button>`
      }
    }
    let lado = st.fim ? fimDoDia(ui) : `<p class="gd-aviso calmo">${t('Escolha uma casa.', 'Pick a square.')}</p>`
    if (!st.fim && ui.casa >= 0) {
      const l = d.linhas[Math.floor(ui.casa / 3)]
      const c = d.colunas[ui.casa % 3]
      lado = `<div class="gd-ficha-box panel"><div class="gd-regras"><span><b>${esc(texto(l)[0])}</b><small>${esc(texto(l)[1])}</small></span><i>×</i><span><b>${esc(texto(c)[0])}</b><small>${esc(texto(c)[1])}</small></span></div>
        <label class="gd-busca"><span class="sr-only">${t('Personagem', 'Character')}</span><input id="ds-busca" maxlength="30" autocomplete="off" autocapitalize="words" enterkeyhint="go" placeholder="${t('Comece a digitar um nome…', 'Start typing a name…')}" value="${esc(ui.busca)}"></label>
        <div class="gd-sugestoes" id="ds-sug">${sugestoesGrade(st, ui)}</div></div>`
    }
    return `<section class="gd-jogo">${topo(TIPOS.grade()[0])}<div class="gd-palco"><div class="gd-mesa panel"><div class="gd-tab c3" style="--c:3;--l:3">${h}</div></div>
      <aside class="gd-lado">${aviso(ui)}${lado}${!st.fim ? `<button class="btn paper" type="button" data-d="termina">${t('Terminar por aqui', 'Stop here')}</button>` : ''}</aside></div></section>`
  }

  function lab(st, ui) {
    const d = M.desafio(st.i)
    const n = st.heroi.filter(Boolean).length
    const v = { fase: 'montar', topicos: d.topicos, faltam: [], dur: 0, meu: { heroi: st.heroi, n, pers: st.fim ? null : d.baralho[n] } }
    const corpo = window.LabTelas.jogo(v, { novo: ui.novo, precisaPassar: false }).replace('data-l="sair"', 'data-d="voltar"').replace(/data-l="coloca"/g, 'data-d="coloca"')
    return `${corpo}${st.fim ? `<div class="ds-fim-lab">${fimDoDia(ui)}</div>` : ''}`
  }

  const desafio = (st, ui) => (st.tipo === 'ficha' ? ficha(st, ui) : st.tipo === 'grade' ? grade(st, ui) : lab(st, ui))

  window.DestinoTelas = { criar, painel, desafio, sugestoesFav, sugestoesGrade, nomePatente }
})()
