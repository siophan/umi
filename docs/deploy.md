# 部署说明

最后更新：2026-04-21

本文档只记录当前 `umi/` 工作区可直接落地的部署方案，不讨论理想化云原生架构，也不把临时演示方式写成长期标准。

## 当前结论

当前推荐拓扑：

- 外部 `Nginx`
- 外部 `MySQL`
- `apps/api` 独立 Node 进程
- `apps/web` 独立 Node 进程
- `apps/admin` 构建成静态文件，由外部 `Nginx` 托管

当前不建议的形态：

- 不建议把 `web + api + admin` 塞进一个容器
- 不建议把 `web + api` 塞进同一个常驻容器后再用 `pm2` / `supervisord` 管多个进程
- 不建议把 `admin` 当成需要常驻 Node 进程的服务

原因很直接：

1. `apps/api` 是 Express 服务，需要独立 Node 进程。
2. `apps/web` 是 Next.js 服务，需要独立 Node 进程。
3. `apps/admin` 是 Vite 静态产物，构建后不需要常驻 Node。
4. 三者生命周期、日志、重启策略和健康检查方式都不同，硬塞到一个容器里只会增加维护成本。

## 当前仓库形态

当前仓库是 `pnpm workspace + turbo` monorepo：

- `apps/api`
- `apps/web`
- `apps/admin`
- `packages/shared`
- `packages/db`
- `packages/config`

相关事实来源：

- 根脚本：[package.json](/Users/ezreal/Downloads/joy/umi/package.json:1)
- API 包名与脚本：[apps/api/package.json](/Users/ezreal/Downloads/joy/umi/apps/api/package.json:1)
- Web 包名与脚本：[apps/web/package.json](/Users/ezreal/Downloads/joy/umi/apps/web/package.json:1)
- Admin 包名与脚本：[apps/admin/package.json](/Users/ezreal/Downloads/joy/umi/apps/admin/package.json:1)

当前 workspace 包名统一是 `@umi/*`，不是旧口径里的 `@joy/*`。

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

`packages/*` 当前不是独立部署服务，但它们仍然是 monorepo 的一部分，构建时不能丢。

当前角色划分：

- `packages/shared`
  共享类型、状态枚举、接口契约，`api / web / admin` 都会直接依赖
- `packages/config`
  工程配置资产，不作为独立运行服务
- `packages/db`
  数据库 docs-first 说明与待重建 schema / migration 资产，不作为独立运行服务

结论：

1. 不需要把 `packages/shared`、`packages/config`、`packages/db` 单独起容器或单独部署。
2. 但无论源码直部署还是 Docker 构建，workspace 必须保留完整 monorepo 上下文。
3. 不要只拷 `apps/api` 或 `apps/web` 单目录去构建镜像，否则 workspace 依赖会丢失。

如果后续补 Dockerfile，构建上下文默认应指向仓库根目录 `umi/`，而不是单个 `apps/*` 目录。

## 推荐部署拓扑

### 多子域名拆分

- `api.example.com` -> 反向代理到 `apps/api`
- `www.example.com` / `example.com` -> 反向代理到 `apps/web`
- `admin.example.com` -> 外部 `Nginx` 直接托管 `apps/admin/dist`

### 单域名拆分

当前项目也可以部署到一个域名下，推荐路径拆分：

- `https://example.com/` -> `apps/web`
- `https://example.com/api/*` -> `apps/api`
- `https://example.com/health` -> `apps/api`
- `https://example.com/openapi.json` -> `apps/api`
- `https://example.com/docs` -> `apps/api`
- `https://example.com/admin/` -> `apps/admin`

单域名的优点：

- 少一层 CORS 配置
- `web`、`admin` 与 `api` 可直接走同源
- 域名、证书和网关配置更简单

当前代码已补齐两个单域名前提：

1. [apps/admin/vite.config.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/vite.config.ts:1) 已显式设置 `base: '/admin/'`
2. [apps/admin/src/App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx:1) 打开接口文档时已改成相对路径 `/docs`

### 进程建议

- `apps/api`：1 个独立 Node 进程
- `apps/web`：1 个独立 Node 进程
- `apps/admin`：无常驻进程，只有静态文件

### 为什么不做“一容器三服务”

这套项目如果 `Nginx` 和 `MySQL` 都已经外置，最省事的部署形态就是：

1. `api` 一个进程或一个容器
2. `web` 一个进程或一个容器
3. `admin` 只发静态文件

不要为了“统一打包”把三个运行单元硬捏在一起。那样不会减少业务复杂度，只会把日志、重启、发版和排障都绑死。

## 环境变量

环境变量模板见：

- [.env.example](/Users/ezreal/Downloads/joy/umi/.env.example:1)

当前运行时会从工作区根目录读取 `.env.local` 和 `.env`。

API 环境变量入口：

- [apps/api/src/env.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/env.ts:1)

从代码可直接确认：

- API 会从 workspace 根目录读取 `.env.local` 和 `.env`
- API 优先读取 `DATABASE_URL`
- 如果未提供 `DATABASE_URL`，会回退到 `DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME`
- `ADMIN_TOKEN_SECRET` 未配置时会回退到 `SMS_CODE_PEPPER`

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

- `.env.example` 里的 `JWT_SECRET` 当前不是 API 运行的主依赖项
- 生产环境不要继续沿用默认开发域名
- `apps/web` 和 `apps/admin` 的 API Base URL 应统一指向正式 API 域名

如果采用多子域名：

```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
VITE_API_BASE_URL=https://api.example.com
```

如果采用单域名：

```env
NEXT_PUBLIC_API_BASE_URL=https://example.com
VITE_API_BASE_URL=
```

说明：

- `apps/web` 既有浏览器请求，也有服务端请求；单域名部署时，`NEXT_PUBLIC_API_BASE_URL` 仍建议写完整域名，避免服务端请求拿到空基址
- `apps/admin` 纯前端运行时可直接走同源，所以 `VITE_API_BASE_URL` 可以留空，也可以显式写成 `https://example.com`

## 发版前确认

当前 [docs/progress.md](/Users/ezreal/Downloads/joy/umi/docs/progress.md:1) 记录的最新工程状态是 workspace `typecheck` 与 `build` 已通过；但真正发版前，仍应在目标提交上重新确认：

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
```

不要因为文档里某次通过，就跳过本次待发布版本的实际构建检查。

## 数据库准备

当前数据库事实来源以 `umi/docs/` 为准，不以根目录历史文档为准。

当前更稳的做法：

1. 先以 [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:1) 和 [docs/schema-reference.md](/Users/ezreal/Downloads/joy/umi/docs/schema-reference.md:1) 核对本地 `joy-test`
2. 如果生产库为空，优先从本地可用库导出结构和数据
3. 再导入外部生产 MySQL

示例：

```bash
mysqldump --single-transaction --routines --triggers joy-test > joy-prod.sql
mysql -u root -p -e "CREATE DATABASE joy_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p joy_prod < joy-prod.sql
```

注意：

- 当前不要把 `packages/db/sql/` 当成可直接恢复生产库的完整 migration 集合
- 生产库初始化优先以当前文档和本地可用库为准

## 源码直部署方案

如果暂时不做 Docker，当前最直接的部署方式是：

1. 服务器安装 Node.js 22 和 `pnpm`
2. 拉取仓库代码
3. 配置 `.env.local`
4. 执行 `pnpm install --frozen-lockfile`
5. 执行 `pnpm typecheck`
6. 执行 `pnpm build`
7. 启动 `apps/api`
8. 启动 `apps/web`
9. 构建 `apps/admin` 并把 `dist/` 发布到外部 `Nginx`

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

### 构建

```bash
cd /srv/joy-umi
pnpm typecheck
pnpm build
```

### API 启动

当前 `apps/api` 的构建脚本是 `tsc -p tsconfig.json --noEmit false`，生产入口为：

- [apps/api/src/index.js](/Users/ezreal/Downloads/joy/umi/apps/api/src/index.js:1)

启动示例：

```bash
cd /srv/joy-umi
node apps/api/src/index.js
```

### Web 启动

当前 `apps/web` 包名是 `@umi/web`，生产建议命令：

```bash
cd /srv/joy-umi
pnpm --filter @umi/web exec next start -p 3000
```

### Admin 发布

当前 `apps/admin` 包名是 `@umi/admin`，发布示例：

```bash
cd /srv/joy-umi
pnpm --filter @umi/admin build
rsync -a apps/admin/dist/ /var/www/joy-admin/
```

## 进程托管建议

当前更推荐用 `systemd` 或 `pm2` 守护 `api` 和 `web`，不要直接裸跑。

### `systemd` 示例

`/etc/systemd/system/joy-api.service`

```ini
[Unit]
Description=joy umi api
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/joy-umi
ExecStart=/usr/bin/node /srv/joy-umi/apps/api/src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/joy-web.service`

```ini
[Unit]
Description=joy umi web
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/joy-umi
ExecStart=/usr/bin/pnpm --filter @umi/web exec next start -p 3000
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

常用操作：

```bash
sudo systemctl daemon-reload
sudo systemctl enable joy-api joy-web
sudo systemctl start joy-api joy-web
sudo systemctl status joy-api joy-web
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

### 单域名 Nginx 示例

```nginx
server {
  listen 80;
  server_name example.com www.example.com;

  location /api/ {
    proxy_pass http://127.0.0.1:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location = /health {
    proxy_pass http://127.0.0.1:4000/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location = /openapi.json {
    proxy_pass http://127.0.0.1:4000/openapi.json;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location = /docs {
    proxy_pass http://127.0.0.1:4000/docs;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /admin/ {
    alias /var/www/joy-admin/;
    try_files $uri $uri/ /admin/index.html;
  }

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

## Docker 建议

如果后续使用 Docker，当前建议的拆分是：

- `api` 一个容器
- `web` 一个容器
- `admin` 不做运行容器，只产出静态文件

不建议：

- 一个容器同时跑 `api + web + admin`
- 为了单容器运行再引入 `pm2`、`supervisord` 或多进程 entrypoint

如果未来必须容器化，优先接受：

1. 外部 `Nginx`
2. 外部 `MySQL`
3. `api` 镜像
4. `web` 镜像
5. `admin` 构建后上传到 `Nginx` 站点目录

## 发版检查清单

上线前至少确认：

1. `pnpm install --frozen-lockfile` 通过
2. `pnpm typecheck` 通过
3. `pnpm build` 通过
4. `.env.local` 已配置生产域名与数据库
5. `apps/api` 可连接生产 MySQL
6. `NEXT_PUBLIC_API_BASE_URL` 指向正式 API 域名
7. `VITE_API_BASE_URL` 指向正式 API 域名
8. 外部 `Nginx` 已正确代理三套入口
9. `/health` 可访问
10. `/docs` 可访问
11. 后台登录与用户端登录至少各验证一次

## 当前部署风险

当前最大的部署风险不是“服务起不来”，而是“上线后业务闭环还不够完整”。

当前仍应重点关注：

- 用户端 `invite`、`checkin` 链路仍需确认后端承接是否完整
- 页面级自动化测试明显少于 API integration / smoke
- 仍有不少页面在 [docs/feature-progress.md](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:1) 中只能标成 `老系统对齐状态 = 未核对`

也就是说，这套项目已经具备基础部署条件，但“能启动”不等于“所有运营链路都已完全收口”。

## 当前不在本文档范围内

本文档当前不展开：

- CI/CD 流程
- 自动回滚
- 灰度发布
- 镜像仓库管理
- 多环境 compose 编排

原因：

- 当前仓库还没补齐正式 Docker 资产
- 当前优先级仍是先确保基础部署、关键链路和运营闭环稳定

## 后续建议

如果后续要继续完善部署体系，优先顺序建议是：

1. 继续收口 `invite`、`checkin` 等未完全闭环链路
2. 补 `apps/api` 与 `apps/web` 的 `Dockerfile`
3. 把 `Nginx` / `systemd` 样例固化到部署目录
4. 再决定是否补 `docker-compose.yml`

不要反过来先做“大一统容器”。
