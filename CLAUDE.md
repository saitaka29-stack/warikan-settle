# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
割り勘精算アプリ「ワリカンスッキリ」。旅行・飲み会で複数人が立て替えた支払いを入力すると、
最小限の送金回数で清算できる「誰 → 誰：いくら」のリストを出す。
要件は `docs/requirements.md`、設計は `docs/plan.md` を正とする（機能追加・変更時はまずここを確認）。

## コマンド
- `npm run dev` — 開発サーバー（Vite）
- `npm run build` — 型チェック（`tsc -b`）＋本番ビルド（`dist/`）
- `npm run lint` — oxlint
- `npm test` — Vitest を 1 回実行
- 単一テスト: `npx vitest run src/lib/settle.test.ts -t "テスト名"`

## 技術スタック
React 19 + TypeScript + Vite。サーバー・DB なしの静的 SPA として Vercel にデプロイする。

## プロジェクト固有ルール
- **バックエンドを追加しない**。データはブラウザ内（localStorage と URL ハッシュ）だけで扱う。外部 API・解析タグも入れない。
- **計算ロジックは `src/lib/` の純粋関数に置く**。React コンポーネントには計算を書かない。`src/lib/` を変更したら必ずテストを追加・更新し `npm test` を通す。
- **金額は整数（円）で扱う**。小数を経由させない。端数は決定的なルールで配分し、各支払いの負担額の合計が支払額と必ず一致すること。
- メンバー・支払いは `id`（`crypto.randomUUID()`）で参照し、名前で参照しない（同名や改名に強くするため）。
- 保存データ／共有 URL の形式を変えるときは `version` を上げ、古い形式を読み込めるようにする。
- UI の文言は日本語。スマホ幅（375px）で崩れないことを確認する。
- コミット前に `npm run lint && npm test && npm run build` がすべて通ること。
