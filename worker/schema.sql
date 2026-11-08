-- Banco do servidorzinho da banca: visitas por dia e por página, e as sugestões.
CREATE TABLE IF NOT EXISTS contagem (dia TEXT NOT NULL, pagina TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (dia, pagina));
CREATE TABLE IF NOT EXISTS sugestao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quando TEXT NOT NULL,
  tipo TEXT NOT NULL,
  pagina TEXT NOT NULL,
  texto TEXT NOT NULL,
  digest TEXT NOT NULL,
  quem TEXT NOT NULL,
  lida INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS sugestao_quem ON sugestao (quem, quando);
CREATE INDEX IF NOT EXISTS sugestao_digest ON sugestao (digest);
CREATE INDEX IF NOT EXISTS sugestao_quando ON sugestao (quando);
CREATE INDEX IF NOT EXISTS sugestao_lida ON sugestao (lida);
