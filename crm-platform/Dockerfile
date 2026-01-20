# Playwrightベースイメージを使用（Node.jsとブラウザが含まれている）
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール（Clean install）
RUN npm ci

# アプリケーションコードをコピー
COPY . .

# Prismaクライアントを生成（ビルド前に必要）
RUN npx prisma generate

# Next.jsのテレメトリーを無効化
ENV NEXT_TELEMETRY_DISABLED=1

# ビルドを実行
RUN npm run build

# ポートを公開（Railwayが自動的にPORT環境変数を設定）
EXPOSE ${PORT:-3000}

# デフォルトコマンド（Webサーバー起動）
CMD ["npm", "start"]
