# テスト仕様書

## 1. 概要

Trait Flow MVP のテスト戦略とテストケース仕様を定義します。

## 2. テスト戦略

### 2.1 テストピラミッド

```
        /\
       /E2E\         10% - クリティカルパステスト
      /------\
     /Integr-\       30% - API統合テスト
    /----------\
   /----Unit----\    60% - 単体テスト
  /--------------\
```

### 2.2 テストフェーズ

| フェーズ | タイミング | 目的 |
|----------|-----------|------|
| **Unit Tests** | コミット前 | 関数・コンポーネントの動作確認 |
| **Integration Tests** | PR作成時 | API とデータベースの統合確認 |
| **E2E Tests** | デプロイ前 | ユーザーフロー全体の動作確認 |
| **Manual Testing** | リリース前 | UI/UX の最終確認 |

## 3. 単体テスト (Unit Tests)

### 3.1 バックエンド（Edge Functions）

#### 対象
- TIPI スコア計算ロジック
- テンプレート選択ロジック
- プロンプト生成ロジック
- バリデーション関数

#### テストケース例: TIPI スコア計算

**ファイル:** `supabase/functions/_shared/tipi.test.ts`

```typescript
import { assertEquals } from 'https://deno.land/std@0.192.0/testing/asserts.ts'
import { scoreTipi, toP01, toTscore } from './tipi.ts'

Deno.test('TIPI スコア計算: 正常系', () => {
  const answers = [
    { item: 'TIPI_1', value: 7 },  // Extraversion
    { item: 'TIPI_2', value: 2 },  // Agreeableness (逆転)
    { item: 'TIPI_3', value: 6 },  // Conscientiousness
    { item: 'TIPI_4', value: 3 },  // Emotional Stability (逆転)
    { item: 'TIPI_5', value: 5 },  // Openness
    { item: 'TIPI_6', value: 6 },  // Extraversion (逆転)
    { item: 'TIPI_7', value: 7 },  // Agreeableness
    { item: 'TIPI_8', value: 4 },  // Conscientiousness (逆転)
    { item: 'TIPI_9', value: 2 },  // Emotional Stability
    { item: 'TIPI_10', value: 6 }, // Openness (逆転)
  ]

  const scored = scoreTipi(answers)

  // Extraversion: (7 + (7-6)) / 2 = 4.0
  assertEquals(scored.E, 4.0)

  // Agreeableness: ((7-2) + 7) / 2 = 6.0
  assertEquals(scored.A, 6.0)
})

Deno.test('TIPI スコア: 0-1 変換', () => {
  const scored = { O: 4.0, C: 5.5, E: 3.0, A: 6.5, N: 2.0 }
  const p01 = toP01(scored)

  // (value - 1) / 6
  assertEquals(p01.O, 0.5)
  assertEquals(p01.C, 0.75)
  assertEquals(p01.E, (3.0 - 1) / 6)
})

Deno.test('TIPI スコア: T スコア変換', () => {
  const p01 = { O: 0.5, C: 0.75, E: 0.33, A: 0.92, N: 0.17 }
  const tscore = toTscore(p01)

  // value * 100
  assertEquals(tscore.O, 50)
  assertEquals(tscore.C, 75)
})
```

#### テストケース例: テンプレート選択

**ファイル:** `supabase/functions/_shared/template.test.ts`

```typescript
import { assertEquals } from 'https://deno.land/std@0.192.0/testing/asserts.ts'
import { chooseTemplate } from './template.ts'

Deno.test('テンプレート選択: 気分低め → compassion', () => {
  const template = chooseTemplate({
    recentMoodAvg: 2.0,
    traits: { O: 0.5, C: 0.6, E: 0.4, A: 0.7, N: 0.3 }
  })

  assertEquals(template.type, 'compassion')
})

Deno.test('テンプレート選択: 気分中程度 → reflection', () => {
  const template = chooseTemplate({
    recentMoodAvg: 3.2,
    traits: { O: 0.5, C: 0.6, E: 0.4, A: 0.7, N: 0.3 }
  })

  assertEquals(template.type, 'reflection')
})

Deno.test('テンプレート選択: 気分高め → action', () => {
  const template = chooseTemplate({
    recentMoodAvg: 4.5,
    traits: { O: 0.5, C: 0.6, E: 0.4, A: 0.7, N: 0.3 }
  })

  assertEquals(template.type, 'action')
})
```

### 3.2 フロントエンド（React）

#### 対象
- フォームバリデーション
- 状態管理ロジック
- ユーティリティ関数

#### テストケース例: バリデーション

**ファイル:** `__tests__/lib/validation.test.ts`

```typescript
import { validateCheckinInput } from '@/lib/validation'

describe('チェックイン入力バリデーション', () => {
  test('正常系: すべて正しい値', () => {
    const input = {
      mood_score: 3,
      energy_level: 'mid',
      free_text: '今日は良い日だった',
    }

    const result = validateCheckinInput(input)
    expect(result.success).toBe(true)
  })

  test('異常系: mood_score が範囲外', () => {
    const input = {
      mood_score: 10,
      energy_level: 'mid',
    }

    const result = validateCheckinInput(input)
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('VALIDATION_MOOD_SCORE_INVALID')
  })

  test('異常系: energy_level が不正', () => {
    const input = {
      mood_score: 3,
      energy_level: 'invalid',
    }

    const result = validateCheckinInput(input)
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('VALIDATION_ENERGY_LEVEL_INVALID')
  })

  test('異常系: free_text が長すぎる', () => {
    const input = {
      mood_score: 3,
      energy_level: 'mid',
      free_text: 'あ'.repeat(300), // 280文字超過
    }

    const result = validateCheckinInput(input)
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('VALIDATION_FREE_TEXT_TOO_LONG')
  })
})
```

## 4. 統合テスト (Integration Tests)

### 4.1 Edge Functions 統合テスト

#### セットアップ

```bash
# Supabase ローカル環境を起動
supabase start

# テスト実行
deno test --allow-net --allow-env supabase/functions/**/*.test.ts
```

#### テストケース例: チェックイン API

**ファイル:** `supabase/functions/checkins/integration.test.ts`

```typescript
import { assertEquals } from 'https://deno.land/std@0.192.0/testing/asserts.ts'

const BASE_URL = 'http://localhost:54321/functions/v1'
let testUserId: string
let testToken: string

Deno.test('統合テスト: チェックイン作成', async () => {
  // 1. テストユーザーを作成（セットアップ）
  // ...

  // 2. チェックインを投稿
  const response = await fetch(`${BASE_URL}/checkins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mood_score: 4,
      energy_level: 'high',
      free_text: 'テスト投稿',
    }),
  })

  assertEquals(response.status, 200)

  const data = await response.json()
  assertEquals(data.checkin.user_id, testUserId)
  assertEquals(data.intervention.template_type, 'action') // 気分高めなので action
})

Deno.test('統合テスト: OpenAI フォールバック', async () => {
  // OpenAI API キーを無効化してフォールバックをテスト
  Deno.env.set('OPENAI_API_KEY', 'invalid-key')

  const response = await fetch(`${BASE_URL}/checkins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mood_score: 3,
      energy_level: 'mid',
    }),
  })

  assertEquals(response.status, 200)

  const data = await response.json()
  assertEquals(data.intervention.fallback, true) // フォールバックフラグ
})
```

### 4.2 データベース統合テスト

#### テストケース例: RLS ポリシー

**ファイル:** `supabase/tests/rls.test.sql`

```sql
-- RLS ポリシーのテスト

begin;

-- テストユーザー作成
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'user1@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'user2@example.com');

-- User 1 のデータ作成
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

insert into public.checkins (user_id, mood_score, energy_level)
values ('00000000-0000-0000-0000-000000000001', 4, 'high');

-- User 1 は自分のデータにアクセス可能
select * from public.checkins where user_id = '00000000-0000-0000-0000-000000000001';
-- 期待: 1行返却

-- User 2 は User 1 のデータにアクセス不可
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
select * from public.checkins where user_id = '00000000-0000-0000-0000-000000000001';
-- 期待: 0行返却（RLS により制限）

rollback;
```

## 5. E2E テスト (End-to-End Tests)

### 5.1 Playwright セットアップ

```bash
# Playwright インストール
pnpm add -D @playwright/test
npx playwright install

# テスト実行
npx playwright test
```

### 5.2 クリティカルパステスト

#### テストケース 1: オンボーディング → チェックイン → 履歴

**ファイル:** `e2e/critical-path.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test('クリティカルパス: オンボーディング〜チェックイン', async ({ page }) => {
  // 1. サインアップ
  await page.goto('/')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.click('button:has-text("サインアップ")')

  // メールリンククリック（開発環境ではスキップ可能）
  await page.goto('/app/onboarding')

  // 2. TIPI 回答
  await expect(page.locator('h1')).toContainText('性格タイプ')

  // 10問回答
  for (let i = 1; i <= 10; i++) {
    await page.click(`[data-testid="tipi-${i}-4"]`) // 中央値を選択
  }

  await page.click('button:has-text("次へ")')

  // 結果表示確認
  await expect(page.locator('[data-testid="traits-chart"]')).toBeVisible()
  await page.click('button:has-text("ホームへ進む")')

  // 3. ホーム画面
  await expect(page).toHaveURL('/app')
  await expect(page.locator('h1')).toContainText('ホーム')

  // 4. チェックイン
  await page.click('button:has-text("チェックイン")')

  await page.click('[data-testid="mood-4"]') // 気分スコア 4
  await page.click('[data-testid="energy-high"]') // エネルギー高
  await page.fill('textarea[name="free_text"]', '今日は良い日でした')

  await page.click('button:has-text("送信")')

  // 介入メッセージ表示
  await expect(page.locator('[data-testid="intervention-message"]')).toBeVisible()
  await expect(page.locator('[data-testid="intervention-title"]')).not.toBeEmpty()

  // 5. 履歴確認
  await page.click('a:has-text("履歴")')
  await expect(page).toHaveURL('/app/history')

  await expect(page.locator('[data-testid="checkin-item"]')).toHaveCount(1)
  await expect(page.locator('[data-testid="intervention-item"]')).toHaveCount(1)
})
```

#### テストケース 2: エラーハンドリング

**ファイル:** `e2e/error-handling.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test('エラーハンドリング: バリデーションエラー', async ({ page }) => {
  // セットアップ: ログイン済み状態
  await page.goto('/app')

  // チェックイン画面を開く
  await page.click('button:has-text("チェックイン")')

  // テキストエリアに長文を入力（280文字超過）
  await page.fill('textarea[name="free_text"]', 'あ'.repeat(300))

  await page.click('button:has-text("送信")')

  // エラートースト表示確認
  await expect(page.locator('[data-testid="error-toast"]')).toBeVisible()
  await expect(page.locator('[data-testid="error-toast"]')).toContainText('280文字以内')
})

test('エラーハンドリング: セッション切れ', async ({ page, context }) => {
  await page.goto('/app')

  // セッションをクリア
  await context.clearCookies()

  // チェックイン試行
  await page.click('button:has-text("チェックイン")')

  // ログイン画面にリダイレクト
  await expect(page).toHaveURL('/login')
  await expect(page.locator('[data-testid="error-message"]')).toContainText('再度ログイン')
})
```

## 6. テストデータ

### 6.1 テストユーザー

```typescript
export const TEST_USERS = {
  user1: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test1@example.com',
  },
  user2: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'test2@example.com',
  },
}
```

### 6.2 モックデータ

**TIPI 回答:**

```typescript
export const MOCK_TIPI_ANSWERS = [
  { item: 'TIPI_1', value: 5 },
  { item: 'TIPI_2', value: 3 },
  // ... 残り8問
]
```

**チェックイン:**

```typescript
export const MOCK_CHECKIN = {
  mood_score: 4,
  energy_level: 'high',
  free_text: 'テスト用チェックイン',
}
```

## 7. テスト実行コマンド

### 7.1 全テスト実行

```bash
# バックエンド単体テスト
deno test --allow-net --allow-env supabase/functions/

# フロントエンド単体テスト
pnpm test

# E2E テスト
npx playwright test

# すべて実行
pnpm test:all
```

### 7.2 CI/CD 統合

**GitHub Actions ワークフロー例:**

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - run: deno test --allow-net --allow-env supabase/functions/

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

## 8. カバレッジ目標

| テストタイプ | 目標カバレッジ | 優先度 |
|--------------|----------------|--------|
| 単体テスト | 80% | 高 |
| 統合テスト | 60% | 中 |
| E2E テスト | クリティカルパスのみ | 高 |

## 9. テストレビューチェックリスト

- [ ] すべてのテストがパスする
- [ ] テストカバレッジが目標値以上
- [ ] クリティカルパスが E2E でカバーされている
- [ ] エラーケースがテストされている
- [ ] RLS ポリシーが正しく動作する
- [ ] フォールバック動作がテストされている

## 10. 変更履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2025-01-XX | 1.0.0 | 初版作成 |
