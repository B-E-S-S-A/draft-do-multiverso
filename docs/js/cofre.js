// O cofre: coisas escondidas que só abrem com código. O conteúdo vai trancado no site e o próprio código é a chave, então ele não fica escrito em lugar nenhum.
// O que a pessoa libera fica guardado só neste aparelho.
(function (raiz) {
  const CHAVE = 'mvd-cofre'
  const ARQUIVO = raiz.document.currentScript ? raiz.document.currentScript.src.replace('cofre.js', 'cofre-dados.js') : 'js/cofre-dados.js'
  const bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
  // tanto faz maiúscula, espaço ou traço na hora de digitar
  const limpa = (x) => String(x || '').normalize('NFD').replace(/[^a-z0-9]/gi, '').toLowerCase()
  const le = () => { try { const d = JSON.parse(localStorage.getItem(CHAVE) || '{}'); return d && typeof d === 'object' ? d : {} } catch (e) { return {} } }
  function grava(d) { try { localStorage.setItem(CHAVE, JSON.stringify(d)); return true } catch (e) { return false } }

  // o arquivo trancado só é baixado quando alguém tenta um código
  let pedido = null
  function carrega() {
    if (raiz.COFRE_DADOS) return Promise.resolve(raiz.COFRE_DADOS)
    if (!pedido) {
      pedido = new Promise((ok, nao) => {
        const s = raiz.document.createElement('script')
        s.src = ARQUIVO
        s.onload = () => ok(raiz.COFRE_DADOS)
        s.onerror = () => { pedido = null; nao(new Error('cofre')) }
        raiz.document.head.appendChild(s)
      })
    }
    return pedido
  }
  async function abre(item, codigo, iter) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(codigo), 'PBKDF2', false, ['deriveKey'])
    const chave = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(item.s), iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
    const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(item.i) }, chave, bytes(item.d))
    return JSON.parse(new TextDecoder().decode(claro))
  }
  // devolve o que o código abriu ('foto' ou 'ouro'), ou null se o código estiver errado
  async function tentar(texto) {
    const codigo = limpa(texto)
    if (codigo.length < 6) return null
    const dados = await carrega()
    for (const item of dados.itens) {
      let aberto = null
      try { aberto = await abre(item, codigo, dados.iter) } catch (e) { continue } // código de outra gaveta
      const d = le()
      d[aberto.tipo] = aberto.src || true
      return grava(d) ? aberto.tipo : null
    }
    return null
  }
  function foto() { const f = le().foto; return typeof f === 'string' && f.startsWith('data:image/') ? f : '' }

  raiz.Cofre = { tentar, foto, tem: (k) => !!le()[k] }
})(window)
