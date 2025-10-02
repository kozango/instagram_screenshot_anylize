# Instagram Screenshot Tool

Instagramの公開プロフィールからフルページスクリーンショットを取得するツール

## 機能

- ログイン不要（公開プロフィールのみ対象）
- 「続きを読む」ボタンを自動展開
- フルページスクリーンショット取得
- Cookie同意・ログインモーダルの自動処理

## セットアップ

```bash
npm install
npx playwright install chromium
```

## 使い方

```bash
node ig_capture.cjs <InstagramプロフィールURL>
```

### 実行例

```bash
node ig_capture.cjs https://www.instagram.com/instagram/
node ig_capture.cjs https://www.instagram.com/natgeo/
```

## 出力

- 保存先: `./out/ig_<ユーザー名>_<ISO時刻>.png`
- 成功時: `SAVED <ファイルパス>` を標準出力
- 失敗時: `ERROR ...` を出力して終了コード2

## 必要環境

- Node.js 18以上
- macOS / Linux / Windows

## 技術スタック

- Playwright (Chromium)
- Node.js (CommonJS)
