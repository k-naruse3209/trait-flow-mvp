# AI コーチングメッセージ設計書（Mood/Energy/Note 分析）

## 1. 目的
- `trait-flow-mvp-main/trait-flow-mvp-trait-flow` で取得している **気分 (mood)**、**エネルギー (energy)**、**メモ (free_text)** を AI が解析し、利用者の状態を好転させる短いコーチングメッセージを自動生成する。
- 生成されたメッセージを `trait-flow-mvp3.0` のモバイル UI で即時提示し、`interventions` として履歴管理する。

## 2. 参照元と前提
- 既存の Next.js 実装 (`trait-flow-mvp-trait-flow`) では Supabase 上に `checkins`・`interventions` テーブル、Edge Function `tipi-submit` などが整備済み。
- `trait-flow-mvp3.0` は Vite + React Router の SPA。README で `/api/memory/update` `/api/respond`（Orchestrator FastAPI）との連携方針が定義されている。
- 本設計では Supabase を単一データソースとし、Orchestrator (FastAPI + LangGraph) がメッセージ生成を担う。UI は BFF 経由でやり取りする。

## 3. ユースケース
1. ユーザーが日次チェックイン（ムード 1-5、エネルギー low/mid/high、メモ任意）を送信。
2. 送信直後に Orchestrator が内容を解析し、気分/エネルギーを高める行動提案や自己理解を促すメッセージを生成。
3. 生成メッセージは Supabase `interventions` に保存され、UI 上にカード表示。ユーザーが評価・リアクションを返す。
4. メッセージと評価は LangGraph の長期メモリ（`/api/memory/update`）にも反映され、次回以降のアドバイス改善に活用。

## 4. システム構成
- **クライアント (trait-flow-mvp3.0)**: Supabase Auth (PKCE) でログイン → `/api/checkins` BFF を呼び出しチェックインを作成 → レスポンスの `intervention_id` で新規メッセージを取得。
- **BFF (Next.js or Supabase Edge Function)**: チェックイン保存、Orchestrator 呼び出し、`behavior_events` ログ記録を担当。
- **Orchestrator (FastAPI + LangGraph)**: `/api/respond` にて LLM (OpenAI Responses 等) へプロンプト送信し、コーチングメッセージ JSON を返却。Cohere Rerank, LlamaIndex, pgvector を組み合わせ個人化。
- **データストア (Supabase Postgres)**: `checkins`, `interventions`, `baseline_traits`, `behavior_events`。

## 5. データフロー詳細
1. **チェックイン送信**
   - `POST /api/checkins`（BFF）に `{ mood_score, energy_level, free_text }` を送る。
   - BFF は Supabase Service Role で `checkins` に INSERT。レスポンスには `checkin_id` を含める。
2. **アナリティクス計算**
   - BFF で `hooks/useMoodAnalytics.ts` 相当のロジックを実行し、直近 7 件の平均・トレンドを算出。`intervention_jobs` キューへ payload を enqueue。
3. **Orchestrator 呼び出し**
   - Worker がジョブを受け取り `/api/respond` に下記 payload を送信：
     ```json
     {
       "user_id": "uuid",
       "latest_checkin": {
         "mood_score": 2,
         "energy_level": "low",
         "note": "朝から頭痛がして集中できない"
       },
       "analytics": {
         "average_mood": 3.1,
         "trend": "declining",
         "streak_days": 4
       },
       "personality": { "agreeableness": 0.65, ... },
       "history_refs": ["checkin:...", "intervention:..."]
     }
     ```
4. **LLM プロンプト**
   - LangGraph ノードで以下を組み立てる：
     - `system`: 「あなたは Trait Flow のウェルビーイングコーチ。回答は 280 文字以内、日本語、ポジティブだが現実的に。」
     - `user`: 気分/エネルギー/メモ、最近の傾向、Big Five 特性の要約。
     - `tools`: RAG から得た過去の成功介入や行動タグ。
5. **レスポンス検証**
   - Orchestrator で JSON Schema を強制。
   - 例:
     ```json
     {
       "title": "エネルギーを回復する小休憩",
       "body": "集中が切れているときは...",
       "cta": "5分間の呼吸練習をしてから一番軽いタスクに着手" ,
       "tone": "calm_encouraging"
     }
     ```
   - ガードレール（不適切表現チェック）を通し、Fallback 生成に切り替える条件を明示。
6. **永続化 & 配信**
   - Worker が `interventions` に INSERT (`template_type`, `message_payload`, `fallback` フラグ)。
   - `behavior_events`・`audit_log` にも記録。
   - Webhook で n8n/Slack 通知を送る（任意）。
7. **UI 表示**
   - `trait-flow-mvp3.0` は Supabase Realtime or ポーリングで `interventions` の最新行を取得し、メッセージカードとして表示。
   - ユーザーの評価 (`feedback_score`) を送信し、次回 `/api/memory/update` で LangGraph へ反映。

## 6. API・契約
| エンドポイント | 役割 | 入力 | 出力 |
| --- | --- | --- | --- |
| `POST /api/checkins` (BFF) | チェックイン作成 + ジョブ投入 | `{ mood_score, energy_level, free_text }` | `{ checkin_id, intervention_status }` |
| `POST /api/interventions/:checkin_id/generate` | 手動再生成 | `{} (JWT)` | `{ intervention_id }` |
| `POST /api/orchestrator/memory-update` | LangGraph メモリ同期 | `MemoryUpdatePayload` | `{ status }` |
| `POST /api/orchestrator/respond` | Orchestrator プロキシ | `RespondPayload` | `RespondResponse` |

※ BFF は Next.js Route Handler で実装し、Supabase サービスロール鍵と Orchestrator API Key をサーバー側に隔離。

## 7. プロンプト設計の指針
- **入力情報**: ユーザーの Big Five 上位特性、最新チェックイン、直近 7 日の平均気分、今朝の streak、過去に高評価だった介入の要約。
- **出力フォーマット**: JSON Schema (`title`, `body`, `cta`, `tone_tag`, `emotion_keywords`, `references`).
- **スタイル**:
  - 280 文字以内。
  - 気分スコアが低い場合は共感 + 小さな行動提案。
  - 高い場合は維持とチャレンジの両面を提示。
  - エネルギー `low` なら休息/グラウンディング、`high` なら達成行動を推奨。
- **安全性**: 禁止ワードリスト、医療行為の断定禁止、緊急時の連絡先案内テンプレートを追加。

## 8. モニタリング & 評価
- `interventions` に `feedback_score`, `viewed_at`, `cta_completed` を追加し、生成メッセージの有効性を追跡。
- Orchestrator 側で `latency_ms`, `llm_tokens`, `fallback_used` を CloudWatch / Supabase Logs に送信。
- 週次で `feedback_score >=4` 割合を KPI として可視化。

## 9. 実装ステップ
1. Supabase に `intervention_jobs` + `cta_completed` カラムを追加するマイグレーションを作成。
2. Next.js BFF (`trait-flow-screen` 側) に `/api/checkins`, `/api/interventions`, `/api/orchestrator/*` ルートを整備し、Vite から利用できる SDK を提供。
3. `trait-flow-mvp3.0` でチェックインフォーム → Supabase 呼び出しを実装し、レスポンスに応じて生成中インジケータを表示。
4. FastAPI Orchestrator で LangGraph ワークフローを構築し、プロンプト/Guardrail を実装。
5. Realtime or ポーリングで `interventions` を監視し、UI に最新カードを表示。フィードバック送信も接続。
6. n8n / Slack 通知やメトリクス収集を追加し、試験運用を開始。

---
この設計をベースに `trait-flow-mvp3.0` の実装を進めることで、既存のデータ取得フローと整合する AI コーチング体験を実現できる。
