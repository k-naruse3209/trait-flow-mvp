# セキュリティ実装ガイド

## 1. 概要

本ドキュメントでは、Trait Flow MVP のセキュリティ実装に関する詳細を記載します。

## 2. 認証・認可

### 2.1 Supabase Auth 設定

#### 認証方式
- **メールリンク認証（Magic Link）**: パスワードレス認証を採用
- **OTP 認証**: ワンタイムパスワードによる認証（任意）

#### Auth 設定手順

**Supabase Dashboard での設定:**

1. Authentication > Settings に移動
2. Email Auth を有効化
3. Enable email confirmations: **OFF**（開発用、本番では ON）
4. Disable email signups: **OFF**
5. Email templates をカスタマイズ（任意）

**プログラムでの実装:**

```typescript
// クライアント側（Next.js）
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// サインアップ/サインイン
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'http://localhost:3000/app'
  }
})
```

### 2.2 JWT トークン管理

#### トークン構造

Supabase Auth が発行する JWT には以下が含まれます：

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "aal": "aal1"
}
```

#### トークン検証（Edge Functions）

```typescript
// supabase/functions/_shared/auth.ts
import { createClient } from '@supabase/supabase-js@2'

export async function withAuth(
  req: Request,
  handler: (req: Request, ctx: AuthContext) => Promise<Response>
): Promise<Response> {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: { code: 'AUTH_MISSING', message: 'Authorization header required' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      global: { headers: { Authorization: authHeader } }
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: { code: 'AUTH_INVALID', message: 'Invalid or expired token' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return handler(req, { userId: user.id, supabase })
}
```

## 3. Row Level Security (RLS)

### 3.1 RLS ポリシー定義

すべてのテーブルで RLS を有効化し、ユーザーは自分のデータのみアクセス可能にします。

#### baseline_traits テーブル

```sql
-- RLS 有効化
alter table public.baseline_traits enable row level security;

-- SELECT ポリシー: 自分のデータのみ閲覧可能
create policy "Users can view own traits"
  on public.baseline_traits
  for select
  using (auth.uid() = user_id);

-- INSERT ポリシー: 自分のデータのみ作成可能
create policy "Users can insert own traits"
  on public.baseline_traits
  for insert
  with check (auth.uid() = user_id);

-- UPDATE ポリシー: 更新不可（TIPIは再登録ではなく追加）
-- DELETE ポリシー: ユーザー削除時のCASCADEで自動削除
```

#### checkins テーブル

```sql
-- RLS 有効化
alter table public.checkins enable row level security;

-- SELECT ポリシー
create policy "Users can view own checkins"
  on public.checkins
  for select
  using (auth.uid() = user_id);

-- INSERT ポリシー
create policy "Users can insert own checkins"
  on public.checkins
  for insert
  with check (auth.uid() = user_id);

-- UPDATE/DELETE: 不要（チェックインは編集・削除不可）
```

#### interventions テーブル

```sql
-- RLS 有効化
alter table public.interventions enable row level security;

-- SELECT ポリシー
create policy "Users can view own interventions"
  on public.interventions
  for select
  using (auth.uid() = user_id);

-- UPDATE ポリシー: feedback_score の更新のみ許可
create policy "Users can update feedback on own interventions"
  on public.interventions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- INSERT: Edge Functions（サービスロール）のみ
-- DELETE: 不要
```

### 3.2 サービスロールによるバイパス

Edge Functions は `SUPABASE_SERVICE_ROLE_KEY` を使用するため、RLS をバイパスして全データにアクセス可能です。

**重要:** サービスロールキーは以下の用途のみに使用：
- Edge Functions 内での介入メッセージの挿入
- 管理用スクリプト（データエクスポートなど）

**クライアント側では絶対に使用しない！**

### 3.3 RLS テスト

```sql
-- RLS ポリシーのテスト（psql or Supabase SQL Editor）

-- テストユーザーとして認証
set request.jwt.claim.sub = 'test-user-uuid';

-- 自分のデータは取得可能
select * from public.baseline_traits where user_id = 'test-user-uuid';
-- -> 成功

-- 他人のデータは取得不可
select * from public.baseline_traits where user_id = 'other-user-uuid';
-- -> 結果なし

-- 認証解除
reset request.jwt.claim.sub;
```

## 4. API セキュリティ

### 4.1 CORS 設定

#### Supabase Edge Functions の CORS

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 開発時
  // 本番: 'https://your-domain.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// すべての Edge Function で使用
Deno.serve(async (req) => {
  // Preflight リクエスト
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ... ハンドラ処理 ...
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

**本番環境の CORS 設定:**

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://trait-flow.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}
```

### 4.2 レート制限

#### 実装方式: Upstash Redis

```typescript
// supabase/functions/_shared/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function checkRateLimit(
  key: string,
  limit: number,
  window: number // seconds
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const windowKey = `rate:${key}:${Math.floor(now / (window * 1000))}`

  const current = await redis.incr(windowKey)

  if (current === 1) {
    await redis.expire(windowKey, window)
  }

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current)
  }
}
```

#### レート制限ルール

| エンドポイント | 制限 | ウィンドウ | 識別子 |
|----------------|------|------------|--------|
| `/auth/signup` | 10 回 | 1時間 | IP アドレス |
| `/checkins` | 3 回 | 5分 | ユーザーID |
| `/interventions/:id/feedback` | 5 回 | 1分 | ユーザーID |

#### 使用例

```typescript
// supabase/functions/checkins/index.ts
const { allowed, remaining } = await checkRateLimit(
  `user:${userId}`,
  3,
  300 // 5分
)

if (!allowed) {
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + 300)
      }
    }
  )
}
```

### 4.3 入力バリデーション

すべてのエンドポイントで zod によるバリデーションを実施：

```typescript
import { z } from 'zod'

const checkinSchema = z.object({
  mood_score: z.number().int().min(1).max(5),
  energy_level: z.enum(['low', 'mid', 'high']),
  free_text: z.string().max(280).optional(),
})

export function validate<T>(data: unknown, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors)
    }
    throw error
  }
}
```

## 5. シークレット管理

### 5.1 環境変数の保護

#### ローカル開発

```bash
# .gitignore に必須
.env
.env.local
.env.*.local

# セキュアな環境変数ファイルのパーミッション
chmod 600 .env.local
```

#### Supabase Secrets

```bash
# 設定
supabase secrets set OPENAI_API_KEY=sk-proj-...
supabase secrets set SLACK_WEBHOOK_URL=https://...

# 確認（値は表示されない）
supabase secrets list

# 削除
supabase secrets unset OPENAI_API_KEY
```

#### Vercel Environment Variables

1. Vercel Dashboard > Settings > Environment Variables
2. Production / Preview / Development 環境ごとに設定
3. **Sensitive variables** をチェック（ログに出力されない）

### 5.2 API キーローテーション

#### OpenAI API キー

**ローテーション頻度:** 3ヶ月ごと（推奨）

**手順:**
1. OpenAI Dashboard で新しいキーを生成
2. Supabase Secrets を更新: `supabase secrets set OPENAI_API_KEY=<new-key>`
3. 動作確認後、古いキーを削除

#### Supabase Service Role Key

**ローテーション:** プロジェクトレベルでのリセットが必要
- Supabase Dashboard > Settings > API > Reset service role key
- 全環境の環境変数を即座に更新

## 6. データ保護

### 6.1 個人情報（PII）の取り扱い

#### 保存するPII

| データ | テーブル | 暗号化 | 保持期間 |
|--------|----------|--------|----------|
| メールアドレス | `auth.users` | Supabase 管理 | ユーザー削除まで |
| チェックインテキスト | `checkins.free_text` | なし | 90日後アーカイブ |

**重要:** TIPI スコアや気分データは個人を特定しない限り PII ではありません。

#### データ削除リクエスト

**GDPR / CCPA 準拠:**

```sql
-- ユーザーデータの完全削除（管理者のみ実行）
begin;

-- 関連データは CASCADE で自動削除
delete from auth.users where id = 'user-uuid';

-- 削除ログを記録（監査用）
insert into audit_log (action, user_id, timestamp)
values ('user_deleted', 'user-uuid', now());

commit;
```

### 6.2 データ暗号化

#### 転送中（In Transit）

- **HTTPS 必須**: Supabase とクライアント間はすべて TLS 1.3
- **Edge Functions**: Deno Deploy は自動的に HTTPS

#### 保存時（At Rest）

- **Supabase PostgreSQL**: AES-256 暗号化（デフォルト有効）
- **追加暗号化不要**: PII が最小限のため

### 6.3 ログとモニタリング

#### ログに含めてはいけない情報

❌ **絶対にログに出力しない:**
- JWT トークン
- Supabase Service Role Key
- OpenAI API Key
- ユーザーのメールアドレス（user_id のみ使用）
- チェックインの free_text（デバッグ時も user_id で参照）

✅ **ログに出力して良い情報:**
- user_id（UUID）
- リクエストメソッドとパス
- レスポンスステータスコード
- 処理時間
- エラーメッセージ（個人情報を含まない）

```typescript
// ✅ 良い例
console.log(JSON.stringify({
  event: 'checkin_created',
  user_id: userId,
  status: 'success',
  duration_ms: 342
}))

// ❌ 悪い例
console.log(`User ${email} created checkin: ${free_text}`)
```

## 7. 外部サービスのセキュリティ

### 7.1 OpenAI API

#### API キーの保護

- Edge Functions の環境変数のみに保存
- クライアント側では絶対に使用しない
- リクエストログに含めない

#### プロンプトインジェクション対策

```typescript
// ユーザー入力をプロンプトに含める際の対策
function sanitizeUserInput(text: string): string {
  // 長さ制限（データモデルで既に280文字）
  const truncated = text.slice(0, 280)

  // 不適切な制御文字を削除
  return truncated.replace(/[\x00-\x1F\x7F]/g, '')
}

// プロンプトでの明確な分離
const prompt = `
あなたはメンタルコーチです。以下のユーザー入力に基づいてメッセージを生成してください。

===ユーザー入力開始===
${sanitizeUserInput(userInput)}
===ユーザー入力終了===

上記の入力に対して、JSON形式で...
`
```

#### OpenAI Moderation API

```typescript
// 不適切なコンテンツの検出（任意）
async function checkModeration(text: string): Promise<boolean> {
  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: text })
  })

  const data = await response.json()
  return data.results[0].flagged
}
```

### 7.2 Slack Webhook

```typescript
// Webhook URL をログに出力しない
const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')

if (webhookUrl) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `⚠️ High error rate detected: ${errorRate}%`
      })
    })
  } catch (error) {
    console.error('Failed to send Slack notification', { error: error.message })
    // Webhook URLは含めない
  }
}
```

## 8. セキュリティチェックリスト

### デプロイ前

- [ ] すべてのテーブルで RLS が有効
- [ ] RLS ポリシーが正しく動作することをテスト
- [ ] `.env` ファイルが `.gitignore` に含まれている
- [ ] 本番環境の API キーがコミットされていない
- [ ] CORS が本番ドメインのみに制限されている
- [ ] レート制限が有効（本番のみ）
- [ ] Edge Functions の環境変数がすべて設定されている
- [ ] OpenAI API キーの使用量制限を設定
- [ ] Slack Webhook が機能することを確認

### 定期的なチェック

- [ ] API キーのローテーション（3ヶ月ごと）
- [ ] Supabase Auth ログの確認（不審なログイン）
- [ ] OpenAI 使用量の監視（異常な増加）
- [ ] レート制限の効果を確認（ブロック数）
- [ ] セキュリティアップデートの適用（依存関係）

## 9. インシデント対応

### 9.1 API キー漏洩時の対応

**即座に実行:**

1. 漏洩したキーを無効化
   - OpenAI: Dashboard > API Keys > Revoke
   - Supabase: Dashboard > Settings > Reset key

2. 新しいキーを生成して設定
   ```bash
   supabase secrets set OPENAI_API_KEY=<new-key>
   vercel env add OPENAI_API_KEY production
   ```

3. デプロイを即座に実行
   ```bash
   supabase functions deploy
   vercel --prod
   ```

4. 監査ログを確認（不正利用の有無）

### 9.2 不正アクセス検知時

1. 該当ユーザーのセッションを無効化
   ```sql
   -- Supabase Dashboard > Authentication > Users
   -- 該当ユーザーの「Sign out user」を実行
   ```

2. RLS ポリシーの確認
3. アクセスログの分析
4. 必要に応じてパスワードリセット要求

## 10. 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OpenAI Safety Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [GDPR Compliance Guide](https://gdpr.eu/)

## 11. 変更履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2025-01-XX | 1.0.0 | 初版作成 |
