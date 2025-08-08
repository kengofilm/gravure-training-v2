# gravure-training v2 (GitHub Pages)
- すべて**静的ファイル**。`/data/*.json` を `app.js` が fetch します。
- 置き場所は**同一リポジトリ**、Pages は **main / root** 想定。

## ファイル
- `index.html` / `styles.css` / `app.js`
- `data/questions.json` / `data/glossary.json` / `data/handbook.json`
- （任意）`data/extra_questions.json` / `data/extra_glossary.json`

## 更新時のキャッシュ対策
- `?v=20250808` をURL末尾に付けるか、`app.js` 内の fetch に付いている `?v=20250808` を更新。

## 動作確認URL（例）
https://<user>.github.io/<repo>/?v=20250808
