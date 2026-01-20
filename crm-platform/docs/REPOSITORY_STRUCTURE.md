# リポジトリのファイル構成

このドキュメントは、ZenMapCRMリポジトリのファイル構成を説明します。

## 全体構成

```
CallSenderApp/                    # リポジトリのルート
├── crm-platform/                 # Next.js Webアプリケーション（メイン）
│   ├── src/                      # ⭐ Webアプリのコードはここにあります
│   │   ├── app/                  # Next.js App Router
│   │   ├── components/           # Reactコンポーネント
│   │   ├── features/             # 機能別モジュール
│   │   ├── lib/                  # ライブラリ・ユーティリティ
│   │   ├── workers/              # BullMQ Worker
│   │   └── ...
│   ├── package.json              # 依存関係とスクリプト
│   ├── Dockerfile                # Dockerイメージ定義
│   ├── railway.json              # Railway設定（Web App用）
│   ├── next.config.js            # Next.js設定
│   ├── tsconfig.json             # TypeScript設定
│   └── ...
├── list-tool/                    # 別のツール（Python）
├── src/                          # ルートレベルのsrc（別プロジェクト）
└── ...
```

## 重要なポイント

### ✅ Webアプリのコードの場所

**Webアプリのコードは `/crm-platform/src/` にあります。**

- ❌ ルートの `/src` ではありません
- ✅ `crm-platform/src/` です

### Railway設定との関係

Railwayでルートディレクトリを `crm-platform` に設定している場合：

1. Railwayは `crm-platform/` ディレクトリをルートとして扱います
2. `crm-platform/src/` が `src/` として認識されます
3. `crm-platform/package.json` が `package.json` として認識されます
4. `crm-platform/Dockerfile` が `Dockerfile` として認識されます

## ディレクトリの詳細

### crm-platform/src/

Next.js App Routerの標準構成：

```
src/
├── app/                          # Next.js App Router
│   ├── dashboard/               # ダッシュボードページ
│   │   ├── leads/               # リード管理
│   │   ├── projects/            # プロジェクト管理
│   │   ├── pricing/             # 料金プラン
│   │   └── ...
│   ├── api/                     # API Routes
│   ├── layout.tsx               # ルートレイアウト
│   └── page.tsx                 # ホームページ
├── components/                  # Reactコンポーネント
│   ├── ui/                      # Shadcn/UIコンポーネント
│   ├── layout/                  # レイアウトコンポーネント
│   └── ...
├── features/                    # 機能別モジュール
│   ├── scraper/                 # スクレイピング機能
│   └── ...
├── lib/                         # ライブラリ・ユーティリティ
│   ├── actions/                 # Server Actions
│   ├── db/                      # データベース（Drizzle ORM）
│   ├── queue/                   # BullMQ Queue
│   └── ...
├── workers/                     # BullMQ Worker
│   └── index.ts                 # Workerエントリーポイント
└── ...
```

### crm-platform/（ルート）

設定ファイルとビルド成果物：

```
crm-platform/
├── package.json                 # 依存関係とスクリプト
├── Dockerfile                   # Dockerイメージ定義
├── railway.json                 # Railway設定（Web App用）
├── next.config.js               # Next.js設定
├── tsconfig.json                # TypeScript設定
├── tailwind.config.ts           # Tailwind CSS設定
├── drizzle.config.ts            # Drizzle ORM設定
├── prisma/                      # Prismaスキーマ（レガシー）
├── drizzle/                     # Drizzle ORMマイグレーション
├── scripts/                     # スクリプト
└── docs/                        # ドキュメント
```

## Railway設定との対応

### Web App Service

- **ルートディレクトリ**: `crm-platform`
- **Dockerfile**: `crm-platform/Dockerfile` → Railwayでは `Dockerfile`
- **package.json**: `crm-platform/package.json` → Railwayでは `package.json`
- **Start Command**: `npm start`（`package.json`の`start`スクリプト）

### Worker Service

- **ルートディレクトリ**: `crm-platform`
- **Builder**: Railpack Default（自動検出）
- **Start Command**: `npm run start:worker`（`package.json`の`start:worker`スクリプト）
- **エントリーポイント**: `crm-platform/src/workers/index.ts` → Railwayでは `src/workers/index.ts`

## よくある質問

### Q: Webアプリのコードはどこにありますか？

A: **`crm-platform/src/`** にあります。ルートの `/src` ではありません。

### Q: Railwayでルートディレクトリを `crm-platform` に設定した場合、パスはどうなりますか？

A: Railwayは `crm-platform/` をルートとして扱うため：
- `crm-platform/src/` → `src/`
- `crm-platform/package.json` → `package.json`
- `crm-platform/Dockerfile` → `Dockerfile`

### Q: なぜルートディレクトリを設定する必要があるのですか？

A: リポジトリのルートには複数のプロジェクト（`crm-platform`, `list-tool`など）があるため、Railwayにどのディレクトリを使用するか指定する必要があります。

---

## 参考

- [Next.js - Project Structure](https://nextjs.org/docs/app/building-your-application/routing/colocating-files)
- [Railway - Root Directory](https://docs.railway.app/deploy/builds#root-directory)
