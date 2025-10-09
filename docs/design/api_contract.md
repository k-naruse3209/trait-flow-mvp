# API コントラクト

本ドキュメントは Supabase Edge Functions を REST エンドポイントとして公開する想定で記述。全エンドポイントは `Authorization: Bearer <JWT>` を必須とする（サインアップ / サインインを除く）。

## 1. エンドポイント一覧

| メソッド | パス | 目的 |
|----------|------|------|
| POST | `/functions/v1/auth/signup` | パスワードレスメール認証の開始 |
| POST | `/functions/v1/tipi-submit` | TIPI 回答の保存とスコア返却 |
| GET  | `/functions/v1/traits` | 最新の TIPI スコア取得 |
| POST | `/functions/v1/checkins` | 日次チェックイン登録と介入生成 |
| GET  | `/functions/v1/checkins` | チェックイン履歴取得 |
| GET  | `/functions/v1/interventions` | 介入メッセージ履歴取得 |
| POST | `/functions/v1/interventions/:id/feedback` | メッセージ評価の登録 |

## 2. 認証関連

### 2.1 POST `/functions/v1/auth/signup`
- **目的**: メールリンク認証のトリガー。Supabase Auth の `signInWithOtp` をラップ。
- **Request**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**
  ```json
  {
    "status": "ok"
  }
  ```
- **エラー**
  - 400: email 未指定
  - 429: レートリミット超過

## 3. オンボーディング

### 3.1 POST `/functions/v1/tipi-submit`
- **目的**: TIPI 10 問の回答を受け取り、スコア化して `baseline_traits` に保存。
- **Request**
  ```json
  {
    "answers": [
      { "item": "TIPI_1", "value": 5 },
      { "item": "TIPI_2", "value": 2 },
      ...
    ],
    "administered_at": "2025-02-01T09:00:00Z"
  }
  ```
- **Validation**
  - `answers.length === 10`
  - `value` は 1〜7 の整数
  - 逆転項目は `7 - value` で処理
- **Response**
  ```json
  {
    "traits_p01": { "O": 0.62, "C": 0.48, "E": 0.55, "A": 0.58, "N": 0.41 },
    "traits_T": { "O": 62, "C": 48, "E": 55, "A": 58, "N": 41 },
    "instrument": "tipi_v1",
    "administered_at": "2025-02-01T09:00:00Z"
  }
  ```
- **エラー**
  - 400: 回答数不足、値域違反
  - 409: 既に TIPI が登録済み（任意で複数回許可する場合は 200 を返す）

### 3.2 GET `/functions/v1/traits`
- **目的**: ユーザーの最新 TIPI スコアを取得。
- **Response**
  ```json
  {
    "traits_p01": { "O": 0.62, ... },
    "traits_T": { "O": 62, ... },
    "instrument": "tipi_v1",
    "administered_at": "2025-02-01T09:00:00Z"
  }
  ```
- **エラー**
  - 404: 未登録

## 4. チェックイン

### 4.1 POST `/functions/v1/checkins`
- **目的**: チェックインを保存し、介入メッセージを生成して返す。
- **Request**
  ```json
  {
    "mood_score": 3,
    "energy_level": "mid",
    "free_text": "今日は集中しづらかった"
  }
  ```
- **レスポンス**
  ```json
  {
    "checkin": {
      "id": "uuid",
      "created_at": "2025-02-03T10:00:00Z"
    },
    "intervention": {
      "id": "uuid",
      "template_type": "reflection",
      "message": {
        "title": "小さな振り返りをしましょう",
        "body": "直近3回の平均気分は 3.1 です。今日の出来事から...",
        "cta_text": "記録に 3 行書き足す"
      },
      "fallback": false
    }
  }
  ```
- **処理フロー**
  1. `checkins` にレコード挿入
  2. `baseline_traits` と直近 3 件のチェックインを取得
  3. テンプレート決定 → OpenAI Responses API 呼び出し
  4. `interventions` に挿入し、レスポンスに含める（`prompt_trace` はサーバー側に保存され、レスポンスには含めない）
- **エラー**
  - 400: 値域エラー（mood_score, energy_level）
  - 500: OpenAI 呼び出し失敗（`fallback: true` でテンプレ返却）

### 4.2 GET `/functions/v1/checkins`
- **クエリパラメータ**
  - `limit`（デフォルト 20, 最大 100）
  - `offset`（任意）
- **Response**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "mood_score": 3,
        "energy_level": "mid",
        "free_text": "今日は集中しづらかった",
        "created_at": "2025-02-01T10:00:00Z"
      }
    ],
    "next_offset": 20
  }
  ```

## 5. 介入メッセージ

### 5.1 GET `/functions/v1/interventions`
- **目的**: 介入履歴を取得。最新順で返す。
- **Response**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "checkin_id": "uuid",
        "template_type": "compassion",
        "message": {
          "title": "今日は自分にやさしく",
          "body": "...",
          "cta_text": "呼吸を整える"
        },
        "fallback": false,
        "feedback_score": 4,
        "created_at": "2025-02-02T10:05:00Z"
      }
    ]
  }
  ```
- **備考**
  - `prompt_trace` や `moderation` など内部用メタデータはレスポンスに含めず、必要に応じて管理画面や監査 API で参照する。

### 5.2 POST `/functions/v1/interventions/:id/feedback`
- **Request**
  ```json
  {
    "score": 4
  }
  ```
- **制約**
  - `score` は 1〜5
  - 当該ユーザーの介入にのみ評価可能
- **Response**
  ```json
  { "status": "ok" }
  ```
- **エラー**
  - 404: 介入が存在しない
  - 409: 既に評価済みの場合（`feedback_score` が非 null）

## 6. エラーレスポンス共通仕様
```json
{
  "error": {
    "code": "validation_error",
    "message": "mood_score must be between 1 and 5"
  }
}
```

## 7. レート制限
- `auth/signup`: 同一 IP から 1 時間に 10 回まで。
- `checkins` と `interventions`: 同一ユーザーで 5 分に 3 回まで（短期間の連続投稿を防止）。
- Supabase Edge Functions の `RateLimiter` ミドルウェアや Upstash Redis を併用。

## 8. OpenAI 呼び出しインターフェース
- **Endpoint**: `https://api.openai.com/v1/responses`
- **Schema**
  ```json
  {
    "model": "gpt-4.1-mini",
    "input": "<prompt text>",
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "intervention_card",
        "schema": {
          "type": "object",
          "properties": {
            "title": { "type": "string", "maxLength": 30 },
            "body": { "type": "string", "maxLength": 300 },
            "cta_text": { "type": "string", "maxLength": 40 }
          },
          "required": ["title","body","cta_text"],
          "additionalProperties": false
        }
      }
    },
    "temperature": 0.7
  }
  ```
- **エラー処理**
  - 429/500: 3 回まで指数バックオフで再試行（1s, 2s, 4s）
  - 全て失敗した場合はフォールバックテンプレートを採用し、レスポンスでは `fallback: true`。
