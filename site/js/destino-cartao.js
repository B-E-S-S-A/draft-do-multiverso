// A carteirinha de agente, desenhada numa imagem de verdade (é a mesma que a pessoa baixa pra postar).
// Dá pra personalizar: cor, codinome, lema, equipe, carimbo e o lado da foto.
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
  ]
  const EQUIPES = [
    { id: '', nome: ['Sem equipe', 'No team'] }, { id: 'vingadores', nome: ['Vingadores', 'Avengers'] }, { id: 'xmen', nome: ['X-Men', 'X-Men'] }, { id: 'quarteto', nome: ['Quarteto', 'Fantastic Four'] },
    { id: 'guardioes', nome: ['Guardiões', 'Guardians'] }, { id: 'defensores', nome: ['Defensores', 'Defenders'] }, { id: 'thunderbolts', nome: ['Thunderbolts', 'Thunderbolts'] },
  ]
  const CARIMBOS = [
    { id: 'doomsday', nome: ['Doomsday', 'Doomsday'], linhas: [['DOOMSDAY', '17.12.2026'], ['DOOMSDAY', '12.17.2026']] },
    { id: 'confidencial', nome: ['Confidencial', 'Classified'], linhas: [['CONFIDENCIAL'], ['CLASSIFIED']] },
    { id: 'ultra', nome: ['Ultra secreto', 'Top secret'], linhas: [['ULTRA', 'SECRETO'], ['TOP', 'SECRET']] },
    { id: 'nenhum', nome: ['Sem carimbo', 'No stamp'], linhas: [[], []] },
  ]
  // o que estiver guardado errado volta pro padrão
  function normaliza(c) {
    const x = c && typeof c === 'object' ? c : {}
    return { tema: TEMAS.some((y) => y.id === x.tema) ? x.tema : 'classico', codinome: String(x.codinome || '').slice(0, 20), lema: String(x.lema || '').slice(0, 44),
      equipe: EQUIPES.some((y) => y.id === x.equipe) ? x.equipe : '', carimbo: CARIMBOS.some((y) => y.id === x.carimbo) ? x.carimbo : 'doomsday', lado: x.lado === 'dir' ? 'dir' : 'esq' }
  }

  function fotoDe(key) {
    const i = E.D.hq.findIndex((h) => h.key === key)
    if (i < 0) return Promise.resolve(null)
    const m = V.cover(E.lotOf('hq:' + i)).match(/src="([^"]+)"/)
    if (!m) return Promise.resolve(null)
    return new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = m[1] })
  }
  // escreve e diminui a letra até caber
  function cabe(c, txt, x, y, largura, tam, fonte) {
    let s = tam
    do { c.font = `${s}px ${fonte}`; s -= 2 } while (c.measureText(txt).width > largura && s > 16)
    c.fillText(txt, x, y)
  }

  async function desenhar(cv, d) {
    const vez = (cv._vez = (cv._vez || 0) + 1) // desenhos pedidos em seguida: só o último vale
    try { await Promise.all(['90px "Jersey 10"', '20px Silkscreen', '26px "Pixelify Sans"'].map((f) => document.fonts.load(f))) } catch (e) {}
    const foto = await fotoDe(d.fav)
    if (cv._vez !== vez) return
    const cartao = normaliza(d.cartao)
    const T = TEMAS.find((x) => x.id === cartao.tema)
    const lang = window.Lingua.en() ? 1 : 0
    cv.width = L
    cv.height = A
    const c = cv.getContext('2d')
    const rotulo = (txt, x, y) => { c.fillStyle = T.fraco; c.font = `20px ${LABEL}`; c.fillText(txt.toUpperCase(), x, y) }
    c.imageSmoothingEnabled = false
    c.fillStyle = T.fundo
    c.fillRect(0, 0, L, A)
    // a faixa de cima, com a equipe (se tiver)
    c.fillStyle = T.faixa
    c.fillRect(0, 0, L, 92)
    c.textBaseline = 'alphabetic'
    c.fillStyle = T.faixaTxt
    c.font = `26px ${LABEL}`
    c.fillText(t('CARTEIRINHA DE AGENTE', 'AGENT ID CARD'), 44, 58)
    const equipe = EQUIPES.find((x) => x.id === cartao.equipe)
    c.fillStyle = T.faixaTxt2
    c.textAlign = 'right'
    c.font = `20px ${LABEL}`
    c.fillText((equipe.id ? equipe.nome[lang] : t('DIAS DE DESTINO', 'DAYS OF DOOM')).toUpperCase(), L - 44, 56)
    c.textAlign = 'left'
    // a foto: o personagem favorito, do lado escolhido
    const fl = 330, fa = 452, fy = 128
    const fx = cartao.lado === 'dir' ? L - 48 - fl - 10 : 48
    c.fillStyle = T.borda
    c.fillRect(fx + 10, fy + 10, fl, fa)
    c.fillStyle = '#e4e1d8'
    c.fillRect(fx, fy, fl, fa)
    if (foto) {
      const esc = Math.max(fl / foto.width, fa / foto.height)
      const sl = fl / esc, sa = fa / esc
      c.drawImage(foto, (foto.width - sl) / 2, 0, sl, sa, fx, fy, fl, fa)
    }
    c.strokeStyle = T.tinta
    c.lineWidth = 8
    c.strokeRect(fx, fy, fl, fa)
    // os dados
    const x = cartao.lado === 'dir' ? 48 : 424
    const largura = L - 424 - 48
    rotulo(t('Agente', 'Agent'), x, 140)
    c.fillStyle = T.tinta
    cabe(c, d.nome || t('Seu nome', 'Your name'), x, 212, largura, 84, DISPLAY)
    if (cartao.codinome) { c.fillStyle = T.destaque; cabe(c, cartao.codinome.toUpperCase(), x, 250, largura, 26, LABEL) }
    rotulo(t('Patente', 'Rank'), x, 298)
    c.fillStyle = T.destaque
    cabe(c, d.patente, x, 356, largura, 62, DISPLAY)
    const colunas = [[t('Pontos', 'Points'), String(d.pontos)], [t('Sequência', 'Streak'), String(d.seq)], [t('Dias', 'Days'), `${d.feitos}/${d.total}`]]
    colunas.forEach(([r, v], i) => {
      const cx = x + i * 202
      rotulo(r, cx, 402)
      c.fillStyle = T.tinta
      c.font = `58px ${DISPLAY}`
      c.fillText(v, cx, 452)
    })
    // quanto falta pra próxima patente
    c.fillStyle = T.trilho
    c.fillRect(x, 474, largura, 24)
    c.fillStyle = T.barra
    c.fillRect(x, 474, Math.round(largura * Math.min(1, d.progresso)), 24)
    c.strokeStyle = T.tinta
    c.lineWidth = 5
    c.strokeRect(x, 474, largura, 24)
    rotulo(d.falta, x, 532)
    if (cartao.lema) { c.fillStyle = T.tinta; cabe(c, `“${cartao.lema}”`, x, 578, largura, 30, CORPO) }
    // o carimbo, em cima da foto, pra nunca bater no nome
    const carimbo = CARIMBOS.find((y) => y.id === cartao.carimbo).linhas[lang]
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
      if (carimbo.length === 2) { c.fillText(carimbo[0], 0, -4); c.fillText(carimbo[1], 0, 18) } else c.fillText(carimbo[0], 0, 6)
      c.restore()
    }
    // a borda
    c.strokeStyle = T.borda
    c.lineWidth = 14
    c.strokeRect(7, 7, L - 14, A - 14)
  }

  function baixar(cv, nome) {
    const a = document.createElement('a')
    a.download = 'carteirinha-' + String(nome || 'agente').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png'
    a.href = cv.toDataURL('image/png')
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  window.DestinoCartao = { desenhar, baixar, normaliza, TEMAS, EQUIPES, CARIMBOS }
})()
