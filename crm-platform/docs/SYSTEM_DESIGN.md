# 統合CRMプラットフォーム システム設計書

> **最終更新日**: 2025-01-15  
> **バージョン**: 1.0.0

## 目次

1. [概要](#概要)
2. [アーキテクチャ概要](#アーキテクチャ概要)
3. [マルチテナント設計](#マルチテナント設計)
4. [組織階層設計](#組織階層設計)
5. [RBAC（ロールベースアクセス制御）設計](#rbacロールベースアクセス制御設計)
6. [データモデル](#データモデル)
7. [権限管理](#権限管理)
8. [ユーザー管理](#ユーザー管理)

---

## 概要

統合CRMプラットフォームは、マルチテナント対応のSaaS型CRMシステムです。複数のクライアント企業（テナント）が同一システムを利用し、それぞれ独立したデータと組織構造を管理できます。

### 主要機能

- **マルチテナント対応**: 複数の企業が同一システムを利用
- **組織階層管理**: 任意の深さの組織階層を効率的に管理
- **RBAC**: ロールベースのアクセス制御
- **データ分離**: テナント間のデータ完全分離

---

## アーキテクチャ概要

### システム構成

```
┌─────────────────────────────────────────────────────────┐
│                   統合CRMプラットフォーム                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  テナントA    │  │  テナントB    │  │  テナントC    │ │
│  │ (ZenMao Inc.)│  │ (Partner Co.)│  │  (Other...)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │          │
│         └─────────────────┼─────────────────┘          │
│                           │                            │
│                    ┌──────▼───────┐                    │
│                    │  共有データベース  │                    │
│                    │  (PostgreSQL)  │                    │
│                    └───────────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### データ分離戦略

- **Row Level Security (RLS) + tenant_id**: すべてのテーブルに`tenant_id`カラムを追加
- **アプリケーション層フィルタリング**: すべてのクエリで`tenant_id`によるフィルタリングを必須化
- **将来的なRLS有効化**: PostgreSQLのRow Level Securityを有効化し、データベース層での自動フィルタリングを実装予定

---

## マルチテナント設計

### テナント（Tenant）

テナントは、システムを利用する企業単位の概念です。

#### テナントテーブル構造

```typescript
model Tenant {
  id        String   @id @default(uuid())
  name      String   // テナント名（例: "ZenMao Inc."）
  slug      String   @unique // URL用スラッグ（例: "zenmao"）
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### テナントの特徴

- **完全なデータ分離**: 各テナントのデータは完全に分離される
- **独立した組織構造**: 各テナントは独自の組織階層を持つ
- **独立したロール・権限**: 各テナントは独自のロールと権限を定義可能
- **スラッグ（slug）**: URLやサブドメインでの識別に使用

#### テナントデータの例

| ID | Name | Slug | isActive |
|----|------|------|----------|
| uuid-1 | ZenMao Inc. | zenmao | true |
| uuid-2 | Demo Partner Corp. | demo-partner | true |

---

## 組織階層設計

### 組織（Organization）

組織は、テナント内の階層構造を表現する概念です。営業部、支店、代理店などの組織単位を管理します。

#### 組織テーブル構造

```typescript
model Organization {
  id        String           @id @default(uuid())
  tenantId  String           // テナントID（FK）
  name      String           // 組織名（例: "本社"）
  code      String?          // 組織コード（例: "ZENMAO-HQ"）
  type      OrganizationType // 組織タイプ（DIRECT, PARTNER_1ST, etc.）
  parentId  String?          // 親組織ID（FK）
  path      String?          // 階層パス（例: "/zenmao-hq"）
  level     Int              @default(0) // 階層レベル
  isActive  Boolean          @default(true)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
}
```

#### 組織タイプ（OrganizationType）

```typescript
enum OrganizationType {
  DIRECT      // 直営
  PARTNER_1ST // 1次代理店
  PARTNER_2ND // 2次代理店
  UNIT        // ユニット
  INDIVIDUAL  // 個人
}
```

#### 組織階層の例

```
ZenMao Inc. (テナント)
│
├─ 本社 (DIRECT, level: 0)
│  ├─ 営業部 (DIRECT, level: 1)
│  └─ マーケティング部 (DIRECT, level: 1)
│
└─ 1次代理店A (PARTNER_1ST, level: 0)
   └─ ユニット1 (UNIT, level: 1)
```

### Closure Table パターン

組織階層の効率的な管理のため、**Closure Table パターン**を採用しています。

#### 設計理由

- **問題**: 単純な`parent_id`による階層構造では、深い階層の集計時に再帰CTEが必要でパフォーマンスが劣化
- **解決策**: Closure Tableにより、任意の深さの階層を1回のJOINで取得可能

#### OrganizationClosure テーブル

```typescript
model OrganizationClosure {
  id           String   @id @default(uuid())
  tenantId     String   // テナントID（FK）
  ancestorId   String   // 祖先組織ID（FK）
  descendantId String   // 子孫組織ID（FK）
  depth        Int      // 距離（0 = 自己参照、1 = 直接の親子、2+ = 間接的）
  createdAt    DateTime @default(now())
}
```

#### Closure Table の例

組織A > 組織B > 組織C の場合:

| ancestor_id | descendant_id | depth | 説明 |
|-------------|---------------|-------|------|
| A | A | 0 | 自己参照 |
| A | B | 1 | Aの直接の子 |
| A | C | 2 | Aの孫 |
| B | B | 0 | 自己参照 |
| B | C | 1 | Bの直接の子 |
| C | C | 0 | 自己参照 |

#### クエリ例

**直営配下の全組織を取得:**
```sql
SELECT o.*
FROM organizations o
INNER JOIN organization_closure oc ON o.id = oc.descendant_id
WHERE oc.ancestor_id = '直営組織ID'
  AND oc.depth > 0;  -- 自分自身を除外
```

**1次代理店配下の全ユニットの売上合計:**
```sql
SELECT SUM(pl.amount)
FROM pl_records pl
INNER JOIN organization_closure oc ON pl.organization_id = oc.descendant_id
WHERE oc.ancestor_id = '1次代理店ID'
  AND oc.depth > 0
  AND pl.item_type = 'revenue';
```

---

## RBAC（ロールベースアクセス制御）設計

### 基本概念

RBACは、**ロール（Role）**と**権限（Permission）**の組み合わせでアクセス制御を実現します。

```
ユーザー → ロール → 権限 → リソース
```

### ロール（Role）

ロールは、ユーザーに割り当てられる権限の集合です。

#### ロールテーブル構造

```typescript
model Role {
  id           String   @id @default(uuid())
  tenantId     String   // テナントID（FK）
  name         String   // ロール名（例: "Super Admin"）
  description  String?  // 説明
  isSystemRole Boolean  @default(false) // システムロールかどうか
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### 標準ロール（3階層）

1. **Super Admin（スーパー管理者）**
   - 全ての権限を持つ
   - テナント全体の管理が可能
   - システム設定の変更が可能

2. **Org Admin（組織管理者）**
   - 組織管理に必要な権限
   - 自分の組織（および配下組織）のユーザー・顧客・取引を管理
   - 組織内のデータの閲覧・作成・更新が可能

3. **User（一般ユーザー）**
   - 基本的な閲覧・作成権限のみ
   - Lead、Customer、Dealの閲覧・作成が可能
   - 更新・削除権限は制限される

### 権限（Permission）

権限は、リソースに対する操作を定義します。

#### 権限テーブル構造

```typescript
model Permission {
  id                 String   @id @default(uuid())
  tenantId           String   // テナントID（FK）
  resource           String   // リソース名（例: "Lead", "Customer"）
  action             String   // アクション（例: "read", "create", "update", "delete"）
  description        String?  // 説明
  isSystemPermission Boolean  @default(false) // システム権限かどうか
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

#### リソースとアクション

**リソース（Resource）:**
- Lead（リード）
- Customer（顧客）
- User（ユーザー）
- Deal（取引）
- Organization（組織）
- Product（製品）
- KpiRecord（KPI記録）
- PlRecord（PL記録）
- Simulation（シミュレーション）
- ScrapingJob（スクレイピングジョブ）

**アクション（Action）:**
- `read`: 閲覧権限
- `create`: 作成権限
- `update`: 更新権限
- `delete`: 削除権限

#### 権限の命名規則

権限は `{resource}:{action}` の形式で表現されます。

例:
- `Lead:read` - リードの閲覧権限
- `Customer:create` - 顧客の作成権限
- `User:update` - ユーザーの更新権限
- `Organization:delete` - 組織の削除権限

### ロールと権限の関連

#### RolePermission テーブル

```typescript
model RolePermission {
  id           String   @id @default(uuid())
  roleId       String   // ロールID（FK）
  permissionId String   // 権限ID（FK）
  tenantId     String   // テナントID（FK）
  createdAt    DateTime @default(now())
}
```

#### ロール別の権限設定

**Super Admin:**
- 全てのリソースに対して全てのアクション権限
- 例: `Lead:read`, `Lead:create`, `Lead:update`, `Lead:delete`, `Customer:read`, ...

**Org Admin:**
- 組織管理に必要な権限
- 例: `Organization:read`, `Organization:create`, `Organization:update`, `User:read`, `User:create`, `User:update`, `Customer:read`, `Customer:create`, `Customer:update`, `Deal:read`, `Deal:create`, `Deal:update`

**User:**
- 基本的な閲覧・作成権限のみ
- 例: `Lead:read`, `Lead:create`, `Customer:read`, `Customer:create`, `Deal:read`, `Deal:create`

---

## データモデル

### ER図（主要テーブル）

```
┌──────────┐
│  Tenant  │
└────┬─────┘
     │
     ├─────────────────┬─────────────────┬─────────────────┐
     │                 │                 │                 │
┌────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│  User    │    │Organization │   │   Role      │   │ Permission  │
└────┬─────┘    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
     │                 │                 │                 │
     │                 │                 │                 │
┌────▼─────────┐ ┌────▼──────────┐ ┌────▼──────────┐ ┌────▼──────────┐
│UserOrganization│ │OrganizationClosure│ │  UserRole   │ │RolePermission│
└───────────────┘ └─────────────────┘ └──────────────┘ └───────────────┘
```

### 主要テーブルの関係

1. **Tenant（テナント）**
   - すべてのテーブルのルート
   - テナントごとにデータが分離される

2. **User（ユーザー）**
   - テナントに属する
   - 複数の組織に所属可能（UserOrganization）
   - 複数のロールを持つ可能（UserRole）

3. **Organization（組織）**
   - テナントに属する
   - 階層構造を持つ（parent_id, OrganizationClosure）

4. **Role（ロール）**
   - テナントに属する
   - 複数の権限を持つ（RolePermission）

5. **Permission（権限）**
   - テナントに属する
   - リソースとアクションの組み合わせ

### ユーザーと組織の関係

#### UserOrganization テーブル

```typescript
model UserOrganization {
  id             String   @id @default(uuid())
  userId         String   // ユーザーID（FK）
  organizationId String   // 組織ID（FK）
  tenantId       String   // テナントID（FK）
  isPrimary      Boolean  @default(false) // 主所属かどうか
  roleInOrg      String?  // 組織内での役割（例: "manager", "member"）
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### 特徴

- **複数所属**: 1人のユーザーは複数の組織に所属可能
- **主所属**: `isPrimary`フラグで主所属を指定
- **組織内役割**: `roleInOrg`で組織内での役割を管理（例: "manager", "member"）

### ユーザーとロールの関係

#### UserRole テーブル

```typescript
model UserRole {
  id         String    @id @default(uuid())
  userId     String    // ユーザーID（FK）
  roleId     String    // ロールID（FK）
  tenantId   String    // テナントID（FK）
  assignedBy String?   // 割り当てたユーザーID（FK）
  expiresAt  DateTime? // 有効期限（null = 無期限）
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

#### 特徴

- **複数ロール**: 1人のユーザーは複数のロールを持つ可能
- **有効期限**: `expiresAt`でロールの有効期限を管理
- **割り当て履歴**: `assignedBy`で誰が割り当てたかを記録

---

## 権限管理

### 権限チェックの流れ

```
1. ユーザーがアクションを実行
   ↓
2. セッションからユーザー情報を取得
   ↓
3. ユーザーのロールを取得（UserRole）
   ↓
4. ロールの権限を取得（RolePermission）
   ↓
5. 必要な権限（例: "Lead:read"）が含まれているかチェック
   ↓
6. 権限があれば実行、なければエラー
```

### 権限チェックの実装例

```typescript
// セッションからユーザー情報を取得
const session = await auth();
const permissions = session.user.permissions; // ["Lead:read", "Lead:create", ...]

// 権限チェック
if (!permissions.includes("Lead:read")) {
  throw new Error("Access denied: Insufficient permissions");
}
```

### 組織スコープの権限

**Org Admin**や**User**ロールの場合、自分の組織（および配下組織）のデータのみアクセス可能です。

```typescript
// 自分の組織と配下組織のIDを取得
const descendantOrgs = await prisma.organizationClosure.findMany({
  where: {
    tenantId: session.user.tenantId,
    ancestorId: session.user.organizationId,
  },
  select: {
    descendantId: true,
  },
});

const orgIds = [session.user.organizationId, ...descendantOrgs.map(o => o.descendantId)];

// 組織スコープでデータを取得
const leads = await prisma.lead.findMany({
  where: {
    tenantId: session.user.tenantId,
    organizationId: {
      in: orgIds,
    },
  },
});
```

---

## ユーザー管理

### ユーザー作成フロー

```
1. 管理者が「ユーザー新規登録」モーダルを開く
   ↓
2. 以下を入力:
   - メールアドレス
   - ユーザー名
   - パスワード
   - ロール
   - 組織（オプション）
   ↓
3. サーバーで以下を実行:
   - パスワードをハッシュ化（bcryptjs）
   - Userレコードを作成
   - UserOrganizationレコードを作成（組織が指定されている場合）
   - UserRoleレコードを作成
   ↓
4. ユーザーが即座にログイン可能な状態（isActive: true）で作成される
```

### ユーザーテーブル構造

```typescript
model User {
  id           String    @id @default(uuid())
  tenantId     String    // テナントID（FK）
  email        String    // メールアドレス（テナント内でユニーク）
  passwordHash String    // パスワードハッシュ（bcryptjs）
  name         String    // ユーザー名
  phoneNumber  String? // 電話番号（オプション）
  avatarUrl    String?   // アバターURL（オプション）
  isActive     Boolean   @default(true) // アクティブかどうか
  lastLoginAt  DateTime? // 最終ログイン日時
  managerId    String?   // 上長のユーザーID（FK）
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### ユーザーの階層関係

ユーザーは`managerId`により、上長・部下の関係を表現できます。

```
Master Admin (managerId: null)
  └─ General User (managerId: Master AdminのID)
```

---

## まとめ

### 設計の特徴

1. **マルチテナント対応**: 複数の企業が同一システムを利用可能
2. **柔軟な組織階層**: Closure Tableパターンにより、任意の深さの階層を効率的に管理
3. **RBAC**: ロールベースのアクセス制御により、細かい権限管理が可能
4. **データ分離**: テナント間のデータ完全分離
5. **拡張性**: 新しいロールや権限を容易に追加可能

### 今後の拡張可能性

- **カスタムロール**: テナントごとに独自のロールを定義可能
- **カスタム権限**: テナントごとに独自の権限を定義可能
- **組織タイプの拡張**: 新しい組織タイプを追加可能
- **RLS有効化**: PostgreSQLのRow Level Securityを有効化し、データベース層での自動フィルタリングを実装

---

## 参考資料

- [Prisma Schema](./prisma/schema.prisma)
- [シードデータ](./prisma/seed.ts)
- [マルチテナント設計](./MULTITENANT.md)
- [組織階層設計](./DESIGN.md)
- [アカウント管理ER図](./ACCOUNT_MANAGEMENT_ER.md)
