// A carteirinha de agente, desenhada numa imagem de verdade (é a mesma que a pessoa baixa pra postar).
// Quase tudo nela dá pra personalizar: cores, textura, moldura, foto, parceiro, filtro, carimbo, selos, letra e o que aparece.
(function () {
  const V = window.View
  const E = window.Engine
  const t = (pt, en) => window.Lingua.t(pt, en)
  const L = 1080
  const A = 640
  const DISPLAY = '"Jersey 10", "Arial Narrow", Impact, sans-serif'
  const LABEL = 'Silkscreen, "Courier New", monospace'
  const CORPO = '"Pixelify Sans", "Trebuchet MS", sans-serif'

  const TEMAS = [
    { id: 'classico', nome: ['Clássico', 'Classic'], fundo: '#fffdf6', faixa: '#1d1b2c', faixaTxt: '#ffc83d', faixaTxt2: '#fffdf6', tinta: '#1d1b2c', fraco: '#4f5a6b', destaque: '#db3b2b', barra: '#23744f', trilho: '#e4e1d8', borda: '#1d1b2c' },
    { id: 'doom', nome: ['Destino', 'Doom'], fundo: '#173626', faixa: '#0d2016', faixaTxt: '#63d08d', faixaTxt2: '#d9d6cc', tinta: '#f1eee3', fraco: '#9fc7ad', destaque: '#ffc83d', barra: '#63d08d', trilho: '#0d2016', borda: '#0a140e' },
    { id: 'vingadores', nome: ['Vingadores', 'Avengers'], fundo: '#f6f1e6', faixa: '#b3261e', faixaTxt: '#ffffff', faixaTxt2: '#ffe3dd', tinta: '#1d1b2c', fraco: '#5a6275', destaque: '#2b62d9', barra: '#b3261e', trilho: '#e4dfd3', borda: '#1d1b2c' },
    { id: 'xmen', nome: ['X-Men', 'X-Men'], fundo: '#1d2a56', faixa: '#ffc83d', faixaTxt: '#1d1b2c', faixaTxt2: '#1d1b2c', tinta: '#ffffff', fraco: '#aab8dc', destaque: '#ffc83d', barra: '#ffc83d', trilho: '#131c3b', borda: '#0e1530' },
    { id: 'wakanda', nome: ['Wakanda', 'Wakanda'], fundo: '#1a1330', faixa: '#5b3bb5', faixaTxt: '#ffffff', faixaTxt2: '#e3d9ff', tinta: '#f2edff', fraco: '#b3a6d9', destaque: '#c9a6ff', barra: '#c9a6ff', trilho: '#100b20', borda: '#0c0818' },
    { id: 'cosmico', nome: ['Cósmico', 'Cosmic'], fundo: '#0b0a12', faixa: '#24508a', faixaTxt: '#7fe7ff', faixaTxt2: '#dff1ff', tinta: '#eef7ff', fraco: '#8ea9c4', destaque: '#7fe7ff', barra: '#7fe7ff', trilho: '#1c2a42', borda: '#24508a' },
    { id: 'aranha', nome: ['Aranha', 'Spider'], fundo: '#14213f', faixa: '#c8281e', faixaTxt: '#ffffff', faixaTxt2: '#ffd9d4', tinta: '#ffffff', fraco: '#9fb0d6', destaque: '#ff5a4d', barra: '#ff5a4d', trilho: '#0c1530', borda: '#0a1024' },
    { id: 'quarteto', nome: ['Quarteto', 'Fantastic'], fundo: '#eaf3fb', faixa: '#1f5fa8', faixaTxt: '#ffffff', faixaTxt2: '#d7e8fb', tinta: '#12233b', fraco: '#566b86', destaque: '#1f5fa8', barra: '#1f5fa8', trilho: '#cfdfee', borda: '#12233b' },
    { id: 'meu', nome: ['Minha cor', 'My color'], fundo: '#ffffff', faixa: '#888888', destaque: '#444444' },
  ]
  const EQUIPES = [
    { id: '', nome: ['Sem equipe', 'No team'] }, { id: 'vingadores', nome: ['Vingadores', 'Avengers'] }, { id: 'xmen', nome: ['X-Men', 'X-Men'] }, { id: 'quarteto', nome: ['Quarteto', 'Fantastic Four'] },
    { id: 'guardioes', nome: ['Guardiões', 'Guardians'] }, { id: 'defensores', nome: ['Defensores', 'Defenders'] }, { id: 'thunderbolts', nome: ['Thunderbolts', 'Thunderbolts'] },
    { id: 'illuminati', nome: ['Illuminati', 'Illuminati'] }, { id: 'latveria', nome: ['Latvéria', 'Latveria'] },
  ]
  const CARIMBOS = [
    { id: 'doomsday', nome: ['Doomsday', 'Doomsday'], linhas: [['DOOMSDAY', '17.12.2026'], ['DOOMSDAY', '12.17.2026']] },
    { id: 'confidencial', nome: ['Confidencial', 'Classified'], linhas: [['CONFIDENCIAL'], ['CLASSIFIED']] },
    { id: 'ultra', nome: ['Ultra secreto', 'Top secret'], linhas: [['ULTRA', 'SECRETO'], ['TOP', 'SECRET']] },
    { id: 'meu', nome: ['Escrever o meu', 'Write my own'], linhas: [[], []] },
    { id: 'nenhum', nome: ['Sem carimbo', 'No stamp'], linhas: [[], []] },
  ]
  const FILTROS = [{ id: 'normal', nome: ['Normal', 'Normal'] }, { id: 'pb', nome: ['Preto e branco', 'Black & white'] }, { id: 'sepia', nome: ['Sépia', 'Sepia'] }, { id: 'duo', nome: ['Duas cores', 'Duotone'] }, { id: 'negativo', nome: ['Negativo', 'Negative'] }]
  const MOLDURAS = [{ id: 'grossa', nome: ['Grossa', 'Thick'] }, { id: 'dupla', nome: ['Dupla', 'Double'] }, { id: 'tracejada', nome: ['Tracejada', 'Dashed'] }, { id: 'pixel', nome: ['Pixel', 'Pixel'] }, { id: 'nenhuma', nome: ['Sem moldura', 'None'] }]
  const TEXTURAS = [{ id: 'lisa', nome: ['Lisa', 'Plain'] }, { id: 'reticula', nome: ['Retícula', 'Halftone'] }, { id: 'listras', nome: ['Listras', 'Stripes'] }, { id: 'xadrez', nome: ['Xadrez', 'Checks'] }, { id: 'estrelas', nome: ['Estrelas', 'Stars'] }]
  const FONTES = [{ id: 'jersey', nome: ['Letreiro', 'Marquee'], f: DISPLAY, tam: 84 }, { id: 'pixelify', nome: ['Arredondada', 'Rounded'], f: CORPO, tam: 66 }, { id: 'silk', nome: ['Máquina', 'Typewriter'], f: LABEL, tam: 50 }]
  const ZOOMS = [{ id: '1', nome: ['Inteira', 'Full'] }, { id: '1.4', nome: ['Perto', 'Close'] }, { id: '1.9', nome: ['Bem perto', 'Very close'] }]
  const LADOS = [{ id: 'esq', nome: ['Na esquerda', 'On the left'] }, { id: 'dir', nome: ['Na direita', 'On the right'] }]
  const MOSTRAR = [{ id: 'pontos', nome: ['Pontos', 'Points'] }, { id: 'seq', nome: ['Sequência', 'Streak'] }, { id: 'dias', nome: ['Dias jogados', 'Days played'] }, { id: 'barra', nome: ['Barra de progresso', 'Progress bar'] }]
  // os selos, desenhados ponto a ponto (8×8)
  const SELOS = {
    estrela: '...XX...|...XX...|XXXXXXXX|.XXXXXX.|..XXXX..|.XXXXXX.|.XX..XX.|X......X',
    raio: '....XXX.|...XXX..|..XXX...|.XXXXXX.|...XXX..|..XXX...|.XXX....|.X......',
    caveira: '.XXXXXX.|XXXXXXXX|X..XX..X|X..XX..X|XXXXXXXX|.XX..XX.|.XXXXXX.|.X.XX.X.',
    escudo: 'XXXXXXXX|X.XXXX.X|XX.XX.XX|XXX..XXX|XXX..XXX|.XX..XX.|..XXXX..|...XX...',
    chama: '...X....|...XX...|..XXX.X.|.XXXXXX.|.XX.XXX.|XX...XXX|XX...XXX|.XXXXXX.',
    aranha: 'X..XX..X|.X.XX.X.|..XXXX..|XXXXXXXX|..XXXX..|.X.XX.X.|X..XX..X|...XX...',
    martelo: 'XXXXXXXX|XXXXXXXX|XXXXXXXX|...XX...|...XX...|...XX...|...XX...|...XX...',
    garras: 'X..X..X.|X..X..X.|X..X..X.|X..X..X.|.X..X..X|.X..X..X|..X..X..|..X..X..',
    coracao: '.XX..XX.|XXXXXXXX|XXXXXXXX|XXXXXXXX|.XXXXXX.|..XXXX..|...XX...|........',
    coroa: 'X..XX..X|XX.XX.XX|XXXXXXXX|XXXXXXXX|XXXXXXXX|X.X..X.X|XXXXXXXX|........',
    olho: '........|..XXXX..|.X....X.|X..XX..X|X..XX..X|.X....X.|..XXXX..|........',
    x: 'XX....XX|XXX..XXX|.XXXXXX.|..XXXX..|..XXXX..|.XXXXXX.|XXX..XXX|XX....XX',
  }
  const MAX_SELOS = 3
  const MAX_MEDALHAS = 4
  const cor = (x, padrao) => (/^#[0-9a-f]{6}$/i.test(String(x || '')) ? x : padrao)
  const naLista = (lista, v, padrao) => (lista.some((y) => y.id === v) ? v : padrao)
  // o que estiver guardado errado volta pro padrão
  function normaliza(c) {
    const x = c && typeof c === 'object' ? c : {}
    const m = x.mostra && typeof x.mostra === 'object' ? x.mostra : {}
    return { tema: naLista(TEMAS, x.tema, 'classico'), codinome: String(x.codinome || '').slice(0, 20), lema: String(x.lema || '').slice(0, 44), titulo: String(x.titulo || '').slice(0, 26),
      equipe: naLista(EQUIPES, x.equipe, ''), carimbo: naLista(CARIMBOS, x.carimbo, 'doomsday'), carimboTxt: String(x.carimboTxt || '').slice(0, 14), lado: naLista(LADOS, x.lado, 'esq'),
      filtro: naLista(FILTROS, x.filtro, 'normal'), moldura: naLista(MOLDURAS, x.moldura, 'grossa'), textura: naLista(TEXTURAS, x.textura, 'lisa'), fonte: naLista(FONTES, x.fonte, 'jersey'), zoom: naLista(ZOOMS, x.zoom, '1'),
      parceiro: String(x.parceiro || ''), medalhas: (Array.isArray(x.medalhas) ? x.medalhas : []).filter((s) => window.Conquistas.porId[s]).slice(0, MAX_MEDALHAS), flex: window.Conquistas.porId[x.flex] ? x.flex : '', selos: (Array.isArray(x.selos) ? x.selos : []).filter((s) => SELOS[s]).slice(0, MAX_SELOS),
      fundoCor: cor(x.fundoCor, '#fff4d6'), faixaCor: cor(x.faixaCor, '#7a1fa2'), destaqueCor: cor(x.destaqueCor, '#e0267a'),
      mostra: Object.fromEntries(MOSTRAR.map((y) => [y.id, m[y.id] !== false])) }
  }

  // ---------- cores ----------
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const claro = (h) => { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 }
  const mistura = (a, b, p) => { const x = rgb(a); const y = rgb(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * p).toString(16).padStart(2, '0')).join('') }
  const sobre = (h) => (claro(h) > 0.55 ? '#1d1b2c' : '#ffffff')
  function temaDe(c) {
    if (c.tema !== 'meu') return TEMAS.find((x) => x.id === c.tema)
    const tinta = sobre(c.fundoCor)
    return { fundo: c.fundoCor, faixa: c.faixaCor, faixaTxt: sobre(c.faixaCor), faixaTxt2: sobre(c.faixaCor), tinta, fraco: mistura(c.fundoCor, tinta, 0.62), destaque: c.destaqueCor, barra: c.destaqueCor, trilho: mistura(c.fundoCor, tinta, 0.16), borda: mistura(c.faixaCor, '#000000', 0.35) }
  }

  // ---------- foto ----------
  function fotoDe(key) {
    const i = E.D.hq.findIndex((h) => h.key === key)
    if (i < 0) return Promise.resolve(null)
    const m = V.cover(E.lotOf('hq:' + i)).match(/src="([^"]+)"/)
    if (!m) return Promise.resolve(null)
    return new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = m[1] })
  }
  function comFiltro(foto, filtro, T) {
    if (!foto || filtro === 'normal') return foto
    const o = document.createElement('canvas')
    o.width = foto.width
    o.height = foto.height
    const c = o.getContext('2d')
    c.drawImage(foto, 0, 0)
    const img = c.getImageData(0, 0, o.width, o.height)
    const d = img.data
    const [r0, g0, b0] = rgb(T.borda)
    const [r1, g1, b1] = rgb(T.destaque)
    for (let i = 0; i < d.length; i += 4) {
      const [r, g, b] = [d[i], d[i + 1], d[i + 2]]
      const l = 0.299 * r + 0.587 * g + 0.114 * b
      if (filtro === 'pb') { d[i] = l; d[i + 1] = l; d[i + 2] = l }
      if (filtro === 'sepia') { d[i] = Math.min(255, l * 1.15 + 20); d[i + 1] = Math.min(255, l * 0.95 + 10); d[i + 2] = l * 0.7 }
      if (filtro === 'negativo') { d[i] = 255 - r; d[i + 1] = 255 - g; d[i + 2] = 255 - b }
      if (filtro === 'duo') { const p = l / 255; d[i] = r0 + (r1 - r0) * p; d[i + 1] = g0 + (g1 - g0) * p; d[i + 2] = b0 + (b1 - b0) * p }
    }
    c.putImageData(img, 0, 0)
    return o
  }
  function colocaFoto(c, foto, x, y, l, a, zoom) {
    const esc = Math.max(l / foto.width, a / foto.height) * zoom
    const sl = l / esc, sa = a / esc
    c.drawImage(foto, (foto.width - sl) / 2, 0, sl, sa, x, y, l, a)
  }

  // escreve e diminui a letra até caber
  function cabe(c, txt, x, y, largura, tam, fonte) {
    let s = tam
    do { c.font = `${s}px ${fonte}`; s -= 2 } while (c.measureText(txt).width > largura && s > 16)
    c.fillText(txt, x, y)
  }
  function textura(c, tipo, T) {
    if (tipo === 'lisa') return
    c.save()
    c.beginPath()
    c.rect(0, 92, L, A - 92)
    c.clip()
    c.fillStyle = T.tinta
    if (tipo === 'reticula') { c.globalAlpha = 0.09; for (let y = 96, n = 0; y < A; y += 11, n++) for (let x = n % 2 ? 6 : 0; x < L; x += 12) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill() } }
    if (tipo === 'listras') { c.globalAlpha = 0.06; for (let x = -A; x < L; x += 48) { c.beginPath(); c.moveTo(x, A); c.lineTo(x + 24, A); c.lineTo(x + 24 + A, 0); c.lineTo(x + A, 0); c.fill() } }
    if (tipo === 'xadrez') { c.globalAlpha = 0.05; for (let y = 92, n = 0; y < A; y += 24, n++) for (let x = n % 2 ? 24 : 0; x < L; x += 48) c.fillRect(x, y, 24, 24) }
    if (tipo === 'estrelas') { c.globalAlpha = 0.5; let s = 12345; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 150; i++) { const k = r() < 0.2 ? 5 : 3; c.fillRect(Math.floor(r() * L), 92 + Math.floor(r() * (A - 92)), k, k) } }
    c.restore()
  }
  function moldura(c, tipo, T) {
    if (tipo === 'nenhuma') return
    c.strokeStyle = T.borda
    if (tipo === 'grossa') { c.lineWidth = 14; c.strokeRect(7, 7, L - 14, A - 14) }
    if (tipo === 'dupla') { c.lineWidth = 8; c.strokeRect(4, 4, L - 8, A - 8); c.lineWidth = 3; c.strokeRect(16, 16, L - 32, A - 32) }
    if (tipo === 'tracejada') { c.lineWidth = 10; c.setLineDash([26, 16]); c.strokeRect(5, 5, L - 10, A - 10); c.setLineDash([]) }
    if (tipo === 'pixel') {
      c.lineWidth = 12
      c.strokeRect(6, 6, L - 12, A - 12)
      c.fillStyle = T.fundo
      const p = 16
      for (const [x, y, sx, sy] of [[0, 0, 1, 1], [L, 0, -1, 1], [0, A, 1, -1], [L, A, -1, -1]]) {
        c.clearRect(sx > 0 ? x : x - p * 2, sy > 0 ? y : y - p, p * 2, p)
        c.clearRect(sx > 0 ? x : x - p, sy > 0 ? y : y - p * 2, p, p * 2)
        c.fillStyle = T.borda
        c.fillRect(sx > 0 ? x + p * 2 : x - p * 2 - 12, sy > 0 ? y : y - 12, 12, p + 12)
        c.fillRect(sx > 0 ? x : x - p - 12, sy > 0 ? y + p * 2 : y - p * 2 - 12, p + 12, 12)
        c.fillRect(sx > 0 ? x + p : x - p - 12, sy > 0 ? y + p : y - p - 12, p + 12, 12)
        c.fillRect(sx > 0 ? x + p : x - p - 12, sy > 0 ? y + p : y - p - 12, 12, p + 12)
      }
    }
  }
  function selo(c, nome, x, y, tam, corSelo) {
    const p = tam / 8
    c.fillStyle = corSelo
    SELOS[nome].split('|').forEach((linha, j) => { [...linha].forEach((v, i) => { if (v === 'X') c.fillRect(x + i * p, y + j * p, Math.ceil(p), Math.ceil(p)) }) })
  }
  // o selo como figurinha, pros botões da tela de editar
  const seloSvg = (nome) => `<svg viewBox="0 0 8 8" aria-hidden="true">${SELOS[nome].split('|').map((linha, j) => [...linha].map((v, i) => (v === 'X' ? `<rect x="${i}" y="${j}" width="1.02" height="1.02"/>` : '')).join('')).join('')}</svg>`

  async function desenhar(cv, d) {
    const vez = (cv._vez = (cv._vez || 0) + 1) // desenhos pedidos em seguida: só o último vale
    const cartao = normaliza(d.cartao)
    try { await Promise.all(['90px "Jersey 10"', '20px Silkscreen', '26px "Pixelify Sans"'].map((f) => document.fonts.load(f))) } catch (e) {}
    const [foto, parceiro] = await Promise.all([fotoDe(d.fav), cartao.parceiro ? fotoDe(cartao.parceiro) : null])
    if (cv._vez !== vez) return
    const T = temaDe(cartao)
    const lang = window.Lingua.en() ? 1 : 0
    cv.width = L
    cv.height = A
    const c = cv.getContext('2d')
    const rotulo = (txt, x, y) => { c.fillStyle = T.fraco; c.font = `20px ${LABEL}`; c.fillText(txt.toUpperCase(), x, y) }
    c.imageSmoothingEnabled = false
    c.fillStyle = T.fundo
    c.fillRect(0, 0, L, A)
    textura(c, cartao.textura, T)
    // a faixa de cima, com a equipe (se tiver)
    c.fillStyle = T.faixa
    c.fillRect(0, 0, L, 92)
    c.textBaseline = 'alphabetic'
    c.fillStyle = T.faixaTxt
    cabe(c, (cartao.titulo || t('Carteirinha de agente', 'Agent ID card')).toUpperCase(), 44, 58, 640, 26, LABEL)
    const equipe = EQUIPES.find((x) => x.id === cartao.equipe)
    c.fillStyle = T.faixaTxt2
    c.textAlign = 'right'
    c.font = `20px ${LABEL}`
    c.fillText((equipe.id ? equipe.nome[lang] : t('Dias de Destino', 'Days of Doom')).toUpperCase(), L - 44, 56)
    c.textAlign = 'left'
    // a foto: o personagem favorito, do lado escolhido
    const fl = 330, fa = 452, fy = 128
    const fx = cartao.lado === 'dir' ? L - 48 - fl - 10 : 48
    c.fillStyle = T.borda
    c.fillRect(fx + 10, fy + 10, fl, fa)
    c.fillStyle = '#e4e1d8'
    c.fillRect(fx, fy, fl, fa)
    if (foto) colocaFoto(c, comFiltro(foto, cartao.filtro, T), fx, fy, fl, fa, Number(cartao.zoom))
    c.strokeStyle = T.tinta
    c.lineWidth = 8
    c.strokeRect(fx, fy, fl, fa)
    // o parceiro, pequenininho no canto da foto
    if (parceiro) {
      const px = fx + 14, py = fy + fa - 152
      c.fillStyle = T.borda
      c.fillRect(px + 6, py + 6, 106, 138)
      colocaFoto(c, comFiltro(parceiro, cartao.filtro, T), px, py, 106, 138, 1)
      c.strokeStyle = T.tinta
      c.lineWidth = 6
      c.strokeRect(px, py, 106, 138)
    }
    // os dados
    const x = cartao.lado === 'dir' ? 48 : 424
    const largura = L - 424 - 48
    rotulo(t('Agente', 'Agent'), x, 140)
    // as conquistas coloridas e, depois delas, os selos livres
    const CQ = window.Conquistas
    let cx = x + largura - 48
    cartao.medalhas.filter(CQ.tem).forEach((id) => {
      const b = CQ.porId[id]
      c.fillStyle = CQ.RARIDADES[b.r].cor
      c.fillRect(cx, 106, 48, 48)
      c.strokeStyle = T.tinta
      c.lineWidth = 4
      c.strokeRect(cx, 106, 48, 48)
      selo(c, b.i, cx + 8, 114, 32, '#ffffff')
      cx -= 58
    })
    cartao.selos.forEach((s) => { selo(c, s, cx + 2, 110, 44, T.destaque); cx -= 54 })
    const fonte = FONTES.find((y) => y.id === cartao.fonte)
    c.fillStyle = T.tinta
    cabe(c, d.nome || t('Seu nome', 'Your name'), x, 212, largura, fonte.tam, fonte.f)
    if (cartao.codinome) { c.fillStyle = T.destaque; cabe(c, cartao.codinome.toUpperCase(), x, 250, largura, 26, LABEL) }
    rotulo(t('Patente', 'Rank'), x, 298)
    c.fillStyle = T.destaque
    cabe(c, d.patente, x, 356, largura, 62, DISPLAY)
    const colunas = [['pontos', t('Pontos', 'Points'), String(d.pontos)], ['seq', t('Sequência', 'Streak'), String(d.seq)], ['dias', t('Dias', 'Days'), `${d.feitos}/${d.total}`]].filter(([k]) => cartao.mostra[k])
    colunas.forEach(([, r, v], i) => {
      const cx = x + i * 202
      rotulo(r, cx, 402)
      c.fillStyle = T.tinta
      c.font = `58px ${DISPLAY}`
      c.fillText(v, cx, 452)
    })
    // quanto falta pra próxima patente
    if (cartao.mostra.barra) {
      c.fillStyle = T.trilho
      c.fillRect(x, 474, largura, 24)
      c.fillStyle = T.barra
      c.fillRect(x, 474, Math.round(largura * Math.min(1, d.progresso)), 24)
      c.strokeStyle = T.tinta
      c.lineWidth = 5
      c.strokeRect(x, 474, largura, 24)
      rotulo(d.falta, x, 532)
    }
    // o título em destaque, numa etiqueta da cor da raridade
    if (cartao.flex && CQ.tem(cartao.flex)) {
      const b = CQ.porId[cartao.flex]
      const nome = b.nome[lang].toUpperCase()
      c.font = `16px ${LABEL}`
      const l = Math.min(290, c.measureText(nome).width + 28)
      c.fillStyle = CQ.RARIDADES[b.r].cor
      c.fillRect(x + largura - l, 510, l, 34)
      c.fillStyle = '#ffffff'
      cabe(c, nome, x + largura - l + 14, 533, l - 28, 16, LABEL)
    }
    if (cartao.lema) { c.fillStyle = T.tinta; cabe(c, `“${cartao.lema}”`, x, 578, largura, 30, CORPO) }
    // o carimbo, em cima da foto, pra nunca bater no nome
    const carimbo = cartao.carimbo === 'meu' ? (cartao.carimboTxt ? [cartao.carimboTxt.toUpperCase()] : []) : CARIMBOS.find((y) => y.id === cartao.carimbo).linhas[lang]
    if (carimbo.length) {
      c.save()
      c.translate(fx + fl - 104, fy + fa - 46)
      c.rotate(-0.1)
      c.fillStyle = '#fffdf6'
      c.fillRect(-98, -30, 196, 60)
      c.strokeStyle = '#db3b2b'
      c.lineWidth = 5
      c.strokeRect(-98, -30, 196, 60)
      c.fillStyle = '#db3b2b'
      c.textAlign = 'center'
      c.font = `15px ${LABEL}`
      if (carimbo.length === 2) { c.fillText(carimbo[0], 0, -4); c.fillText(carimbo[1], 0, 18) } else cabe(c, carimbo[0], 0, 6, 176, 15, LABEL)
      c.restore()
    }
    moldura(c, cartao.moldura, T)
  }

  function baixar(cv, nome) {
    const a = document.createElement('a')
    a.download = 'carteirinha-' + String(nome || 'agente').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png'
    a.href = cv.toDataURL('image/png')
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  window.DestinoCartao = { desenhar, baixar, normaliza, seloSvg, TEMAS, EQUIPES, CARIMBOS, FILTROS, MOLDURAS, TEXTURAS, FONTES, ZOOMS, LADOS, MOSTRAR, SELOS, MAX_SELOS, MAX_MEDALHAS }
})()
