# エラーコード仕様

## 1. 概要

Trait Flow MVP で使用する標準化されたエラーコード体系を定義します。バックエンドとフロントエンドで共通の仕様を用います。

## 2. エラーレスポンス形式

すべてのエラーは以下の JSON 形式で返却します：

```typescript
interface ErrorResponse {
  error: {
    code: string          // エラーコード（大文字スネークケース）
    message: string       // ユーザー向けエラーメッセージ（日本語）
    details?: unknown     // オプション：詳細情報（開発用）
  }
}
```

### 例

```json
{
  "error": {
    "code": "VALIDATION_MOOD_SCORE_INVALID",
    "message": "気分スコアは1〜5の整数で指定してください",
    "details": {
      "field": "mood_score",
      "value": 10,
      "expected": "1-5"
    }
  }
}
```

## 3. エラーコード体系

### 3.1 カテゴリプレフィックス

| プレフィックス | カテゴリ | HTTP ステータス |
|----------------|----------|-----------------|
| `AUTH_` | 認証・認可エラー | 401, 403 |
| `VALIDATION_` | 入力バリデーションエラー | 400 |
| `RESOURCE_` | リソース関連エラー | 404, 409 |
| `OPENAI_` | OpenAI API エラー | 500, 503 |
| `DB_` | データベースエラー | 500 |
| `RATE_LIMIT_` | レート制限エラー | 429 |
| `SERVER_` | その他サーバーエラー | 500 |

### 3.2 命名規則

```
{CATEGORY}_{SPECIFIC_ERROR}
```

- 全て大文字
- 単語間はアンダースコア区切り
- 具体的で一意な名前を付ける

## 4. エラーコード一覧

### 4.1 認証エラー（AUTH_）

| コード | HTTPステータス | メッセージ | 発生状況 |
|--------|---------------|-----------|----------|
| `AUTH_MISSING` | 401 | 認証が必要です | Authorization ヘッダーがない |
| `AUTH_INVALID` | 401 | 認証情報が無効です | JWT トークンが不正または期限切れ |
| `AUTH_EXPIRED` | 401 | セッションの有効期限が切れました | JWT の exp が過去 |
| `AUTH_FORBIDDEN` | 403 | このリソースへのアクセス権限がありません | 他ユーザーのデータへのアクセス試行 |

### 4.2 バリデーションエラー（VALIDATION_）

| コード | HTTPステータス | メッセージ | 発生状況 |
|--------|---------------|-----------|----------|
| `VALIDATION_MISSING_FIELD` | 400 | 必須フィールドが不足しています: {field} | 必須パラメータ未指定 |
| `VALIDATION_INVALID_FORMAT` | 400 | フィールドの形式が不正です: {field} | 型や形式の不一致 |
| `VALIDATION_MOOD_SCORE_INVALID` | 400 | 気分スコアは1〜5の整数で指定してください | mood_score が範囲外 |
| `VALIDATION_ENERGY_LEVEL_INVALID` | 400 | エネルギーレベルは low/mid/high のいずれかを指定してください | energy_level が不正 |
| `VALIDATION_FREE_TEXT_TOO_LONG` | 400 | テキストは280文字以内で入力してください | free_text > 280文字 |
| `VALIDATION_TIPI_ANSWERS_INVALID` | 400 | TIPIの回答は10問すべて必要です | answers.length !== 10 |
| `VALIDATION_TIPI_VALUE_INVALID` | 400 | TIPIの回答は1〜7の整数で指定してください | value が範囲外 |
| `VALIDATION_FEEDBACK_SCORE_INVALID` | 400 | 評価スコアは1〜5の整数で指定してください | feedback_score が範囲外 |
| `VALIDATION_EMAIL_INVALID` | 400 | メールアドレスの形式が正しくありません | email が不正 |

### 4.3 リソースエラー（RESOURCE_）

| コード | HTTPステータス | メッセージ | 発生状況 |
|--------|---------------|-----------|----------|
| `RESOURCE_NOT_FOUND` | 404 | 指定されたリソースが見つかりません | 存在しない ID へのアクセス |
| `RESOURCE_TRAITS_NOT_FOUND` | 404 | TIPIスコアが登録されていません | オンボーディング未完了 |
| `RESOURCE_INTERVENTION_NOT_FOUND` | 404 | 介入メッセージが見つかりません | 存在しない intervention_id |
| `RESOURCE_ALREADY_EXISTS` | 409 | このリソースは既に存在します | TIPI 再登録（禁止の場合） |
| `RESOURCE_ALREADY_RATED` | 409 | このメッセージには既に評価が登録されています | feedback_score が既に非 null |

### 4.4 OpenAI エラー（OPENAI_）

| コード | HTTPステータス | メッセージ | 発生状況 |
|--------|---------------|-----------|----------|
| `OPENAI_TIMEOUT` | 503 | AI処理がタイムアウトしました。しばらくしてからお試しください | タイムアウト（8秒超過） |
| `OPENAI_RATE_LIMIT` | 503 | AI処理が混み合っています。しばらくしてからお試しください | OpenAI のレート制限 |
| `OPENAI_INVALID_RESPONSE` | 500 | AI応答の形式が不正です | JSON パースエラー |
| `OPENAI_API_ERROR` | 500 | AI処理でエラーが発生しました | その他 OpenAI エラー |

### 4.5 データベースエラー（DB_）

| コード | HTTPステータス | メッセージ | 発生状況 |
|--------|---------------|-----------|----------|
| `DB_CONNECTION_ERROR` | 500 | データベース接続エラーが発生しました | Supabase 接続失敗 |
| `DB_QUERY_ERROR` | 500 | データベースクエリでエラーが発生しました | SQL エラー |
| `DB_CONSTRAINT_VIOLATION` | 400 | データ整合性エラーが発生しました | 制約違反 |

### 4.6 レート制限エラー（RATE_LIMIT_）

| コード | HTTPステータス | メッセージ | 発生状況 |
|--------|---------------|-----------|----------|
| `RATE_LIMIT_EXCEEDED` | 429 | リクエストが多すぎます。しばらくしてからお試しください | レート制限超過 |
| `RATE_LIMIT_CHECKIN_EXCEEDED` | 429 | チェックインの投稿は5分に3回までです | チェックイン頻度制限 |

### 4.7 サーバーエラー（SERVER_）

| コード | HTTPステータス | メッセージ | 発生状況 |
|--------|---------------|-----------|----------|
| `SERVER_INTERNAL_ERROR` | 500 | サーバー内部エラーが発生しました | 予期しないエラー |
| `SERVER_UNAVAILABLE` | 503 | サービスが一時的に利用できません | メンテナンス等 |

## 5. 実装例

### 5.1 バックエンド（Edge Functions）

#### エラークラスの定義

```typescript
// supabase/functions/_shared/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details })
      }
    }
  }
}

// 便利なファクトリー関数
export const Errors = {
  authMissing: () => new AppError(
    'AUTH_MISSING',
    '認証が必要です',
    401
  ),

  authInvalid: () => new AppError(
    'AUTH_INVALID',
    '認証情報が無効です',
    401
  ),

  validationMoodScore: (value: number) => new AppError(
    'VALIDATION_MOOD_SCORE_INVALID',
    '気分スコアは1〜5の整数で指定してください',
    400,
    { field: 'mood_score', value }
  ),

  resourceNotFound: (resourceType: string, id: string) => new AppError(
    'RESOURCE_NOT_FOUND',
    '指定されたリソースが見つかりません',
    404,
    { resourceType, id }
  ),

  openaiTimeout: () => new AppError(
    'OPENAI_TIMEOUT',
    'AI処理がタイムアウトしました。しばらくしてからお試しください',
    503
  ),

  rateLimitExceeded: (retryAfter: number) => new AppError(
    'RATE_LIMIT_EXCEEDED',
    'リクエストが多すぎます。しばらくしてからお試しください',
    429,
    { retryAfter }
  ),
}
```

#### エラーハンドラー

```typescript
// supabase/functions/_shared/error-handler.ts
import { corsHeaders } from './cors.ts'
import { AppError } from './errors.ts'

export function handleError(error: unknown): Response {
  console.error('Error occurred:', error)

  if (error instanceof AppError) {
    return new Response(
      JSON.stringify(error.toJSON()),
      {
        status: error.statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // 予期しないエラー
  return new Response(
    JSON.stringify({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'サーバー内部エラーが発生しました'
      }
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}
```

#### 使用例

```typescript
// supabase/functions/checkins/index.ts
import { handleError, Errors } from '../_shared/index.ts'

Deno.serve(async (req) => {
  try {
    const body = await req.json()

    // バリデーション
    if (body.mood_score < 1 || body.mood_score > 5) {
      throw Errors.validationMoodScore(body.mood_score)
    }

    // ... 処理 ...

  } catch (error) {
    return handleError(error)
  }
})
```

### 5.2 フロントエンド（Next.js）

#### エラーハンドリング

```typescript
// lib/api/error-handler.ts
export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export class ApiException extends Error {
  constructor(
    public error: ApiError,
    public statusCode: number
  ) {
    super(error.message)
    this.name = 'ApiException'
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: {
        code: 'SERVER_INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました'
      }
    }))

    throw new ApiException(errorData.error, response.status)
  }

  return response.json()
}
```

#### エラーメッセージの表示

```typescript
// components/ErrorToast.tsx
import { ApiException } from '@/lib/api/error-handler'

export function showErrorToast(error: unknown) {
  if (error instanceof ApiException) {
    // エラーコードに応じた処理
    switch (error.error.code) {
      case 'AUTH_INVALID':
      case 'AUTH_EXPIRED':
        // セッション切れ → ログアウトしてログイン画面へ
        supabase.auth.signOut()
        router.push('/login')
        toast.error('セッションが切れました。再度ログインしてください')
        break

      case 'RATE_LIMIT_EXCEEDED':
        toast.error(error.error.message)
        break

      case 'OPENAI_TIMEOUT':
        toast.warning('AI処理がタイムアウトしました。再度お試しください')
        break

      default:
        toast.error(error.error.message)
    }
  } else {
    toast.error('予期しないエラーが発生しました')
  }
}
```

#### React Query での使用例

```typescript
// hooks/useCreateCheckin.ts
import { useMutation } from '@tanstack/react-query'
import { handleApiResponse, ApiException } from '@/lib/api/error-handler'
import { showErrorToast } from '@/components/ErrorToast'

export function useCreateCheckin() {
  return useMutation({
    mutationFn: async (data: CheckinInput) => {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      })

      return handleApiResponse<CheckinResponse>(response)
    },
    onError: (error) => {
      showErrorToast(error)
    }
  })
}
```

## 6. エラーログ

### 6.1 ログ出力形式

```typescript
// エラーログの標準形式
console.error(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'error',
  code: error.code,
  message: error.message,
  user_id: userId,
  endpoint: req.url,
  method: req.method,
  stack: error.stack, // 開発環境のみ
}))
```

### 6.2 Slack 通知トリガー

以下のエラーが発生した場合、Slack に通知：

- `DB_CONNECTION_ERROR`
- `OPENAI_API_ERROR`（連続3回以上）
- `SERVER_INTERNAL_ERROR`（10分間に5回以上）

## 7. テスト

### 7.1 エラーハンドリングのテスト

```typescript
// supabase/functions/checkins/test.ts
import { assertEquals } from 'https://deno.land/std@0.192.0/testing/asserts.ts'

Deno.test('バリデーションエラー: mood_score が範囲外', async () => {
  const response = await fetch('http://localhost:54321/functions/v1/checkins', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mood_score: 10, // 不正値
      energy_level: 'mid',
    })
  })

  assertEquals(response.status, 400)

  const data = await response.json()
  assertEquals(data.error.code, 'VALIDATION_MOOD_SCORE_INVALID')
})
```

## 8. 変更履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2025-01-XX | 1.0.0 | 初版作成 |

## 9. 参考資料

- [RFC 7807 - Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807)
- [Google API Design Guide - Errors](https://cloud.google.com/apis/design/errors)
