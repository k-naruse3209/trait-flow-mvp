# 環境設定ガイド

## 1. 概要

本ドキュメントでは、Trait Flow MVP の開発環境およびデプロイ環境のセットアップ手順を説明します。

## 2. 必要なツール

### 2.1 開発環境
- **Node.js**: v18.x 以上（推奨: v20.x LTS）
- **pnpm**: v8.x 以上（または npm/yarn）
- **Supabase CLI**: v1.x 以上
- **Git**: v2.x 以上
- **VSCode**（推奨）または任意のエディタ

### 2.2 アカウント
- Supabase アカウント（無料プランで開始可能）
- OpenAI API アカウント（gpt-4o-mini 利用可能）
- GitHub アカウント（リポジトリ管理用）
- Slack アカウント（任意、アラート通知用）

## 3. 環境変数一覧

### 3.1 必須環境変数

以下の環境変数は必ず設定が必要です。

| 変数名 | 説明 | 取得方法 | 例 |
|--------|------|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | Supabase Dashboard > Settings > API | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー（公開鍵） | Supabase Dashboard > Settings > API | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー（秘密鍵） | Supabase Dashboard > Settings > API | `eyJhbGc...` |
| `OPENAI_API_KEY` | OpenAI API キー | OpenAI Dashboard > API Keys | `sk-proj-...` |

### 3.2 任意環境変数

| 変数名 | 説明 | デフォルト値 | 例 |
|--------|------|--------------|-----|
| `OPENAI_MODEL` | 使用する OpenAI モデル | `gpt-4o-mini` | `gpt-4o` |
| `OPENAI_TIMEOUT_MS` | OpenAI API タイムアウト（ミリ秒） | `8000` | `10000` |
| `SLACK_WEBHOOK_URL` | Slack 通知用 Webhook URL | なし | `https://hooks.slack.com/...` |
| `UPSTASH_REDIS_URL` | Upstash Redis URL（レート制限用） | なし | `redis://...` |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis トークン | なし | `AXXXxxx...` |
| `RATE_LIMIT_ENABLED` | レート制限の有効化 | `false` | `true` |
| `LOG_LEVEL` | ログレベル | `info` | `debug` |

### 3.3 開発環境限定

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | ローカル Supabase URL | `http://localhost:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ローカル匿名キー | `eyJhbGc...`（CLI が生成） |
| `SUPABASE_SERVICE_ROLE_KEY` | ローカルサービスロールキー | `eyJhbGc...`（CLI が生成） |

## 4. セットアップ手順

### 4.1 ローカル開発環境

#### Step 1: リポジトリのクローン

```bash
git clone https://github.com/k-naruse3209/trait-flow-mvp.git
cd trait-flow-mvp
```

#### Step 2: 依存関係のインストール

```bash
# pnpm を使用する場合
pnpm install

# npm を使用する場合
npm install
```

#### Step 3: Supabase CLI のインストール

```bash
# macOS (Homebrew)
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
curl -o- https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash
```

#### Step 4: Supabase ローカル環境の起動

```bash
# Docker が起動していることを確認
docker --version

# Supabase ローカル環境を起動
supabase start

# 起動後、以下の情報が表示されます：
# API URL: http://localhost:54321
# GraphQL URL: http://localhost:54321/graphql/v1
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Inbucket URL: http://localhost:54324
# JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
# anon key: eyJhbGc...
# service_role key: eyJhbGc...
```

#### Step 5: 環境変数ファイルの作成

```bash
# .env.local ファイルを作成
cp .env.example .env.local
```

`.env.local` の内容を編集：

```bash
# Supabase（ローカル開発用）
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=（supabase start で表示された anon key）
SUPABASE_SERVICE_ROLE_KEY=（supabase start で表示された service_role key）

# OpenAI
OPENAI_API_KEY=sk-proj-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini

# オプション（開発時は不要）
# SLACK_WEBHOOK_URL=
# UPSTASH_REDIS_URL=
# RATE_LIMIT_ENABLED=false
LOG_LEVEL=debug
```

#### Step 6: データベースマイグレーション

```bash
# マイグレーションを適用
supabase db reset

# または
supabase migration up
```

#### Step 7: Edge Functions のデプロイ（ローカル）

```bash
# Edge Functions をローカルで起動
supabase functions serve

# または特定の関数のみ
supabase functions serve tipi-submit checkins
```

#### Step 8: フロントエンドの起動

```bash
# 開発サーバーを起動
pnpm dev

# ブラウザで http://localhost:3000 にアクセス
```

### 4.2 ステージング/本番環境

#### Step 1: Supabase プロジェクトの作成

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. "New Project" をクリック
3. プロジェクト名、データベースパスワード、リージョンを設定
4. プロジェクトが作成されるまで待機（約2分）

#### Step 2: データベースマイグレーション

```bash
# Supabase プロジェクトにリンク
supabase link --project-ref your-project-ref

# マイグレーションを適用
supabase db push
```

#### Step 3: Edge Functions のデプロイ

```bash
# 全ての Edge Functions をデプロイ
supabase functions deploy

# または個別にデプロイ
supabase functions deploy tipi-submit
supabase functions deploy checkins
supabase functions deploy intervention-feedback
```

#### Step 4: 環境変数の設定（Supabase）

```bash
# OpenAI API キーを設定
supabase secrets set OPENAI_API_KEY=sk-proj-your-actual-key-here

# その他のシークレット
supabase secrets set OPENAI_MODEL=gpt-4o-mini
supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# 設定確認
supabase secrets list
```

#### Step 5: フロントエンドのデプロイ（Vercel）

```bash
# Vercel CLI のインストール
npm install -g vercel

# デプロイ
vercel --prod

# 環境変数を設定（Vercel Dashboard または CLI）
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
```

## 5. 環境別設定

### 5.1 開発環境（Local）

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=（ローカル anon key）
SUPABASE_SERVICE_ROLE_KEY=（ローカル service_role key）
OPENAI_API_KEY=sk-proj-...
LOG_LEVEL=debug
RATE_LIMIT_ENABLED=false
```

### 5.2 ステージング環境

```bash
# Vercel 環境変数（staging ブランチ）
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（staging anon key）
SUPABASE_SERVICE_ROLE_KEY=（staging service_role key）
OPENAI_API_KEY=sk-proj-...
LOG_LEVEL=info
RATE_LIMIT_ENABLED=false
```

### 5.3 本番環境（Production）

```bash
# Vercel 環境変数（main ブランチ）
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（production anon key）
SUPABASE_SERVICE_ROLE_KEY=（production service_role key）
OPENAI_API_KEY=sk-proj-...
LOG_LEVEL=warn
RATE_LIMIT_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

## 6. .env.example ファイル

プロジェクトルートに `.env.example` を配置：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_MS=8000

# Optional: Slack Notifications
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional: Rate Limiting (Upstash Redis)
# UPSTASH_REDIS_URL=redis://...
# UPSTASH_REDIS_TOKEN=...
# RATE_LIMIT_ENABLED=false

# Logging
LOG_LEVEL=info
```

## 7. トラブルシューティング

### 7.1 Supabase が起動しない

```bash
# Docker の状態を確認
docker ps

# Supabase を停止して再起動
supabase stop
supabase start
```

### 7.2 マイグレーションエラー

```bash
# マイグレーション履歴を確認
supabase migration list

# 強制リセット（開発環境のみ）
supabase db reset
```

### 7.3 Edge Functions がデプロイできない

```bash
# 関数のログを確認
supabase functions logs tipi-submit --tail

# 環境変数を確認
supabase secrets list
```

### 7.4 OpenAI API エラー

```bash
# API キーの有効性を確認
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# クレジット残高を確認
# OpenAI Dashboard > Usage を参照
```

## 8. セキュリティチェックリスト

- [ ] `.env.local` と `.env` が `.gitignore` に含まれている
- [ ] `SUPABASE_SERVICE_ROLE_KEY` は絶対にクライアント側で使用しない
- [ ] 本番環境の API キーをローカル開発で使用しない
- [ ] Supabase RLS（Row Level Security）が全テーブルで有効
- [ ] OpenAI API キーのレート制限を設定
- [ ] CORS 設定が適切（本番ドメインのみ許可）

## 9. 参考リンク

- [Supabase ドキュメント](https://supabase.com/docs)
- [Supabase CLI リファレンス](https://supabase.com/docs/reference/cli)
- [Next.js 環境変数](https://nextjs.org/docs/basic-features/environment-variables)
- [OpenAI API ドキュメント](https://platform.openai.com/docs)
- [Vercel デプロイガイド](https://vercel.com/docs)

## 10. 変更履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2025-01-XX | 1.0.0 | 初版作成 |
