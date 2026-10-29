# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
割り勘精算アプリ「ワリカンスッキリ」。旅行・飲み会で複数人が立て替えた支払いを入力すると、
最小限の送金回数で清算できる「誰 → 誰：いくら」のリストを出す。
ペルソナは「幹事」（入力・管理する人）と「参加者」（共有リンクで自分の送金を確認する人）の 2 種。

機能追加・変更時はまず以下を確認する（要件・画面構成の正はここ）:
- `docs/requirements.md` — 要件定義書（T-06）。機能 ID（F-01〜）と Phase（MVP / v1.0 / v2.0）
- `docs/user-story-map.md` — ユーザーストーリーマップ（T-04）
- `docs/information-architecture.md` — サイトマップ・ページ一覧（T-05）
- `docs/plan-v1.0.md` — 現行の設計（`docs/plan.md` は MVP 時の設計で、履歴として残している）

## コマンド
- `npm run dev` — 開発サーバー（Vite）
- `npm run build` — 型チェック（`tsc -b`）＋本番ビルド（`dist/`）
- `npm run lint` — oxlint
- `npm test` — Vitest を 1 回実行
- 単一テスト: `npx vitest run src/lib/settle.test.ts -t "テスト名"`
- `npm run preview` — ビルド結果を確認（SPA フォールバックあり。`/events/...` の直アクセスも確認できる）

## 技術スタック
React 19 + TypeScript + Vite。サーバー・DB なしの静的 SPA として Vercel にデプロイする。

## アーキテクチャ
- 状態は `App.tsx` の `useReducer` 1 つ（`Store = { version: 2, events: EventData[] }`）。変更のたびに localStorage（`warikan-settle:v2`）へ保存。
  旧 MVP 形式（`warikan-settle:v1`）は `loadStore()` が「マイイベント」として移行する
- ルーティングはライブラリなし: `src/lib/route.ts`（純粋なパース）＋ `src/router.ts`（History API・`navigate`・`useRoute`）＋ `components/Link.tsx`。
  SPA なので `vercel.json` で全パスを `index.html` に rewrite している
  - `/` トップ ・ `/events/:id?tab=members|expenses|settle` イベント詳細 ・ `/share#s=…` 参加者用の閲覧ページ
  - タブ切り替えは `replace`（戻るボタンで一覧に戻る）
- 共有 URL はイベントを JSON → UTF-8 → base64url にして**ハッシュ**に入れる（サーバーに送られない）。`decodeShare` は旧 v1 形式も読む
- 精算済みは `EventData.settled` に送金キー `from>to:amount` で持つ。送金内容が変われば自然に一致しなくなり外れる（`summarize` で集計）
- 型名は DOM の `Event` と衝突しないよう `EventData` にしている

## プロジェクト固有ルール
- **バックエンドを追加しない**。データはブラウザ内（localStorage と URL ハッシュ）だけで扱う。外部 API・解析タグも入れない。
- **計算ロジックは `src/lib/` の純粋関数に置く**。React コンポーネントには計算を書かない。`src/lib/` を変更したら必ずテストを追加・更新し `npm test` を通す。
- **金額は整数（円）で扱う**。小数を経由させない。端数は決定的なルールで配分し、各支払いの負担額の合計が支払額と必ず一致すること。
- イベント・メンバー・支払いは `id`（`crypto.randomUUID()`）で参照し、名前で参照しない（同名や改名に強くするため）。id は reducer の外（呼び出し側）で生成して action に渡す。
- 保存データ／共有 URL の形式を変えるときは `version` を上げ、古い形式を読み込めるようにする（現行は v2。v1 の読み込みを壊さない）。
- 参加者用の `/share` は読み取り専用。編集 UI を置かない。
- UI の文言は日本語。スマホ幅（375px）で崩れないことを確認する。
- コミット前に `npm run lint && npm test && npm run build` がすべて通ること。
