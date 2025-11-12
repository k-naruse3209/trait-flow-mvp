CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS user_memory (
  user_id TEXT PRIMARY KEY,
  long_term VECTOR(3072),
  policy    VECTOR(128),
  last_updated TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memories (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('short','long','note','trait')),
  embedding VECTOR(3072) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- ANN インデックスは必要になったら追加
-- CREATE INDEX memories_hnsw ON memories USING hnsw (embedding vector_l2_ops);
