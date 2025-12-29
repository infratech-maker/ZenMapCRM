# Shadcn/UI セットアップ手順

以下のコマンドを実行して、必要なShadcn/UIコンポーネントをインストールしてください：

```bash
cd crm-platform

# Shadcn/UIの初期化（初回のみ）
npx shadcn@latest init -y

# 必要なコンポーネントのインストール
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add sidebar
```

または、一度にインストール：

```bash
npx shadcn@latest add button input label card badge table sidebar
```

