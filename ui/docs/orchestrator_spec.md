# Orchestrator 基本設計（LangGraph + LlamaIndex + FastAPI）

UI（`trait-flow-mvp2.0`）は既存の Vite/TS 構成を維持しつつ、以下の Python Orchestrator サービスを追加すると「ユーザー回答を蓄積しながら応答が変化する」MVP が最短で実現できる。

## 1. 結論・前提・コスト感
- **結論**: UI から `/api/*` を FastAPI 製 Orchestrator へ送信し、LangGraph で会話状態（短期/長期/方針）を管理。LlamaIndex + pgvector で RAG、Cohere Rerank v2 で候補を絞り、OpenAI Responses API（将来 Realtime も）で最終応答を生成する。  
- **前提**: `trait-flow-mvp2.0` は Cloud Run で静的配信。API は別ホストで CORS する。  
- **コスト**: DB = Cloud SQL for Postgres (pgvector)、推論コストは Responses + Rerank（候補数に比例）。Rerankでトークン消費を削減しつつ精度向上。

## 2. アーキテクチャ（最小）
```mermaid
flowchart LR
  subgraph FE["trait-flow-mvp2.0 (Vite/TS)"]
    U[User]
  end
  U -->|"/api/respond, /api/memory/update"| ORC["Orchestrator: FastAPI + LangGraph"]
  subgraph DB["Postgres + pgvector"]
    MEM["memories (KNN)"]
    UM["user_memory (long_term/policy)"]
  end
  ORC -->|KNN| MEM
  ORC -->|"long_term/方針更新"| UM
  ORC -->|Rerank| RR[Cohere Rerank v2]
  RR --> ORC --> LLM[OpenAI Responses / Realtime]
  ORC --> OBS[Logs / Metrics / Traces]
  ORC <-->|Webhook| N8N["n8n: CRM/通知/シート"]
```

### シーケンス（質問→応答）
```mermaid
sequenceDiagram
  participant FE as UI
  participant ORC as Orchestrator
  participant DB as Postgres/pgvector
  participant CO as Cohere Rerank
  participant OA as OpenAI Responses
  FE->>ORC: POST /api/respond {user_id, query}
  ORC->>DB: KNN(memories, top=200)
  DB-->>ORC: 候補
  ORC->>CO: rerank(query, docs=200)
  CO-->>ORC: 上位k=8
  ORC->>OA: Responses(system=個人化, context=top_k)
  OA-->>ORC: 応答
  ORC-->>FE: {answer, used_docs, stats}
```

## 3. コンポーネント
1. **Orchestrator (FastAPI + LangGraph)**  
   - `/api/memory/update`: ユーザー回答を保存→埋め込み→`memories` と `user_memory` を更新。  
   - `/api/respond`: KNN→Rerank→Responses で個人化応答。  
   - LangGraph の State/Edge で短期・長期・方針を持つ DAG を実装。  
2. **RAG (LlamaIndex サブフロー)**: pgvector の KNN 結果を整形。必要に応じ QueryTransform/Router を活用。  
3. **DB**: Cloud SQL for Postgres + pgvector。始めは Exact、後で HNSW/IVF に拡張。  
4. **Cohere Rerank v2**: 候補 30〜200 件から上位 k=8 を選別し、LLM トークンを節約。  
5. **OpenAI Responses / Realtime**: 応答生成、将来的な音声・低遅延拡張も視野に。  
6. **n8n**: Webhook ノードで CRM、通知、GSheet 連携をノーコード化。

## 4. データモデル（pgvector）
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE user_memory (
  user_id TEXT PRIMARY KEY,
  long_term VECTOR(3072),
  policy    VECTOR(128),
  last_updated TIMESTAMP DEFAULT now()
);

CREATE TABLE memories (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('short','long','note','trait')),
  embedding VECTOR(3072) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```
Exact 検索で運用開始 → レイテンシに応じて HNSW/IVFFlat へ移行。

## 5. API
| Endpoint | 入力 | 処理 |
| --- | --- | --- |
| `POST /api/memory/update` | `{user_id, text, kind}` | embed→`memories` へ INSERT、`user_memory` の long_term/policy を EMA 更新 |
| `POST /api/respond` | `{user_id, query}` | KNN(top=200)→Cohere Rerank(top=8)→個人化 system + Responses で応答 |

## 6. 実装骨子
`app/main.py`（FastAPI）で上記 API を公開。LangGraph の Graph API に `memory_update_node`・`retrieve_node`・`rerank_node`・`respond_node` を配置し、State に short_term/long_term/policy を保持。 `.env` 例:
```
OPENAI_API_KEY=sk-xxx
COHERE_API_KEY=xxx
PG_DSN=postgres://user:pass@host/db
EMBED_MODEL=text-embedding-3-large
RESP_MODEL=gpt-5
```

## 7. 非機能・監視
| 指標 | 目標 |
| --- | --- |
| P95 レイテンシ | ≤ 900 ms (KNN + Rerank + LLM) |
| エラー率 | < 1%（再試行・フォールバック） |
| 可用性 | 99.9%（Cloud Run / Cloud SQL） |

ログ・メトリクスは Orchestrator 内で区間計測し、n8n で CRM/通知フローを構築する。

## 8. デプロイ
1. Postgres (Cloud SQL) + pgvector を有効化。  
2. Orchestrator を Dockerize し Cloud Run へデプロイ。  
3. Vite UI は従来どおり静的配信（Cloud Run）で `/api/*` を Orchestrator に向ける。  
4. n8n は Webhook ノードで CRM/通知と連携。

## 9. リスク / 次アクション
- メモリ暴走 → EMA・クールダウン・負例重みで制御。  
- Rerank 遅延 → 候補数を制限し並列化。  
- API 変更 → OpenAI Responses / Realtime のアップデートを常時追従。

### 次アクション
1. pgvector テーブル作成・Exact KNN で運用開始。  
2. Orchestrator 実装 & Cloud Run デプロイ。  
3. UI から `/api/*` を差し替え、満足度評価 UI を追加。  
4. n8n Webhook で CRM/通知フローを構築。
