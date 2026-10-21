// Sons de 8 bits feitos na hora (sem arquivos de áudio).
(function () {
  let ctx = null
  let on = true
  try { on = localStorage.getItem('mvd-sound') !== 'off' } catch (e) {}

  function audio() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext
      if (!C) return null
      ctx = new C()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  function tone(freq, dur, opts = {}) {
    const a = on && audio()
    if (!a) return
    const t = a.currentTime + (opts.when || 0)
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = opts.type || 'square'
    o.frequency.setValueAtTime(freq, t)
    if (opts.slide) o.frequency.linearRampToValueAtTime(freq + opts.slide, t + dur)
    g.gain.setValueAtTime(opts.vol || 0.05, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(a.destination)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  function thud() {
    const a = on && audio()
    if (!a) return
    const len = Math.floor(a.sampleRate * 0.14)
    const buf = a.createBuffer(1, len, a.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
    const s = a.createBufferSource()
    const f = a.createBiquadFilter()
    const g = a.createGain()
    f.type = 'lowpass'
    f.frequency.value = 900
    g.gain.value = 0.5
    s.buffer = buf
    s.connect(f).connect(g).connect(a.destination)
    s.start()
    tone(96, 0.2, { type: 'triangle', vol: 0.25, slide: -30 })
  }

  window.Sfx = {
    bid(p) {
      const base = p ? 659 : 523
      tone(base, 0.08)
      tone(base * 1.5, 0.09, { when: 0.07 })
    },
    tick() { tone(1175, 0.04, { vol: 0.03 }) },
    hammer() { thud() },
    sold() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { when: 0.12 + 0.08 * i, vol: 0.045 })) },
    draw() { [392, 523, 659].forEach((f, i) => tone(f, 0.07, { when: 0.05 * i, vol: 0.035 })) },
    undo() { tone(440, 0.1, { slide: -180, vol: 0.04 }) },
    win() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, { when: 0.1 * i, vol: 0.045 })) },
    get on() { return on },
    set on(v) {
      on = v
      try { localStorage.setItem('mvd-sound', v ? 'on' : 'off') } catch (e) {}
    },
  }
})()
