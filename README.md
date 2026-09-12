# 郊外不動産投資ラボ(仮)

国土交通省「不動産情報ライブラリ」の公式データをもとに、AIが郊外エリアの不動産投資・賃貸経営に関する記事を自動生成し、公開するメディアサイトです。宅地建物取引士監修という切り口で、都心ではなく郊外・低価格帯に特化することで差別化を狙います。

## 全体の流れ

```
[国交省 不動産情報ライブラリ API]
        ↓ (実際の取引価格データ)
[scripts/generate-article.mjs]
        ↓ (Google Gemini APIが記事を自動生成)
[content/articles/*.json]
        ↓ (Next.jsが読み込み)
[公開サイト(トップページ・記事ページ)]
        ↓
[ASP経由のアフィリエイトリンクで収益化]
```

## セットアップ

記事生成にはGoogle Gemini API(無料枠・カード登録不要)を使用します。ローカルでOllamaを起動しておく必要はありません。

1. 不動産情報ライブラリのAPIキーを申請(個人・無料): https://www.reinfolib.mlit.go.jp/api/request/ (承認まで5営業日程度)
2. Gemini APIキーを取得(無料・カード登録不要): https://aistudio.google.com/apikey
3. (任意)Pexels APIキーを取得(無料・審査不要・カード登録不要。記事のイメージ写真に使用): https://www.pexels.com/api/
4. `.env.local` に取得したキーを設定:
   ```
   REINFOLIB_API_KEY=ここに取得したキー
   GEMINI_API_KEY=ここに取得したキー
   PEXELS_API_KEY=ここに取得したキー(任意。未設定でも記事は生成されます)
   ```
5. 依存パッケージのインストール(未実施の場合):
   ```bash
   npm install
   ```

## 記事の生成方法

APIキーが承認されたら、以下のようにエリアを指定して記事を生成します。

```bash
node scripts/generate-article.mjs --pref 13 --pref-name 東京都 --city 13211 --cityName 小平市 --year 2024
```

- `--pref`: 都道府県コード(東京都は13)
- `--city`: 市区町村コード(5桁。例: 小平市=13211)
- `--year`: 対象年(例: 2024)
- `--quarter`: 対象四半期(1〜4、省略可)

生成された記事は `content/articles/` にJSONファイルとして保存され、サイトに自動反映されます。

## サイトの確認

```bash
npm run dev
```

http://localhost:3000 でトップページ・記事一覧が確認できます。

## 市区町村コードの調べ方

`e-Stat`(政府統計の総合窓口)の[市区町村コード検索](https://www.e-stat.go.jp/municipalities/cities/areacodesearch)で調べられます。

## 今後やること

| 項目 | 内容 |
|---|---|
| 独自ドメインの取得・Vercelへの公開 | サイトを実際にインターネット上に公開する |
| 記事を複数エリア分生成 | 最低5〜10記事を用意してからASP審査に申請 |
| ASP(A8.net等)への登録・提携審査 | サイト公開後に申請 |
| アフィリエイトリンクの設置 | `components/AffiliateBanner.tsx` に実際のリンクを設置 |
| Google Search Console登録 | 検索結果に載せるための最低限の設定 |
