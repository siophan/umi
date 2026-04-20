# 部署说明

最后更新：2026-04-20

本文档说明当前 `umi/` 工作区的推荐部署方式。

当前目标不是定义“理想化云原生体系”，而是给出一套基于当前仓库现状、能稳定落地的部署方案。

## 当前结论

当前推荐拓扑：

- 外部 `Nginx`
- 外部 `MySQL`
- `apps/api` 独立运行
- `apps/web` 独立运行
- `apps/admin` 构建成静态文件，由外部 `Nginx` 托管

不推荐的形态：

- 不建议把 `web + api + admin` 塞进一个容器
- 不建议在当前阶段为了“统一部署”引入一个容器内多进程管理
- 不建议把 `admin` 当成需要常驻进程的服务

原因：

1. `apps/api` 是 Express 服务，需要独立 Node 进程。
2. `apps/web` 是 Next.js 服务，需要独立 Node 进程。
3. `apps/admin` 是 Vite 静态产物，构建后不需要常驻 Node。
4. 三者生命周期、日志、重启策略不同，硬塞到一个容器里只会增加维护成本。

## 当前仓库形态

当前仓库是 `pnpm workspace + turbo` monorepo：

- `apps/api`
- `apps/web`
- `apps/admin`
- `packages/shared`
- `packages/db`
- `packages/config`

相关事实来源：

- 根脚本：[package.json](package.json)
- API 启动脚本：[apps/api/package.json](apps/api/package.json)
- Web 启动脚本：[apps/web/package.json](apps/web/package.json)
- Admin 构建脚本：[apps/admin/package.json](apps/admin/package.json)

## `packages/*` 的角色

部署时要区分“运行单元”和“构建依赖”。

### 运行单元

当前真正对外运行的是：

- `apps/api`
- `apps/web`
- `apps/admin`

其中：

- `apps/api` 是服务进程
- `apps/web` 是服务进程
- `apps/admin` 是静态产物来源

### 构建依赖

`packages/*` 当前不是独立部署服务，但它们仍然是 monorepo 的一部分，不能在构建时丢掉。

当前角色划分：

- `packages/shared`
  共享类型、状态枚举、接口契约，`api / web / admin` 都会直接依赖
- `packages/config`
  工程配置资产，不作为独立运行服务
- `packages/db`
  数据库 SQL 和相关资产，不作为独立运行服务

结论：

1. 不需要把 `packages/shared`、`packages/config`、`packages/db` 单独起容器。
2. 但无论源码直部署还是 Docker 构建，workspace 必须保留完整 monorepo 上下文。
3. 不要只拷 `apps/api` 或 `apps/web` 单目录去构建镜像，否则 workspace 依赖会丢失。

如果后续补 Dockerfile，构建上下文默认应指向仓库根目录 `umi/`，而不是单个 `apps/*` 目录。

## 推荐部署拓扑

### 生产拓扑

- `api.example.com` -> 反向代理到 `apps/api`
- `www.example.com` -> 反向代理到 `apps/web`
- `admin.example.com` -> 外部 `Nginx` 直接托管 `apps/admin/dist`
- `MySQL` -> 外部数据库实例

### 进程建议

- `apps/api`：1 个独立 Node 进程
- `apps/web`：1 个独立 Node 进程
- `apps/admin`：无常驻进程，只有静态文件

## Docker 建议

如果后续使用 Docker，当前建议的拆分是：

- `api` 一个容器
- `web` 一个容器
- `admin` 不做运行容器，只产出静态文件

不建议：

- 一个容器同时跑 `api + web + admin`
- 为了单容器运行再引入 `pm2`、`supervisord`、多进程 entrypoint

如果未来必须容器化，优先接受：

1. 外部 `Nginx`
2. 外部 `MySQL`
3. `api` 镜像
4. `web` 镜像
5. `admin` 构建后上传到 `Nginx` 站点目录

## 环境变量

环境变量模板见：

- [.env.example](.env.example)

当前运行时会从工作区根目录读取 `.env.local` 和 `.env`。

API 环境变量入口：

- [apps/api/src/env.ts](apps/api/src/env.ts)

建议生产环境至少配置：

```env
NODE_ENV=production

# apps/api
PORT=4000
DATABASE_URL=mysql://joy:strong_password@127.0.0.1:3306/joy_prod
SMS_CODE_PEPPER=replace_this
ADMIN_TOKEN_SECRET=replace_this
LOG_LEVEL=info
CORS_ORIGINS=https://www.example.com,https://admin.example.com

# apps/web
NEXT_PUBLIC_API_BASE_URL=https://api.example.com

# apps/admin
VITE_API_BASE_URL=https://api.example.com
```

补充说明：

- 当前 API 优先从 `DATABASE_URL` 解析数据库连接
- 如果未提供 `DATABASE_URL`，也可分别配置 `DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME`
- `JWT_SECRET` 当前不是主要生效配置项，不要把它当作 API 的核心部署依赖

## 构建前检查

部署前先执行：

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
```

当前主干已知阻塞：

- `apps/admin` 类型检查当前有一处 `ProTable` 列类型错误
- `apps/web` 生产构建当前有一处 Next.js `PageProps` 类型错误

因此，当前仓库状态下不应假设“直接构建即可上线”。

如果部署前构建失败，先修主干，再继续发版。

## 数据库准备

当前仓库下的 `packages/db/sql/` 是零散 SQL 资产，不是完整统一 migration 体系。

当前更稳的做法：

1. 先在本地准备好可用库
2. 从本地导出结构和数据
3. 导入生产库

示例：

```bash
mysqldump --single-transaction --routines --triggers joy-test > joy-prod.sql
mysql -u root -p -e "CREATE DATABASE joy_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p joy_prod < joy-prod.sql
```

注意：

- 当前数据库事实来源以 `umi/docs/` 为准
- 不要把根目录历史文档当成当前生产结构依据

## 源码直部署方案

如果暂时不做 Docker，当前最直接的部署方式是：

1. 服务器安装 Node.js 22、`pnpm`
2. 拉取仓库代码
3. 配置 `.env.local`
4. 执行 `pnpm install --frozen-lockfile`
5. 执行 `pnpm build`
6. 启动 `apps/api`
7. 启动 `apps/web`
8. 构建 `apps/admin` 并把 `dist/` 发布到外部 `Nginx`

### 安装依赖

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
npm i -g pnpm
```

### 拉代码与安装

```bash
git clone <repo-url> /srv/joy-umi
cd /srv/joy-umi
pnpm install --frozen-lockfile
```

### API 启动

构建后入口会落到 `apps/api/src/index.js`。

```bash
cd /srv/joy-umi
node apps/api/src/index.js
```

建议使用 `systemd`、`pm2` 或其他进程管理器守护，不建议裸跑。

### Web 启动

```bash
cd /srv/joy-umi
pnpm --filter @joy/web exec next start -p 3000
```

### Admin 发布

```bash
cd /srv/joy-umi
pnpm --filter @joy/admin build
rsync -a apps/admin/dist/ /var/www/joy-admin/
```

## 外部 Nginx 配置建议

### API

```nginx
server {
  listen 80;
  server_name api.example.com;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Web

```nginx
server {
  listen 80;
  server_name www.example.com example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Admin

```nginx
server {
  listen 80;
  server_name admin.example.com;

  root /var/www/joy-admin;
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
```

补充：

- 当前管理台使用 hash 路由，理论上即使没有复杂 rewrite 也能工作
- 保留 `try_files $uri /index.html;` 更稳妥

## Docker 化的目标形态

后续如果补 Docker 文件，建议遵循下面的目标，而不是重新设计架构：

### `api`

- 基于 Node 22
- 容器内只跑 `apps/api`
- 暴露 `4000`

### `web`

- 基于 Node 22
- 容器内只跑 `apps/web`
- 暴露 `3000`

### `admin`

- 只做构建产物
- 发布到外部 `Nginx`

## 发版检查清单

上线前至少确认：

1. `pnpm typecheck` 通过
2. `pnpm build` 通过
3. `.env.local` 已配置生产域名与数据库
4. `apps/api` 可连接生产 MySQL
5. `apps/web` 的 `NEXT_PUBLIC_API_BASE_URL` 指向正式 API 域名
6. `apps/admin` 的 `VITE_API_BASE_URL` 指向正式 API 域名
7. 外部 `Nginx` 已正确代理三套入口
8. `/health` 可访问
9. `/docs` 可访问
10. 后台登录与用户端登录至少各验证一次

## 当前不在本文档范围内

本文档当前不展开：

- CI/CD 流程
- 自动回滚
- 灰度发布
- 镜像仓库管理
- 多环境 compose 编排

原因：

- 当前仓库还没补齐正式 Docker 资产
- 当前主干还有构建阻塞，先收口基础可部署性更重要

## 后续建议

如果后续要继续完善部署体系，优先顺序建议是：

1. 修掉当前 `web` 和 `admin` 的构建阻塞
2. 补 `apps/api` 与 `apps/web` 的 `Dockerfile`
3. 补部署目录下的样例 `nginx` 配置
4. 再决定是否补 `docker-compose.yml`

不要反过来先做“大一统容器”。
