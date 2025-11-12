# Trait Flow MVP

日次チェックインとAI介入メッセージによるメンタルヘルスサポートアプリ

## 🚀 クイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/k-naruse3209/trait-flow-mvp.git
cd trait-flow-mvp

# セットアップ手順は以下を参照
# docs/deployment/environment_setup.md
```

## 📚 ドキュメント索引

### 1. 概要・仕様

| ドキュメント | 説明 |
|-------------|------|
| [`docs/overview/prototype_brief_ja.md`](docs/overview/prototype_brief_ja.md) | プロトタイプ概要（かんたん説明） |
| [`docs/overview/prototype_brief_vi.md`](docs/overview/prototype_brief_vi.md) | Tổng quan prototype (Tiếng Việt) |
| [`docs/prototype_spec_ja.md`](docs/prototype_spec_ja.md) | **プロトタイプ仕様書（簡易版）** ⭐ |

### 2. 設計ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [`docs/design/architecture_overview.md`](docs/design/architecture_overview.md) | **アーキテクチャ概要** ⭐ |
| [`docs/design/data_model.md`](docs/design/data_model.md) | データモデル・ER図 |
| [`docs/design/api_contract.md`](docs/design/api_contract.md) | **API契約書** ⭐ |
| [`docs/design/backend_functions.md`](docs/design/backend_functions.md) | Edge Functions 設計 |
| [`docs/design/frontend_flows.md`](docs/design/frontend_flows.md) | フロントエンド設計 |
| [`docs/design/prompt_templates.md`](docs/design/prompt_templates.md) | プロンプト設計 |
| [`docs/design/error_codes.md`](docs/design/error_codes.md) | **エラーコード仕様** 🆕 |

### 3. 実装ガイド

| ドキュメント | 説明 |
|-------------|------|
| [`docs/deployment/environment_setup.md`](docs/deployment/environment_setup.md) | **環境設定ガイド** ⭐ 🆕 |
| [`docs/security/security_implementation.md`](docs/security/security_implementation.md) | **セキュリティ実装** ⭐ 🆕 |
| [`docs/testing/test_specifications.md`](docs/testing/test_specifications.md) | **テスト仕様書** 🆕 |
| [`docs/design/project_plan.md`](docs/design/project_plan.md) | 実装ロードマップ（8週間） |

### 4. プレゼン資料

| ドキュメント | 説明 |
|-------------|------|
| [`docs/slides/prototype_pitch_ja.md`](docs/slides/prototype_pitch_ja.md) | プレゼン資料素案（日本語） |
| [`docs/slides/prototype_pitch_en.md`](docs/slides/prototype_pitch_en.md) | Presentation Outline (English) |
| [`docs/slides/prototype_pitch_vi.md`](docs/slides/prototype_pitch_vi.md) | Bài thuyết trình (Tiếng Việt) |

**凡例:** ⭐ = 必読 | 🆕 = 新規追加

### ドキュメント クイックリンク

- プロトタイプ概要（かんたん説明）: `docs/overview/prototype_brief_ja.md`
- Tổng quan prototype (Tiếng Việt): `docs/overview/prototype_brief_vi.md`
- プロトタイプ仕様書（簡易版）: `docs/prototype_spec_ja.md`
- アーキテクチャ概要: `docs/design/architecture_overview.md`
- データモデル: `docs/design/data_model.md`
- API コントラクト: `docs/design/api_contract.md`
- Edge Functions 設計: `docs/design/backend_functions.md`
- フロントエンド設計: `docs/design/frontend_flows.md`
- プロンプト設計: `docs/design/prompt_templates.md`
- 実装ロードマップ: `docs/design/project_plan.md`
- プレゼン資料素案（日本語）: `docs/slides/prototype_pitch_ja.md`
- Presentation Outline (English): `docs/slides/prototype_pitch_en.md`
- Bài thuyết trình (Tiếng Việt): `docs/slides/prototype_pitch_vi.md`

## Backend (orchestrator)

- `backend/orchestrator` には FastAPI サービスを追加。LangGraph / LlamaIndex / pgvector / Cohere Rerank / OpenAI Responses を利用する構成です。
- `.env.example` を参照して環境変数を設定し、Cloud Run などにデプロイします。

### 使い方（ミニ検証）

```bash
# 1) DB テーブル作成
psql "$PG_DSN" -f backend/orchestrator/db/schema.sql

# 2) ローカル起動
cd backend/orchestrator
uvicorn app.main:app --reload

# 3) メモリ投入
curl -XPOST localhost:8000/api/memory/update \
 -H 'content-type: application/json' \
 -d '{"user_id":"u_demo","text":"私は短く結論から答えるのが好き","kind":"note"}'

# 4) 応答
curl -XPOST localhost:8000/api/respond \
 -H 'content-type: application/json' \
 -d '{"user_id":"u_demo","query":"このプロジェクトの次の一手は？"}'
```

フロントエンド（`ui/.env.local`）では orchestrator のエンドポイントを環境変数で指定し、`fetch('/api/...')` を差し替えてください。

## 🏗️ 技術スタック

- **フロントエンド**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL, Edge Functions)
- **認証**: Supabase Auth (Magic Link)
- **AI**: OpenAI API (gpt-4o-mini)
- **デプロイ**: Vercel (Frontend), Supabase (Backend)

## 🔒 セキュリティ

- Row Level Security (RLS) による厳格なアクセス制御
- JWT ベースの認証
- API キーの安全な管理
- レート制限（Upstash Redis）

詳細: [`docs/security/security_implementation.md`](docs/security/security_implementation.md)

## 📊 開発状況

- [x] 設計ドキュメント完成
- [ ] 開発環境セットアップ
- [ ] Phase 1: 認証・オンボーディング
- [ ] Phase 2: チェックイン機能
- [ ] Phase 3: 履歴・評価機能
- [ ] Phase 4: 内部テスト
- [ ] Phase 5: パイロット運用

## 📞 お問い合わせ

プロジェクトに関する質問は Issue にてお願いします。

---

**Last Updated**: 2025-01-XX | **Version**: 0.1.0 (Design Phase)
