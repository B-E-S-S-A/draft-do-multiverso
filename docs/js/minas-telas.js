// Telas das Minas do Multiverso. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é minas.js.
(function () {
  const esc = window.View.esc
  const cor = (i) => `--cor: var(--c${i % 10})`
  const nome = (v, j) => (v.js[j] ? v.js[j].nome : '?')
  const coracoes = (n) => (n > 0 ? '♥'.repeat(n) : '☠')
  const relogio = () => '<span class="ap-relogio mn-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>'

  const COMO = `<ol class="how">
    <li>Sai um tema ("Inimigos do Homem-Aranha") e cada um <b>planta 2 minas</b> em segredo: digita dois nomes que valem.</li>
    <li>Dois fazem o <b>duelo</b>: cada um, na sua vez, fala um nome do tema em voz alta e toca FALEI.</li>
    <li>Todo mundo escuta. Falaram a sua mina? Toque <b>BOOM!</b>: quem falou perde uma vida e você ganha uma.</li>
    <li>Achou que o outro falou um nome que não vale? <b>DUVIDO!</b> Digita o nome e o celular confere. Quem errou perde vida.</li>
    <li>Travou (10 segundos sem falar)? Perde vida. Quem sai continua plantando minas. Último vivo ganha.</li>
  </ol>`

  function vidas(sel, pode) {
    return `<div class="field"><span class="lbl">Vidas</span><div class="presets">${[2, 3, 4].map((x) =>
      `<button class="preset" type="button" data-m="vidas" data-v="${x}" aria-pressed="${sel === x}"${pode ? '' : ' disabled'}>${coracoes(x)} ${x}</button>`).join('')}</div></div>`
  }

  // ---------- antes de jogar ----------
  function entrada(ui) {
    const nomes = Array.from({ length: ui.n }, (_, p) => `<label class="imp-nome" style="${cor(p)}"><span class="sr-only">Jogador ${p + 1}</span>
      <input id="mn-nome-${p}" maxlength="14" autocomplete="off" placeholder="Jogador ${p + 1}" value="${esc(ui.nomes[p] || '')}"></label>`).join('')
    return `<section class="setup mn">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>Num celular só</h2>
          <div class="field"><span class="lbl">Jogadores</span>
            <div class="stepper">
              <button class="btn paper step" type="button" data-m="n" data-v="-1" aria-label="Um a menos"${ui.n <= 2 ? ' disabled' : ''}>−</button>
              <b class="imp-n">${ui.n}</b>
              <button class="btn paper step" type="button" data-m="n" data-v="1" aria-label="Um a mais"${ui.n >= 7 ? ' disabled' : ''}>+</button>
            </div>
            <div class="imp-nomes">${nomes}</div>
          </div>
          ${vidas(ui.vidas, true)}
          <div class="go-row"><button class="linkish" type="button" data-m="bots">testar sozinho contra 3 bots</button>
            <button class="btn big" type="button" data-m="local">Começar</button></div>
        </div>
        <div class="ap-coluna">
          <div class="panel"><h2>Como jogar</h2>${COMO}</div>
          <div class="panel"><h2>Cada um no seu celular</h2>
            <label class="imp-meu-nome"><span class="lbl">Seu nome</span><input id="mn-meu" maxlength="14" autocomplete="off" value="${esc(ui.meuNome)}"></label>
            <div class="online-row"><button class="btn green" type="button" data-m="criar">Criar sala</button>
              <input id="mn-codigo" maxlength="4" autocomplete="off" placeholder="CÓDIGO" value="${esc(ui.codigo)}">
              <button class="btn paper" type="button" data-m="entrar">Entrar</button></div>
            ${ui.erro ? `<p class="neterr" role="alert">${esc(ui.erro)}</p>` : ''}${ui.status ? `<p class="note" role="status">${esc(ui.status)}</p>` : ''}
          </div>
        </div>
      </div>
    </section>`
  }

  function sala(v, ui) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup mn">
      <div class="imp-topo"><span class="hint">Sala ${esc(v.code)} · ${n} no campo</span><button class="linkish" type="button" data-m="sair">${v.dono ? 'Fechar sala' : 'Sair da sala'}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? 'Regras' : 'Regras da sala'}</h2>${vidas(v.vidas, v.dono)}${COMO}</div>
        <div class="panel"><h2>Sala ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-m="convite">Copiar convite</button>
            <button class="btn paper" type="button" data-m="poe-bot"${v.pessoas.length >= 7 ? ' disabled' : ''}>+ bot</button></div><p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <ol class="imp-sala">${v.pessoas.map((p, i) => `<li style="${cor(i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}</span>
            <small>${[p.voce ? 'você' : '', p.dono ? 'criou' : '', p.bot ? 'bot' : ''].filter(Boolean).join(' · ')}</small>
            ${v.dono && p.bot ? `<button class="linkish" type="button" data-m="tira-bot" data-v="${i}">tirar</button>` : ''}</li>`).join('')}</ol>
        </div>
      </div>
      <div class="go-row">${v.dono ? `${n < 2 ? '<span class="lbl">Falta gente (ou um bot)</span>' : ''}<button class="btn big" type="button" data-m="comecar"${n < 2 ? ' disabled' : ''}>Começar</button>`
        : '<p class="hint">Esperando quem criou a sala começar…</p>'}</div>
    </section>`
  }

  // ---------- jogo ----------
  function placar(v) {
    return `<div class="mn-placar">${v.js.map((p, i) => `<span class="${p.vidas <= 0 ? 'fora' : ''}${v.par.includes(i) && v.fase === 'duelo' ? ' duela' : ''}" style="${cor(i)}">${esc(p.nome)} <b>${coracoes(p.vidas)}</b></span>`).join('')}
      ${v.dobro ? '<small class="mn-dobro">cada erro tira 2</small>' : ''}</div>`
  }

  function tema(v) {
    return `<div class="mn-tema"><span class="mn-faixa" aria-hidden="true"></span><span class="ap-rodada">duelo ${v.rodada}</span><h2>${esc(v.tema.titulo)}</h2></div>`
  }

  // plantio: num celular só o aparelho passa de mão em mão; online cada um planta no seu
  function plantar(v, ui) {
    const feitos = v.js.map((p, i) => `<span class="${p.plantou ? 'ok' : ''}" style="${cor(i)}">${esc(p.nome)} ${p.plantou ? '💣💣' : '…'}</span>`).join('')
    let meio
    const quem = ui.local ? v.plantando : v.eu
    if (quem < 0 || quem === undefined) meio = '<p class="hint">Esperando…</p>'
    else if (ui.local && ui.vendo !== quem) {
      meio = `<div class="mn-passa" style="${cor(quem)}"><span class="lbl">passa o celular</span><h3>${esc(nome(v, quem))}, sua vez de plantar</h3>
        <p>Os outros não olham!</p><button class="btn big" type="button" data-m="ver" data-v="${quem}">Sou eu</button></div>`
    } else {
      const minhas = (ui.local ? v.todas && v.todas[quem] : v.minhas) || []
      meio = minhas.length >= 2
        ? `<div class="mn-plantio" style="${cor(quem)}"><span class="lbl">suas minas</span><div class="mn-minas">${minhas.map((m) => `<span>💣 ${esc(m.n)}</span>`).join('')}</div>
            ${ui.local ? '<button class="btn big" type="button" data-m="esconder">Pronto, esconde e passa</button>' : '<p class="hint">Esperando os outros plantarem…</p>'}</div>`
        : `<div class="mn-plantio" style="${cor(quem)}"><span class="lbl">${esc(nome(v, quem))}: plante a mina ${minhas.length + 1} de 2</span>
            <p class="note">Digite um nome que vale pra <b>${esc(v.tema.titulo)}</b>. Dica: mine o que os outros vão falar.</p>
            ${minhas.length ? `<div class="mn-minas">${minhas.map((m) => `<span>💣 ${esc(m.n)}</span>`).join('')}</div>` : ''}
            <div class="online-row mn-campo"><input id="mn-mina" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="go" value="${esc(ui.mina || '')}">
              <button class="btn red" type="button" data-m="plantar">Plantar</button></div>
            ${ui.aviso ? `<p class="neterr" role="alert">${esc(ui.aviso)}</p>` : ''}</div>`
    }
    return `${meio}<div class="mn-feitos">${feitos}</div>${!ui.local && v.dur ? `<div class="mn-vez">${relogio()}</div>` : ''}`
  }

  function duelo(v, ui) {
    const [a, b] = v.par
    const fala = v.falando
    const ult = v.ultimo
    const falas = v.falas.map((f) => `<span style="${cor(f.j)}">${f.nome ? esc(f.nome) : '🗣'}</span>`).join('')
    const souFala = ui.local ? !v.js[fala].bot : v.eu === fala
    const posso = (j) => ui.local || v.eu === j
    // BOOM: no próprio celular aparecem as suas minas; num celular só, escolhe o dono e depois a mina
    let boom = ''
    if (ult) {
      if (!ui.local && v.minhas && v.eu !== ult.j) {
        const vivas = v.minhas.map((m, k) => ({ ...m, k })).filter((m) => !m.explodiu)
        if (vivas.length) boom = `<div class="mn-boom-row">${vivas.map((m) => `<button class="btn red mn-boom" type="button" data-m="boom" data-v="${m.k}" data-dono="${v.eu}">BOOM! <small>${esc(m.n)}</small></button>`).join('')}</div>`
      }
      if (ui.local) boom = ui.boomDono === undefined
        ? `<button class="btn red mn-boom grande" type="button" data-m="boom-abre">BOOM! <small>falaram a minha mina</small></button>`
        : boomLocal(v, ui)
    }
    const outro = ult ? (ult.j === a ? b : a) : -1
    const duvida = ult && posso(outro) && !v.js[outro].bot
      ? (ui.digitando
        ? `<div class="ap-juiz ap-duvido"><label class="ap-digita"><span class="lbl">${esc(nome(v, outro))}: digite o nome que ${esc(nome(v, ult.j))} falou</span>
            <input id="mn-duvida" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="go" value="${esc(ui.duvida || '')}"></label>
            <div class="ap-juiz-btns"><button class="btn paper" type="button" data-m="fecha-duvida">cancelar</button><button class="btn red" type="button" data-m="duvidar">Conferir</button></div></div>`
        : `<button class="btn paper mn-duvido" type="button" data-m="abre-duvida">${ui.local ? esc(nome(v, outro)) + ': ' : ''}DUVIDO do último nome</button>`)
      : ''
    return `<div class="mn-arena">
        <span class="mn-lado${fala === a ? ' vez' : ''}" style="${cor(a)}">${esc(nome(v, a))}<b>${coracoes(v.js[a].vidas)}</b></span>
        <i>⚔</i>
        <span class="mn-lado${fala === b ? ' vez' : ''}" style="${cor(b)}">${esc(nome(v, b))}<b>${coracoes(v.js[b].vidas)}</b></span>
      </div>
      <div class="mn-vez" style="${cor(fala)}"><span class="lbl">vez de ${esc(nome(v, fala))}</span>${relogio()}</div>
      ${souFala ? `<button class="btn big mn-falei" type="button" data-m="falei">FALEI! <small>${ui.local ? esc(nome(v, fala)) + ' fala um nome e toca' : 'fale um nome e toque'}</small></button>` : ''}
      ${ult && ult.nome ? `<p class="mn-ultimo" style="${cor(ult.j)}">${esc(nome(v, ult.j))} falou: <b>${esc(ult.nome)}</b></p>` : ''}
      <div class="mn-falas">${falas || '<small>ninguém falou ainda</small>'}</div>
      ${boom}${duvida}
      ${!ui.local && v.minhas ? `<p class="mn-suas">suas minas: ${v.minhas.map((m) => `<span class="${m.explodiu ? 'foi' : ''}">💣 ${esc(m.n)}</span>`).join(' ')}</p>` : ''}`
  }

  function boomLocal(v, ui) {
    const ult = v.ultimo
    if (ui.boomDono === null) {
      const donos = v.js.map((p, i) => i).filter((i) => i !== ult.j && (v.todas[i] || []).some((m) => !m.explodiu))
      return `<div class="ap-juiz mn-boom-escolhe"><span class="lbl">de quem é a mina que ${esc(nome(v, ult.j))} falou?</span>
        <div class="bo-escolhe">${donos.map((i) => `<button class="preset" type="button" data-m="boom-dono" data-v="${i}" style="${cor(i)}">${esc(nome(v, i))}</button>`).join('')}</div>
        <button class="linkish" type="button" data-m="boom-fecha">cancelar</button></div>`
    }
    const minas = (v.todas[ui.boomDono] || []).map((m, k) => ({ ...m, k })).filter((m) => !m.explodiu)
    return `<div class="ap-juiz mn-boom-escolhe"><span class="lbl">${esc(nome(v, ui.boomDono))}, qual mina explodiu?</span>
      <div class="mn-boom-row">${minas.map((m) => `<button class="btn red mn-boom" type="button" data-m="boom" data-v="${m.k}" data-dono="${ui.boomDono}">BOOM! <small>${esc(m.n)}</small></button>`).join('')}</div>
      <button class="linkish" type="button" data-m="boom-fecha">não era (cancelar)</button></div>`
  }

  function evento(v) {
    const e = v.evento
    const perdeu = `${esc(nome(v, e.vitima))} perde ${e.dobro ? '2 vidas' : '1 vida'}`
    if (e.tipo === 'boom') return `<div class="mn-evento boom"><b class="mn-bum">BOOM!</b><p><b>${esc(e.mina)}</b> era mina de ${esc(nome(v, e.dono))}.</p><p>${perdeu}. ${esc(nome(v, e.dono))} ganha 1.</p></div>`
    if (e.tipo === 'duvido') return `<div class="mn-evento ${e.vale ? 'vale' : 'boom'}"><b class="mn-bum">${e.vale ? 'VALE!' : 'NÃO VALE!'}</b>
      <p>${esc(nome(v, e.quem))} duvidou de "${esc(e.texto)}"${e.vale ? ` (era ${esc(e.nome)})` : ''}.</p><p>${perdeu}.</p></div>`
    return `<div class="mn-evento boom"><b class="mn-bum">TRAVOU!</b><p>${esc(nome(v, e.vitima))} ficou 10 segundos sem falar. ${perdeu}.</p></div>`
  }

  function campo(v) {
    return `<div class="mn-campo-revelado"><span class="lbl">as minas do campo</span>${v.evento.minas.map((r) => `<p style="${cor(r.j)}"><b>${esc(nome(v, r.j))}</b> ${r.minas.map((m) => `<span class="${m.explodiu ? 'foi' : ''}">💣 ${esc(m.n)}</span>`).join('')}</p>`).join('')}</div>`
  }

  function resultado(v, ui) {
    return `${evento(v)}${campo(v)}
      ${ui.podeSeguir ? '<button class="btn big" type="button" data-m="proxima">Próximo duelo</button>' : '<p class="hint">O próximo duelo já vai começar…</p>'}`
  }

  // uma vez por jogo, quando alguém ia sair: Aquele Acima de Todos
  function toaa(v, ui) {
    const j = v.evento.toaa
    return `${evento(v)}
      <div class="mn-toaa" role="dialog" aria-label="Aquele Acima de Todos"><div class="mn-krackle" aria-hidden="true"></div>
        <div class="mn-toaa-txt">
          <span class="lbl">o multiverso parou</span>
          <h2>AQUELE ACIMA DE TODOS</h2>
          <p class="mn-fala">"Ninguém fica de fora da minha história."</p>
          <p><b style="${cor(j)}">${esc(nome(v, j))}</b> volta com 1 vida.</p>
          <p class="mn-regra">Mas a partir de agora, <b>cada erro tira 2 vidas</b>.</p>
          ${ui.podeSeguir ? '<button class="btn big" type="button" data-m="proxima">Continuar</button>' : ''}
        </div></div>`
  }

  function jogo(v, ui) {
    const meio = v.fase === 'plantar' ? plantar(v, ui) : v.fase === 'duelo' ? duelo(v, ui) : v.fase === 'toaa' ? toaa(v, ui) : resultado(v, ui)
    return `<section class="mn-jogo fase-${v.fase}">
      <div class="imp-topo">${placar(v)}<button class="linkish" type="button" data-m="sair">sair</button></div>
      ${tema(v)}
      ${meio}
      ${ui.estouro ? `<div class="mn-explode" aria-hidden="true"><b>${esc(ui.estouro)}</b></div>` : ''}
    </section>`
  }

  function fim(v, ui) {
    const vivo = v.js.findIndex((p) => p.vidas > 0)
    const ordem = v.js.map((p, i) => i).sort((a, b) => (v.js[b].vidas > 0) - (v.js[a].vidas > 0) || v.js[b].boomsDados - v.js[a].boomsDados)
    return `<section class="ap-fimtela"><div class="panel ap-fim" style="${cor(vivo)}">
      <span class="lbl">fim do campo minado</span><h2>${esc(nome(v, vivo))} sobreviveu!</h2>
      <ol class="ap-rank">${ordem.map((i) => { const p = v.js[i]; return `<li style="${cor(i)}"><span>${esc(p.nome)} <small>${p.boomsDados} BOOM${p.boomsDados === 1 ? '' : 's'} dado${p.boomsDados === 1 ? '' : 's'}</small></span><b>${coracoes(p.vidas)}</b></li>` }).join('')}</ol>
      <div class="online-row">${ui.podeSeguir ? '<button class="btn big" type="button" data-m="denovo">Jogar de novo</button>' : ''}<button class="linkish" type="button" data-m="sair">sair</button></div>
    </div></section>`
  }

  window.MinasTelas = { entrada, sala, jogo, fim }
})()
