// Dias de Destino: um desafio por dia até a estreia, igual pra todo mundo (sorteado pela data, sem servidor), e a patente na carteirinha.
// O dia vira à meia-noite de Brasília. Só regras aqui (dá pra testar no Node); o progresso fica guardado no aparelho.
(function (raiz) {
  const G = () => raiz.GradeDados
  const A = () => raiz.ArquivoMotor
  const GM = () => raiz.GradeMotor
  const LE = () => raiz.LabElenco
  const LM = () => raiz.LabMotor
  const INICIO = '2026-11-08'
  const FIM = '2026-12-17' // a estreia: último desafio
  const UM_DIA = 86400000
  const PT_FICHA = [100, 80, 60, 40, 25, 10]
  const PT_LAB = 50
  const VIDAS = 3
  const PATENTES = [[0, 'Recruta', 'Recruit'], [150, 'Agente', 'Agent'], [400, 'Agente Especial', 'Special Agent'], [800, 'Vingador', 'Avenger'], [1300, 'Vingador Veterano', 'Veteran Avenger'], [1900, 'Guardião do Multiverso', 'Multiverse Guardian'], [2600, 'Sobrevivente de Doomsday', 'Doomsday Survivor']]

  const diaDe = (ms = Date.now()) => new Date(ms - 3 * 3600000).toISOString().slice(0, 10)
  const numero = (dia) => Math.round((Date.parse(dia + 'T00:00:00Z') - Date.parse(INICIO + 'T00:00:00Z')) / UM_DIA)
  const dataDo = (i) => new Date(Date.parse(INICIO + 'T00:00:00Z') + i * UM_DIA).toISOString().slice(0, 10)
  const TOTAL = numero(FIM) + 1
  const noPeriodo = (dia) => numero(dia) >= 0 && numero(dia) < TOTAL
  const paraAmanha = (ms = Date.now()) => { const dia = diaDe(ms); return Date.parse(dia + 'T00:00:00-03:00') + UM_DIA - ms }

  // sorteio que dá sempre o mesmo resultado pra mesma data
  function semente(s) { let h = 1779033703; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) } return h >>> 0 }
  function aleatorio(a) { return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
  const embaralha = (a, rnd) => { const v = [...a]; for (let i = v.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [v[i], v[j]] = [v[j], v[i]] } return v }

  // os dias vão se alternando: ficha, grade, herói. O último, na estreia, é a ficha do Doutor Destino.
  const tipoDe = (i) => (i === TOTAL - 1 ? 'ficha' : ['ficha', 'grade', 'lab'][i % 3])
  let ordem = null
  // personagens de ficha: só os bem conhecidos, cada um uma vez no período (e só os de antes da terceira leva, pra agenda não mudar)
  function fichaDe(i) {
    if (i === TOTAL - 1) return 'doctor-doom'
    if (!ordem) ordem = embaralha(A().candidatos('ambos').filter((k) => k !== 'doctor-doom' && A().conhecido(k) && G().antigos.has(k)), aleatorio(semente('fichas-destino')))
    return ordem[Math.floor(i / 3) % ordem.length]
  }
  // o grid desse dia já estava no ar quando chegaram os temas novos: continua igual pra quem já jogou
  const ULTIMO_GRID_ANTIGO = 1
  const ULTIMO_LAB_ANTIGO = 2 // o herói do dia 10/11 já estava no ar quando chegaram os personagens novos
  const cache = {}
  function desafio(i) {
    if (cache[i]) return cache[i]
    const rnd = aleatorio(semente('destino-' + i))
    const tipo = tipoDe(i)
    if (tipo === 'ficha') { const key = fichaDe(i); cache[i] = { tipo, key, pistas: A().montarPistas(key, 'ambos', rnd) } }
    if (tipo === 'grade') cache[i] = { tipo, ...GM().sortearGrade(3, 3, rnd, { versao: 'ambos', nivel: 6, soAntigos: i <= ULTIMO_GRID_ANTIGO }) }
    if (tipo === 'lab') cache[i] = { tipo, baralho: embaralha(i <= ULTIMO_LAB_ANTIGO ? LE().antigas : LE().chaves, rnd).slice(0, LM().PADRAO.length), topicos: LM().PADRAO }
    return cache[i]
  }

  // ---------- o desafio em andamento ----------
  function novo(i) {
    const d = desafio(i)
    if (d.tipo === 'ficha') return { i, tipo: d.tipo, pista: 0, errados: [], fim: false, acertou: false }
    if (d.tipo === 'grade') return { i, tipo: d.tipo, casas: Array(9).fill(null), vidas: VIDAS, fim: false }
    return { i, tipo: d.tipo, heroi: Array(d.topicos.length).fill(null), fim: false }
  }
  const pontosFicha = (st) => (st.acertou ? Math.max(5, PT_FICHA[st.pista] - 5 * st.errados.length) : 0)
  function chutarFicha(st, key) {
    const d = desafio(st.i)
    if (st.fim || st.errados.includes(key)) return null
    if (key === d.key) { st.acertou = true; st.fim = true; return { ok: true } }
    st.errados.push(key)
    pularFicha(st)
    return { ok: false }
  }
  function pularFicha(st) { if (st.fim) return; if (st.pista >= PT_FICHA.length - 1) st.fim = true; else st.pista += 1 }

  const respostasDaCasa = (d, c) => GM().respostas(d.linhas[Math.floor(c / 3)], d.colunas[c % 3], 'ambos')
  function chutarGrade(st, c, key) {
    const d = desafio(st.i)
    if (st.fim || st.casas[c] || st.casas.includes(key)) return null
    if (respostasDaCasa(d, c).includes(key)) { st.casas[c] = key; if (st.casas.every(Boolean)) st.fim = true; return { ok: true } }
    st.vidas -= 1
    if (st.vidas <= 0) st.fim = true
    return { ok: false }
  }
  // cada casa vale 10; casa com pouca gente valendo vale 13; grid completo ganha mais 10
  function pontosGrade(st) {
    const d = desafio(st.i)
    const casas = st.casas.reduce((s, k, c) => s + (k ? (respostasDaCasa(d, c).length <= 4 ? 13 : 10) : 0), 0)
    return casas + (st.casas.every(Boolean) ? 10 : 0)
  }
  function colocarLab(st, t) {
    const d = desafio(st.i)
    const n = st.heroi.filter(Boolean).length
    if (st.fim || !Number.isInteger(t) || t < 0 || t >= st.heroi.length || st.heroi[t]) return null
    st.heroi[t] = d.baralho[n]
    if (n + 1 === st.heroi.length) st.fim = true
    return st.heroi[t]
  }
  const pontosDe = (st) => (st.tipo === 'ficha' ? pontosFicha(st) : st.tipo === 'grade' ? pontosGrade(st) : PT_LAB)

  // ---------- pontos, sequência e patente ----------
  function sequencia(dias, ate) { let n = 0; for (let i = numero(ate); i >= 0 && dias[dataDo(i)]; i--) n += 1; return n }
  const bonus = (seq) => Math.min(Math.max(seq - 1, 0), 6) * 5
  const total = (dias) => Object.values(dias).reduce((s, d) => s + d.p + d.b, 0)
  function patente(pts) {
    let i = 0
    while (i + 1 < PATENTES.length && pts >= PATENTES[i + 1][0]) i += 1
    return { i, pt: PATENTES[i][1], en: PATENTES[i][2], piso: PATENTES[i][0], proxima: PATENTES[i + 1] ? PATENTES[i + 1][0] : null }
  }
  // guarda o dia no histórico (uma vez só) e diz o que mudou
  function registrar(dias, dia, tipo, p) {
    if (dias[dia]) return null
    const antes = patente(total(dias))
    const seq = (dia && numero(dia) > 0 && dias[dataDo(numero(dia) - 1)] ? sequencia(dias, dataDo(numero(dia) - 1)) : 0) + 1
    dias[dia] = { t: tipo, p, b: bonus(seq) }
    const depois = patente(total(dias))
    return { pontos: p, bonus: bonus(seq), seq, total: total(dias), patente: depois, subiu: depois.i > antes.i }
  }

  raiz.DestinoMotor = { INICIO, FIM, TOTAL, VIDAS, PT_LAB, PATENTES, diaDe, numero, dataDo, noPeriodo, paraAmanha, tipoDe, desafio, novo, chutarFicha, pularFicha, pontosFicha, chutarGrade, respostasDaCasa, pontosGrade, colocarLab, pontosDe, sequencia, bonus, total, patente, registrar }
})(typeof window !== 'undefined' ? window : globalThis)
