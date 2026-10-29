# 実装計画 v1.0：T-04〜T-06 を反映した「ワリカンスッキリ」の見直し

## Context
MVP（1画面・1イベント・幹事だけが使う）は実装済み。T-04〜T-06 の成果物
（`docs/user-story-map.md` / `docs/information-architecture.md` / `docs/requirements.md`）で次のように見直したので、それを実装する。
- ペルソナを **幹事** と **参加者** の 2 種に分けた → 参加者用の閲覧ページ（`/share`）を追加
- サイトマップを **トップ → イベント詳細 → タブ** の 3 層にした → 複数イベントとページ遷移を追加
- v1.0 機能：イベント作成/一覧/削除・名前変更・支払い編集・精算済みチェック・取り込み・共有シート・旧データ引き継ぎ（F-10〜F-17）
- 方針は変えない：サーバーなし・ログインなし・金額は円の整数・計算は `src/lib` の純粋関数＋テスト

## 1. データモデル（`src/lib/types.ts`）
```ts
type Event = { id; name; createdAt: number; members: Member[]; expenses: Expense[]; settled: string[] }
type Store = { version: 2; events: Event[] }          // localStorage 'warikan-settle:v2'
type SharePayload = { version: 2; event: Event }       // 共有 URL の中身
```
- `settled` には送金キー `"fromId>toId:amount"` を入れる。支払いが変わって送金内容が変わると、キーが一致しなくなり**自動でチェックが外れる**（F-13）
- `Member` / `Expense` / `Balance` / `Transfer` はそのまま流用

## 2. ロジック（`src/lib/`・すべて純粋関数＋テスト）
- `settle.ts`：既存の `splitAmount` / `calcBalances` / `settle` / `formatSettlementText` / `yen` を再利用（引数を `State` → `{members, expenses}` 型に一般化）。追加：
  - `transferKey(t)`、`summarize(event)` → `{ total, transfers, settledCount, done }`（一覧と精算タブで共用）
- `storage.ts`：
  - `loadStore()`：v2 があれば読む。なければ v1（`warikan-settle:v1`）を読んで、中身があれば「マイイベント」1 件に変換（F-17）
  - `saveStore()`、`buildShareUrl(event, origin)` → `${origin}/share#s=…`
  - `decodeShare(hash)`：v2 payload と旧 v1 State の両方を受け付けて `Event` を返す。`parseState` は `parseEvent` に拡張
- `reducer.ts`：Store 全体の reducer に変更
  - イベント：`createEvent{id,name}` / `renameEvent` / `deleteEvent` / `importEvent{event}`（同じ id は上書き）
  - イベント内：`addMember` / `renameMember` / `removeMember` / `addExpense` / `updateExpense` / `removeExpense` / `toggleSettled{key}`（すべて `eventId` 付き）
  - id は呼び出し側で `crypto.randomUUID()` を生成して渡す（作成直後に遷移するため）
- `route.ts`：`parseRoute(pathname, search)` → `{page:'top'} | {page:'event', id, tab} | {page:'share'}`。tab は `members|expenses|settle`、不正値は `members`

## 3. ルーティング・画面
- ライブラリは使わず `src/useRoute.ts`（`history.pushState` + `popstate` を購読するフック）と `navigate(path)`、`<Link>`
- `vercel.json`：`{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`（`vite preview` は既定で SPA フォールバックあり）
- `App.tsx`：Store を `useReducer` で持ち、変更ごとに `saveStore`。ルートに応じてページを出し分ける。存在しないイベントや URL はトップへ `replace`

| ページ | ファイル | 中身 |
|---|---|---|
| トップ `/` | `pages/TopPage.tsx` | 見出し＋使い方 3 ステップ、「新しいイベント」フォーム（名前→作成→メンバータブへ）、イベントカード一覧（名前・人数・合計・精算状況バッジ）、削除（確認あり） |
| イベント詳細 `/events/:id?tab=` | `pages/EventPage.tsx` | 「← イベント一覧」、イベント名（タップで編集）、タブ 3 つ（各タブに件数バッジ） |
| └ メンバー | `components/MemberTab.tsx` | 既存 `MemberSection` を移設＋名前変更（チップをタップで編集） |
| └ 支払い | `components/ExpenseTab.tsx` | 既存 `ExpenseSection` を移設＋「編集」でフォームに読み込み → 「更新」/「キャンセル」 |
| └ 精算 | `components/SettleTab.tsx` | 既存 `ResultSection` を移設＋送金カードごとの精算済みチェック、「精算完了 🎉」表示、共有ボタン（`navigator.share` があれば共有シート、なければ URL コピー）、結果コピー |
| 共有ビュー `/share#s=` | `pages/SharePage.tsx` | 読み取り専用。「あなたは誰？」の名前ボタン → 自分の送金（払う/受け取る）を大きく表示＋金額コピー、全体の送金リスト、支払い明細、「自分の端末に取り込む」（同じ id があれば上書き確認）→ イベント詳細へ。不正なリンクはエラー表示＋トップへのリンク |

- 共通 UI（`Toast`、`useToast`）は `components/` に切り出し、既存の CSS（`index.css`）にページ用のスタイルを追加
- 共有 URL を知っている人は内容を見られることを、共有ボタンの近くに一文で明記

## 4. テスト（Vitest）
- `route.test.ts`：各 URL のパース、不正 tab
- `storage.test.ts`：v1 → v2 の移行、v2/v1 の共有 URL を両方復元、不正入力は null、日本語の往復
- `reducer.test.ts`：createEvent/deleteEvent、updateExpense、removeMember の連鎖、toggleSettled、importEvent の上書き
- `settle.test.ts`：既存テスト＋`summarize`（支払い変更で精算済みが外れる）

## 5. ドキュメント・コミット
- `docs/plan-v1.0.md` にこの計画を保存（MVP の `docs/plan.md` は残す）
- `CLAUDE.md`：資料一覧（T-04〜T-06）、ルーティング方式、保存形式 v2 を追記
- `README.md`：ページ構成・新機能・スクショ（トップ / 精算タブ / 共有ビュー / ダーク）
- `docs/article.md`：「T-04〜T-06 で要件を見直した」節と、つまずきポイントを追記
- 区切りごとにコミット（lib＋テスト → 画面 → ドキュメント）

## 6. 検証
- `npm run lint && npm test && npm run build`
- `vite preview` を Playwright で操作：
  1. 旧 v1 データを localStorage に入れて開く → 「マイイベント」として一覧に出る
  2. トップでイベント作成 → メンバー 4 人 → 支払い 5 件（一部割り・編集を含む）→ 精算タブで送金リスト表示
  3. 精算済みチェック → 一覧のバッジに反映 → 支払いを変えるとチェックが外れる
  4. 共有 URL を別コンテキストで開く → 名前を選ぶ → 自分の送金が出る → 取り込むとイベント詳細へ
  5. 直接 `/events/xxx` や存在しない URL → トップへ。再読み込み・戻るボタンでタブ状態が保たれる
  6. 375px で横スクロールなし、ダークモードの表示
- 各画面のスクショを `docs/` に保存
