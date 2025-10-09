# Edge Functions 設計

Supabase Edge Functions（Deno）で実装する主要関数の役割と擬似コードを定義する。

## 1. 共通ユーティリティ
- `withAuth(handler)`  
  - ヘッダから JWT を抽出し、Supabase API (`createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization } } })`) でセッション検証。  
  - ユーザー ID (`user.id`) を `RequestContext` に注入。  
  - 未認証の場合は `401 Unauthorized` を返す。
- `validate(body, schema)`  
  - zod スキーマでリクエストボディを検証。  
  - 失敗時は `400 validation_error` を返す。
- `callOpenAI(promptPayload)`  
  - fetch で OpenAI Responses API を呼び出し、JSON Schema でパース。  
  - 呼び出し回数やレスポンス時間をログに記録。
- `selectRecentCheckins(userId, count)`  
  - 直近 `count` 件（デフォルト 3）を取得し、平均 mood を計算。
- `insertIntervention(params)`  
  - `interventions` へ挿入し、結果を返却。

## 2. `tipi-submit`
- **目的**: TIPI 回答の採点と保存。
- **擬似コード**
```ts
const schema = z.object({
  answers: z.array(z.object({
    item: z.string(),  // TIPI_1 .. TIPI_10
    value: z.number().int().min(1).max(7)
  })).length(10),
  administered_at: z.string().datetime()
});

export default withAuth(async (req, { userId, supabase }) => {
  const { answers, administered_at } = validate(await req.json(), schema);
  const scored = scoreTipi(answers);      // 逆転項目処理、各特性の平均算出
  const traitsP01 = toP01(scored);
  const traitsT = toTscore(traitsP01);

  await supabase.from('baseline_traits').insert({
    user_id: userId,
    traits_p01: traitsP01,
    traits_T: traitsT,
    administered_at
  });

  return jsonResponse({ traits_p01: traitsP01, traits_T: traitsT, instrument: 'tipi_v1', administered_at });
});
```
- **補足**
  - `scoreTipi` は固定配列で項目をマッピング。例: `TIPI_2` は逆転項目。
  - 再登録を許可しない場合は `select` して存在チェック後 `409` を返す。

## 3. `checkins`
- **目的**: 日次チェックインの保存と介入生成。
- **擬似コード**
```ts
const schema = z.object({
  mood_score: z.number().int().min(1).max(5),
  energy_level: z.enum(['low','mid','high']),
  free_text: z.string().max(280).optional()
});

export default withAuth(async (req, { userId, supabase }) => {
  const input = validate(await req.json(), schema);
  const { data: checkin, error } = await supabase.from('checkins')
    .insert({ user_id: userId, ...input })
    .select('id, created_at')
    .single();

  if (error) throw error;

  const traits = await fetchLatestTraits(supabase, userId);
  const recent = await selectRecentCheckins(supabase, userId, 3);
  const template = chooseTemplate({ traits, recentMoodAvg: recent.avg });
  const prompt = buildPrompt({ template, traits, recent, current: input });

  let message;
  try {
    message = await callOpenAI(prompt);
  } catch (err) {
    message = fallbackMessage(template);
  }

  const { data: intervention } = await supabase.from('interventions')
    .insert({
      user_id: userId,
      checkin_id: checkin.id,
      template_type: template.type,
      message_payload: { ...message, template_type: template.type },
      fallback: message.fallback
    })
    .select('id, template_type, message_payload, fallback')
    .single();

  return jsonResponse({ checkin, intervention: formatIntervention(intervention) });
});
```
- **テンプレート選択ロジック**
  - 平均 mood ≤ 2.5 → `compassion`
  - 2.5 < 平均 mood ≤ 3.5 → `reflection`
  - > 3.5 → `action`
  - TIPI の最小特性を CTA 文言生成のヒントに利用。

## 4. `checkins` GET
- **目的**: ページネーション付きで履歴取得。
```ts
export default withAuth(async (req, { supabase, userId }) => {
  const { searchParams } = new URL(req.url);
  const limit = clamp(parseInt(searchParams.get('limit') ?? '20'), 1, 100);
  const offset = clamp(parseInt(searchParams.get('offset') ?? '0'), 0, 1000);

  const { data } = await supabase.from('checkins')
    .select('id, mood_score, energy_level, free_text, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return jsonResponse({ items: data, next_offset: data.length === limit ? offset + limit : null });
});
```

## 5. `interventions` GET
- `checkins` GET と同様にページネーションを実装。`message_payload` から UI で使う `title/body/cta_text` を抽出して返す。

## 6. `intervention-feedback`
- **擬似コード**
```ts
const schema = z.object({ score: z.number().int().min(1).max(5) });

export default withAuth(async (req, { supabase, userId, params }) => {
  const { score } = validate(await req.json(), schema);
  const { id } = params; // ルートパラメータ

  const { data, error } = await supabase.from('interventions')
    .update({ feedback_score: score, feedback_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .is('feedback_score', null)
    .select('id')
    .single();

  if (error?.code === 'P0001') {
    return jsonResponse({ error: { code: 'already_rated', message: 'Feedback already submitted' } }, 409);
  }

  if (!data) {
    return jsonResponse({ error: { code: 'not_found', message: 'Intervention not found' } }, 404);
  }

  return jsonResponse({ status: 'ok' });
});
```

## 7. フォールバックテンプレート
- `fallbackMessage(template)` はテンプレートごとに用意した静的テキストを返す。
  ```ts
  const FALLBACK_TEMPLATES = {
    reflection: {
      title: '今日を振り返りましょう',
      body: '直近の気分に目を向けて、小さな気付きや変化を書き留めてみてください。',
      cta_text: '記録を 3 行書く'
    },
    action: { ... },
    compassion: { ... }
  };
  ```
- Edge Functions は OpenAI 失敗時に `fallback: true` をセットし、UI 側で表示するタグ（例: 「テンプレートメッセージ」）の制御に利用。

## 8. ロギング & 計測
- `console.log(JSON.stringify({...}))` で以下を記録:
  - OpenAI 呼び出しパラメータ（メタ情報のみ、ユーザー入力は含めない）
  - レイテンシ (`durationMs`)
  - エラー内容 (`errorCode`, `attempt`)
- 将来的に Supabase Logs → BigQuery 連携を見据え、JSON 形式で整形。

## 9. テスト方針
- 単体テスト: Deno.test を用いて `scoreTipi`, `chooseTemplate`, `buildPrompt` を検証。
- 結合テスト: Supabase エミュレータ上で `POST /checkins` → OpenAI をモックし、データベース挿入を確認。
- ローカルモック: `OPENAI_API_BASE_URL` を `.env` 上で差し替え、モックサーバーに JSON Schema レスポンスを返させる。
