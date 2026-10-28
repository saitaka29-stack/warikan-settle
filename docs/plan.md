# 実装計画：割り勘精算アプリ「ワリカンスッキリ」

## Context
課題 1（オリジナルシステムを開発・公開・記事化）として、`docs/requirements.md` の要件を実装する。
旅行や飲み会の幹事が、複数人・複数回の立て替えを入力すると、最小限に近い送金回数で清算リストを出す。
ログイン・サーバーなしの静的 SPA で、Vercel に公開する。現状は Vite(React+TS) の初期テンプレートと CLAUDE.md のみ。

## 設計

### データモデル（`src/lib/types.ts`）
```ts
type Member  = { id: string; name: string }
type Expense = { id: string; title: string; amount: number /*整数円*/; payerId: string; participantIds: string[] }
type State   = { version: 1; members: Member[]; expenses: Expense[] }
```

### 計算ロジック（`src/lib/settle.ts`・純粋関数）
1. `splitAmount(amount, participantIds)` … `floor(amount / n)` を全員に配り、余り r 円を participantIds の先頭 r 人に +1（決定的・合計一致）
2. `calcBalances(state)` … メンバーごとに `paid`（立て替え合計）、`owed`（負担合計）、`balance = paid - owed` を返す。存在しないメンバー id は無視
3. `settle(balances)` … 貪欲法：債権者（balance>0）と債務者（<0）をそれぞれ額の大きい順に並べ、最大同士を相殺していく → 送金回数は最大 n-1 回。
   結果 `Transfer = { fromId, toId, amount }[]`
4. `formatSettlementText(state, transfers)` … LINE に貼る用のテキスト

### 保存・共有（`src/lib/storage.ts`）
- `localStorage` キー `warikan-settle:v1` に State を自動保存（try/catch で失敗しても動く）
- 共有 URL：`#s=` + base64url(JSON) を URL ハッシュに入れる（ハッシュなのでサーバーに送られない）
- 読み込み優先度：URL ハッシュ → localStorage → 空。`parseState` で形式チェック（不正なら null）

### UI（`src/App.tsx` + `src/components/`）
1 画面・縦スクロールの 3 セクション（スマホ優先、最大幅 640px）
1. **メンバー**（`MemberSection`）… 名前入力 → 追加、チップ表示で × 削除（支払いに使われている人は削除前に確認）
2. **支払い**（`ExpenseSection`）… 内容 / 金額 / 払った人（select）/ 対象メンバー（チェックボックス、既定は全員）→ 登録。一覧表示と削除
3. **精算結果**（`ResultSection`）… 合計金額、各人の収支（＋は受け取り・−は支払い）、「A → B：¥1,234」リスト、
   「結果をコピー」「共有URLをコピー」「全リセット」ボタン
- 状態管理は `useReducer` 1 つ（`src/lib/reducer.ts`）。変更のたびに localStorage 保存
- スタイルは `src/index.css` に CSS 変数でライト/ダーク両対応。テンプレの `App.css` と `assets/` は削除

### テスト（`src/lib/*.test.ts`・Vitest）
- splitAmount：1000 円 / 3 人 → 334,333,333、合計一致
- calcBalances：一部参加の支払い、残高合計が 0
- settle：送金後に全員 0 になる、送金回数 ≤ n-1、全員 0 なら空
- storage：encode → decode の往復、不正文字列で null

### 公開物
- `README.md` を書き換え（概要・スクショ・技術スタック・使い方・開発コマンド）
- スクショは Playwright（プリインストール済み）で `docs/screenshot.png` を撮影
- 記事下書き `docs/article.md`（誰のため / 技術スタック / 使った Claude Code 機能 / つまずき / URL）
- Vercel 設定：Vite プリセットで自動検出されるため `vercel.json` は不要

## 実装順
1. lib（types → settle → storage → reducer）＋テスト → `npm test`
2. UI コンポーネント・CSS
3. lint / build / Playwright で動作確認＋スクショ
4. README・記事・コミット

## 検証
- `npm run lint && npm test && npm run build` がすべて通る
- `npm run preview` を Playwright で開き、4 人・5 件の支払いを入力 → 精算リストが表示され、送金後の残高が全員 0 になることを確認
- 再読み込みで状態が残る / 共有 URL を新しいページで開くと同じ状態が再現される
- 375px 幅のスクショで横スクロールが出ないこと
