# 実装ロードマップ

## 1. 開発フェーズ概要
| フェーズ | 期間 | 目的 |
|----------|------|------|
| Phase 0 | Week 1 | 開発環境とベーススキーマ準備、UI ラフ作成 |
| Phase 1 | Week 2 | 認証とオンボーディング (TIPI) |
| Phase 2 | Week 3 | チェックイン & 介入生成フロー |
| Phase 3 | Week 4 | 履歴/評価・メトリクス |
| Phase 4 | Weeks 5-6 | 内部テスト、改善 |
| Phase 5 | Weeks 7-8 | パイロット運用、サポート体制整備 |

## 2. Phase 別タスクリスト

### Phase 0: セットアップ
- [ ] Supabase プロジェクト作成、CLI 導入、`supabase start` でローカル環境確認。
- [ ] `supabase/config.toml` に対象 Edge Functions を定義。
- [ ] 初期マイグレーション作成 (`supabase migration new init_schema`)。
- [ ] Next.js プロジェクト雛形作成 (`create-next-app --ts`)。
- [ ] UI ラフ（Figma or FigJam）で主要画面を描画。
- [ ] OpenAI API キー取得、テストクレジット確認。

### Phase 1: 認証 / オンボーディング
- [ ] Supabase Auth をメールリンクモードで設定。
- [ ] フロントエンドにログインページを実装 (`supabase.auth.signInWithOtp`)。
- [ ] `tipi-submit` Edge Function 実装・デプロイ。
- [ ] TIPI フォーム UI 実装、zod で入力検証。
- [ ] TIPI 結果表示（レーダーチャート）を実装。
- [ ] Onboarding 完了後にホームへ遷移させるルーティング設定。

### Phase 2: チェックイン & 介入生成
- [ ] `checkins` Edge Function 実装（OpenAI 呼び出し含む）。
- [ ] テンプレート／プロンプトロジック実装・ユニットテスト。
- [ ] クライアント側にチェックインモーダルを実装。
- [ ] Mutation 成功時のローディング、フォールバック表示を実装。
- [ ] OpenAI レート制御とフォールバックテンプレートをテスト。

### Phase 3: 履歴 / 評価
- [ ] `GET /checkins`・`GET /interventions` エンドポイント実装。
- [ ] ページネーション付き履歴 UI、メッセージ評価コンポーネントを実装。
- [ ] `POST /interventions/:id/feedback` Edge Function 実装。
- [ ] React Query キャッシュ戦略・データフェッチングを仕上げる。
- [ ] Supabase SQL で日次メトリクス（チェックイン数、平均評価）を集計するビューを作成。

### Phase 4: 内部テスト
- [ ] Playwright で E2E テストシナリオ（TIPI→チェックイン→履歴）を作成。
- [ ] Supabase Edge Functions のログ整備、アラートルール策定。
- [ ] セキュリティレビュー（環境変数、RLS ポリシーの動作確認）。
- [ ] テストユーザー 3 名程度でフィードバックを収集、改善点を Issue 化。

### Phase 5: パイロット運用
- [ ] 5〜10 名のユーザーを招待、オンボーディングサポート。
- [ ] 週次で指標（継続率、評価平均）を Sheets へ出力・レビュー。
- [ ] Slack グループでサポート体制を整備、ホーム UI にお知らせ欄を設置。
- [ ] フィードバックをもとに改善計画（Phase 6）を策定。

## 3. リソース計画
- **担当割り当て（例）**
  - フロントエンド: Onboarding / ホーム / 履歴
  - バックエンド: Edge Functions / データモデリング / OpenAI 連携
  - プロダクト: ユーザーリクルーティング、定性フィードバック整理
- **ミーティング**
  - キックオフ + 週次スタンドアップ (30min)
  - Phase 完了ごとにレトロ (45min)
  - パイロット期間は週 2 回ステータス共有

## 4. リスクと対応
| リスク | 影響 | 対策 |
|--------|------|------|
| OpenAI レスポンス遅延 | ユーザー体験低下 | タイムアウトを 8 秒に設定、フォールバック即時表示 |
| Supabase RLS 設定漏れ | 情報漏洩 | デプロイ前に PostgREST 経由でアクセス制御テスト |
| パイロット参加者が利用を継続しない | データ不足 | リマインダー施策、Slack での伴走 |
| 開発リソース不足 | スケジュール遅延 | 機能優先順位を明確化（履歴タブ > メトリクス） |

## 5. 成果物チェックリスト
- [ ] `docs/design` 以下の資料に沿った実装が完了している。
- [ ] `supabase/migrations` が最新。`supabase status` で差分がない。
- [ ] OpenAI API キーが環境変数で設定済み。
- [ ] テスト (`pnpm test`, `playwright test`) がパスしている。
- [ ] README にセットアップ手順と `.env.example` を記載。
- [ ] パイロット用のアンケートフォーム（Google Form 等）を用意。
