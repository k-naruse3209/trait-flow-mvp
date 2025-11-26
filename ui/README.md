<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Trait Flow v3.0 プロトタイプ — 実行とデプロイ

Development of the earlier Vite proof-of-concept is frozen; all effort now lives in this mobile-first Next.js codebase so we ship from one stack instead of two.
このリポジトリ（`k-naruse3209/trait-flow-mvp3.0`）は v2 系の UI 実装を引き継ぎつつ、LangGraph Orchestrator 連携や本番データモデルを反映させた v3.0 向けの最新ドキュメントと設定を管理します。ユーザーの TIPI 回答や日次チェックインを受け付け、AI 介入カードを表示するフローをローカル/AWS（S3 + CloudFront または App Runner）で検証できます。  
**重要**: 実際の個人化応答は Python 製 Orchestrator（FastAPI + LangGraph + LlamaIndex + pgvector + Cohere Rerank + OpenAI Responses）で実装します。設計詳細は `docs/orchestrator_spec.md` を参照し、UI とは `/api/memory/update` と `/api/respond` で連携してください。GitHub のデフォルトブランチは `main` です。

## ローカルでの実行方法

- **Mobile-first, single-stack**: The Vite prototype is archived; trait-flow-screen’s Next.js UI is the single source of truth with responsive defaults tuned for phones.
- **Supabase Auth & Data**: App Router pages and Middleware enforce Supabase sessions across locales. Database schema + RLS + Edge Functions live under `supabase/`.
- **TIPI & Check-ins**: Users complete the Big Five onboarding (`/api/tipi-submit`) and submit daily mood/energy/note check-ins (`/api/checkins`).
- **AI Coaching via Orchestrator**: Whenever an intervention is required, the Next.js API calls the LangGraph orchestrator (`lib/orchestrator-client.ts`). It sends mood/energy/note/context and receives a structured coaching message that is saved to `interventions`. If the orchestrator is unavailable, the legacy OpenAI fallback from the prototype runs locally.
- **Two-stage delivery**: Check-ins now receive an instant template (fallback) while a deeper AI analysis runs in the background; when it finishes the record is upgraded and a “detailed analysis ready” badge appears.
- **Feedback-first UX**: Users must star-rate the previous coaching card before the next check-in unlocks, guaranteeing `feedback_score` coverage for fine-tuning.
- **Dashboards & History**: The dashboard (`app/[locale]/(protected)/dashboard`) displays streaks, mood analytics, interventions, and check-in history using shadcn/ui.
- **Documentation**: The specs that guided this rewrite live in `docs/` (integration plan, orchestrator spec, system spec, and the new AI coaching design).
**前提条件:** Node.js がインストールされていること

1. 依存関係をインストール  
   `npm install`
2. （任意）LLM の API キーを `.env.local` の `GEMINI_API_KEY` に設定  
   ※現在はモック応答を返すため、未設定でも動作します。環境変数は Vite の define でビルド時に注入されます。
3. 開発サーバーを起動  
   `npm run dev`

## AWS へのデプロイ

UI はビルド済みの静的アセットなので、AWS では以下 2 パターンのいずれかで運用できます。

### オプション A: S3 + CloudFront （静的ホスティング）
1. **ビルド**
   ```bash
   npm run build
   ```
2. **S3 バケット（静的サイト）を用意**  
   - バケットを作成し「静的ウェブサイトホスティング」を有効化。  
   - `dist/` を `aws s3 sync dist/ s3://YOUR_BUCKET --delete` で反映。
3. **CloudFront ディストリビューションを紐付け**  
   - オリジンに S3 静的エンドポイントを指定。  
   - `index.html` をデフォルトルートに設定し、必要なら OAC / OAI を構成。
4. **デプロイ後のキャッシュ無効化（任意）**
   ```bash
   aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
   ```

### オプション B: AWS App Runner / ECS Fargate（Nginx + Docker）
このリポジトリには Dockerfile があり、`start.sh` が `$PORT` を読み取って Nginx を起動します。同じコンテナを AWS App Runner もしくは ECS Fargate に配置できます。

1. **ECR にリポジトリを作成し、イメージをプッシュ**
   ```bash
   aws ecr create-repository --repository-name trait-flow-ui
   aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com
   docker build -t trait-flow-ui .
   docker tag trait-flow-ui:latest ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/trait-flow-ui:latest
   docker push ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/trait-flow-ui:latest
   ```
2. **App Runner にサービスを作成**（例）
   ```bash
   aws apprunner create-service \
     --service-name trait-flow-ui \
     --source-configuration ImageRepository="{ImageIdentifier=ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/trait-flow-ui:latest,ImageRepositoryType=ECR}" \
     --instance-configuration Cpu=1 vCpu,Memory=2 GB \
     --auto-scaling-configuration Arn=arn:aws:apprunner:...:auto-scaling-configuration/DefaultConfiguration/1 \
     --health-check-configuration Protocol=HTTP,Path=/,Interval=10,Timeout=5,HealthyThreshold=1,UnhealthyThreshold=5
   ```
   - ECS/Fargate の場合はタスク定義で同じイメージを指定し、ALB 経由で公開します。
3. **環境変数**  
   - 静的サイトのため必須のランタイム変数はありません。ビルド時に `.env.local` を注入する場合は `npm run build` 前に設定してください。

どちらのオプションでも HTTPS/カスタムドメインは ACM（証明書）+ CloudFront / ALB で終端します。

## ドキュメント
- システム仕様: `docs/system_spec_ja.md`
- Orchestrator 基本設計: `docs/orchestrator_spec.md`
- LangGraph ワークフロー: `docs/new_design.md`
- メタデータ: `metadata.json`

## Orchestrator (FastAPI) について
- 別サービスとして `app/main.py`（FastAPI + LangGraph）を用意し、README 冒頭の設計どおり `/api/memory/update` と `/api/respond` を提供します。
- 推奨デプロイ: AWS App Runner / ECS Fargate（Dockerfile 例は `docs/orchestrator_spec.md` 参照）、DB は Amazon Aurora PostgreSQL + pgvector 拡張や Supabase Managed Postgres など。  
- UI からの `fetch('/api/...')` はこの Orchestrator の URL (CORS 許可済み) に向けてください。
