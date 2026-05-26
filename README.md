# しぶんノート

高校生活の毎日を記録・振り返りできるデジタルしぶんノートアプリです。
PWA対応で、スマホのホーム画面に追加して使用することを前提としています。

## 特徴
- 毎日の気分や良かったこと、大変だったことを手軽に記録。
- 時間割PDFをアップロードすると自動でGoogle Gemini AIがパースし、日々の時間割を自動生成。
- firebase-authenticationによる安全なGoogleログイン。
- Firestoreを活用した自分だけが見れるセキュアなデータベース。
- スマホ向けに作られた紙/手帳の様なやわらかいUIデザイン。

## AI Studio上の動作
デフォルトでVite+Expressのフルスタック環境で動作しています。

## Firebase の設定について
この環境では `firebase-applet-config.json` に設定がされており、AI Studio上のFirestore（Enterprise Edition）を使用しています。

## Vercelへのデプロイについて
当プロジェクトを Vercelにそのままデプロイする場合は、以下の設定を行ってください。

1. **Vercelにリポジトリをインポートする**
   AI Studioのエクスポート機能などを使ってソースをGitHubなどのリポジトリに展開し、Vercelへ連携します。

2. **環境変数の設定**
   Vercelのプロジェクト設定画面（Settings -> Environment Variables）にて以下の環境変数を設定してください。
   - `GEMINI_API_KEY`: PDFパースに使用するGemini APIのキー

3. **VercelのAPI機能**
   このプロジェクトの `server.ts` はVercelのServerless Functionsとしてはそのまま動作しません（Expressを利用しているため）。Vercelにデプロイする専用にするには、`server.ts` の内容を `api/` ディレクトリ内にVercel用のFunctions形式（`req, res`をexport defaultする形）に書き換える必要があります。
   例: `/api/parse-schedule-pdf.js` というファイルを用意して、`gemini-3.5-flash`を使ったPDFパース機能をServerless Functionとして動かします。

4. **ビルドコマンドと出力ディレクトリ**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   フロントエンドのみの静的サイトとして機能する場合は特別なバックエンド設定は必要ありませんが、PDF解析エンドポイント(`/api/parse-schedule-pdf`)はVercel Functionsで実装し直すとより素直に動作します。
