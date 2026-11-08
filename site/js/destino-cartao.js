// A carteirinha de agente, desenhada numa imagem de verdade (é a mesma que a pessoa baixa pra postar).
(function () {
  const V = window.View
  const E = window.Engine
  const t = (pt, en) => window.Lingua.t(pt, en)
  const L = 1080
  const A = 640
  const INK = '#1d1b2c'
  const PAPEL = '#fffdf6'
  const SOL = '#ffc83d'
  const VERMELHO = '#db3b2b'
  const VERDE = '#23744f'
  const DISPLAY = '"Jersey 10", "Arial Narrow", Impact, sans-serif'
  const LABEL = 'Silkscreen, "Courier New", monospace'

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
    do { c.font = `${s}px ${fonte}`; s -= 2 } while (c.measureText(txt).width > largura && s > 18)
    c.fillText(txt, x, y)
  }
  const rotulo = (c, txt, x, y) => { c.fillStyle = '#4f5a6b'; c.font = `20px ${LABEL}`; c.fillText(txt.toUpperCase(), x, y) }

  async function desenhar(cv, d) {
    try { await Promise.all([`90px "Jersey 10"`, '20px Silkscreen'].map((f) => document.fonts.load(f))) } catch (e) {}
    const foto = await fotoDe(d.fav)
    cv.width = L
    cv.height = A
    const c = cv.getContext('2d')
    c.imageSmoothingEnabled = false
    c.fillStyle = PAPEL
    c.fillRect(0, 0, L, A)
    // a faixa de cima
    c.fillStyle = INK
    c.fillRect(0, 0, L, 92)
    c.textBaseline = 'alphabetic'
    c.fillStyle = SOL
    c.font = `26px ${LABEL}`
    c.fillText(t('CARTEIRINHA DE AGENTE', 'AGENT ID CARD'), 44, 58)
    c.fillStyle = PAPEL
    c.textAlign = 'right'
    c.font = `20px ${LABEL}`
    c.fillText(t('DIAS DE DESTINO', 'DAYS OF DOOM'), L - 44, 56)
    c.textAlign = 'left'
    // a foto: o personagem favorito
    const fx = 48, fy = 128, fl = 330, fa = 452
    c.fillStyle = INK
    c.fillRect(fx + 10, fy + 10, fl, fa)
    c.fillStyle = '#e4e1d8'
    c.fillRect(fx, fy, fl, fa)
    if (foto) {
      const esc = Math.max(fl / foto.width, fa / foto.height)
      const sl = fl / esc, sa = fa / esc
      c.drawImage(foto, (foto.width - sl) / 2, 0, sl, sa, fx, fy, fl, fa)
    }
    c.strokeStyle = INK
    c.lineWidth = 8
    c.strokeRect(fx, fy, fl, fa)
    // os dados
    const x = 424, largura = L - x - 48
    rotulo(c, t('Agente', 'Agent'), x, 150)
    c.fillStyle = INK
    cabe(c, d.nome, x, 232, largura, 96, DISPLAY)
    rotulo(c, t('Patente', 'Rank'), x, 290)
    c.fillStyle = VERMELHO
    cabe(c, d.patente, x, 356, largura, 70, DISPLAY)
    const colunas = [[t('Pontos', 'Points'), String(d.pontos)], [t('Sequência', 'Streak'), String(d.seq)], [t('Dias', 'Days'), `${d.feitos}/${d.total}`]]
    colunas.forEach(([r, v], i) => {
      const cx = x + i * 202
      rotulo(c, r, cx, 416)
      c.fillStyle = INK
      c.font = `64px ${DISPLAY}`
      c.fillText(v, cx, 472)
    })
    // quanto falta pra próxima patente
    c.fillStyle = '#e4e1d8'
    c.fillRect(x, 508, largura, 26)
    c.fillStyle = VERDE
    c.fillRect(x, 508, Math.round(largura * d.progresso), 26)
    c.strokeStyle = INK
    c.lineWidth = 5
    c.strokeRect(x, 508, largura, 26)
    rotulo(c, d.falta, x, 570)
    // o carimbo
    c.save()
    c.translate(fx + fl - 96, fy + fa - 46) // em cima da foto, pra nunca bater no nome
    c.rotate(-0.1)
    c.fillStyle = PAPEL
    c.fillRect(-104, -30, 208, 60)
    c.strokeStyle = VERMELHO
    c.lineWidth = 5
    c.strokeRect(-104, -30, 208, 60)
    c.fillStyle = VERMELHO
    c.textAlign = 'center'
    c.font = `15px ${LABEL}`
    c.fillText('DOOMSDAY', 0, -4)
    c.fillText('17.12.2026', 0, 18)
    c.restore()
    // a borda
    c.strokeStyle = INK
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

  window.DestinoCartao = { desenhar, baixar }
})()
