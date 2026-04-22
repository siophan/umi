# 部署说明

最后更新：2026-04-21

本文档只记录当前 `umi/` 工作区已经验证过、可以直接落地的部署方案。

当前主推方案不是“服务器上整仓 `pnpm build`”，而是：

- 本地用 Docker 生成 Linux 发布包
- 上传 `release/release.tar.gz`
- 线上解压到运行目录
- 宝塔负责站点、Nginx、SSL
- Supervisor 负责 `api` / `web`
- `admin` 走静态文件

## 当前结论

当前推荐拓扑：

- 外部 `Nginx` 或宝塔站点
- 外部 `MySQL`
- `apps/api` 独立 Node 进程
- `apps/web` 独立 Node 进程
- `apps/admin` 构建成静态文件，由外部 `Nginx` 托管

当前不建议的形态：

- 不建议把 `web + api + admin` 塞进一个容器
- 不建议把三个运行单元塞进一个 PM2/Supervisor 多进程入口
- 不建议继续把服务器当主构建机跑整仓 `pnpm build`

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

当前 workspace 包名统一是 `@umi/*`。

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

1. 不需要把 `packages/shared`、`packages/config`、`packages/db` 单独部署。
2. 无论源码直部署还是发布包构建，workspace 必须保留完整 monorepo 上下文。
3. 不要只拷 `apps/api` 或 `apps/web` 单目录去部署。

## 推荐部署拓扑

### 单域名拆分

当前主推单域名路径拆分：

- `https://example.com/` -> `apps/web`
- `https://example.com/api/*` -> `apps/api`
- `https://example.com/health` -> `apps/api`
- `https://example.com/openapi.json` -> `apps/api`
- `https://example.com/docs` -> `apps/api`
- `https://example.com/admin/` -> `apps/admin`

单域名的优点：

- 少一层 CORS 配置
- `web`、`admin` 与 `api` 可直接走同源
- 域名和证书更省事

### 当前代码前提

当前代码已补齐单域名前提：

1. [apps/admin/vite.config.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/vite.config.ts:1) 已显式设置 `base: '/admin/'`
2. [apps/admin/src/App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx:1) 打开接口文档时已改成相对路径 `/docs`

### 进程建议

- `apps/api`：1 个独立 Node 进程
- `apps/web`：1 个独立 Node 进程
- `apps/admin`：无常驻进程，只有静态文件

## 环境变量

环境变量模板见：

- [.env.example](/Users/ezreal/Downloads/joy/umi/.env.example:1)

API 环境变量入口：

- [apps/api/src/env.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/env.ts:1)

从代码可直接确认：

- API 会从 workspace 根目录读取 `.env.local` 和 `.env`
- API 优先读取 `DATABASE_URL`
- 如果未提供 `DATABASE_URL`，会回退到 `DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME`
- `ADMIN_TOKEN_SECRET` 未配置时会回退到 `SMS_CODE_PEPPER`

### 推荐生产环境变量

单域名部署时，建议生产环境至少配置：

```env
NODE_ENV=production

# apps/api
PORT=4000
DATABASE_URL=mysql://user:password@db-host:3306/db_name
SMS_CODE_PEPPER=replace_this
ADMIN_TOKEN_SECRET=replace_this
LOG_LEVEL=info
CORS_ORIGINS=https://example.com

# apps/web
NEXT_PUBLIC_API_BASE_URL=https://example.com

# apps/admin
VITE_API_BASE_URL=
```

补充说明：

- `.env.example` 里的 `JWT_SECRET` 当前不是 API 运行主依赖
- `NEXT_PUBLIC_API_BASE_URL` 建议写完整域名，避免 Next 服务端请求拿到空基址
- `VITE_API_BASE_URL` 单域名部署时可以留空，后台直接走同源
- `SMS_CODE_PEPPER` 用于验证码哈希加盐
- `ADMIN_TOKEN_SECRET` 用于后台管理员 token 签名

## 数据库准备

当前数据库事实来源以 `umi/docs/` 为准，不以根目录历史文档为准。

当前更稳的做法：

1. 先以 [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:1) 和 [docs/schema-reference.md](/Users/ezreal/Downloads/joy/umi/docs/schema-reference.md:1) 核对本地 `joy-test`
2. 如果生产库为空，优先从本地可用库导出结构和数据
3. 再导入外部生产 MySQL

注意：

- 当前不要把 `packages/db/sql/` 当成可直接恢复生产库的完整 migration 集合
- 生产库初始化优先以当前文档和本地可用库为准

## 当前推荐发布方式

当前主推：

1. 本地准备 `release/.env.local`
2. 本地运行 [scripts/build-release-in-docker.sh](/Users/ezreal/Downloads/joy/umi/scripts/build-release-in-docker.sh:1)
3. 脚本在 Linux Docker 容器中构建发布包
4. 得到：
   - `release/release.tar.gz`
   - `release/.env.local`
5. 上传 `release/release.tar.gz` 到服务器
6. 线上解压到运行目录
7. Supervisor 启动 `api` 和 `web`
8. `admin` 静态目录指向运行目录中的 `apps/admin/dist`

### 为什么要本地 Docker 构建

原因不是“为了 Docker 化部署”，而是为了避免跨平台依赖问题。

当前项目里：

- `api` 源码运行依赖 `tsx`
- `tsx` 运行期依赖 `esbuild`
- `web` 依赖 Next 的平台相关二进制

如果你在 macOS 上直接装依赖，再把 `node_modules` 拷到 Linux，很容易出现错误平台二进制。

当前脚本默认使用：

- Docker 镜像：`node:22-bookworm`
- Docker 平台：`linux/amd64`

这更贴近当前线上 Linux x64 服务器。

### 构建脚本行为

[scripts/build-release-in-docker.sh](/Users/ezreal/Downloads/joy/umi/scripts/build-release-in-docker.sh:1) 当前行为：

1. 读取 `release/.env.local`
2. 在 Docker Linux 容器中复制完整发布所需内容
3. 执行：
   - `pnpm install --no-frozen-lockfile`
   - `pnpm --filter @umi/api typecheck`
   - `pnpm --filter @umi/web typecheck`
   - `pnpm --filter @umi/admin typecheck`
   - `pnpm --filter @umi/api build`
   - `pnpm --filter @umi/web build`
   - `pnpm --filter @umi/admin build`
4. 生成 `release/release.tar.gz`
5. 清理 `release/` 目录，只保留：
   - `release/.env.local`
   - `release/release.tar.gz`
6. 即使构建失败，也会恢复 `release/.env.local`

### 本地发布命令

```bash
./scripts/build-release-in-docker.sh
```

### 产物检查

打包完成后至少确认：

```bash
ls -la release/.env.local
ls -lh release/release.tar.gz
```

## 宝塔上线流程

当前最稳的宝塔方式是：

- 宝塔负责：网站、SSL、Nginx、静态目录
- Supervisor 负责：`api`、`web`

不建议继续死磕宝塔“添加 Node 项目”弹窗来直接管理 monorepo。

### 线上目录建议

例如：

- 上传包目录：`/www/wwwroot/example.com/release/`
- 当前运行目录：`/www/wwwroot/example.com/release-current`

### 解压发布包

```bash
mkdir -p /www/wwwroot/example.com/release-current
tar -xzf /www/wwwroot/example.com/release/release.tar.gz -C /www/wwwroot/example.com/release-current
```

### 运行目录结构检查

上线前至少确认这些文件存在：

```bash
ls -l /www/wwwroot/example.com/release-current/apps/api/src/index.ts
ls -l /www/wwwroot/example.com/release-current/apps/web/.next/BUILD_ID
ls -l /www/wwwroot/example.com/release-current/apps/admin/dist/index.html
```

## 手动启动命令

### API

如果运行目录是：

```bash
/www/wwwroot/example.com/release-current/apps/api
```

手动启动：

```bash
cd /www/wwwroot/example.com/release-current/apps/api
./node_modules/.bin/tsx src/index.ts
```

如果 `apps/api/node_modules/.bin/tsx` 不存在，再退回根目录依赖：

```bash
cd /www/wwwroot/example.com/release-current/apps/api
../../node_modules/.bin/tsx src/index.ts
```

### Web

如果运行目录是：

```bash
/www/wwwroot/example.com/release-current/apps/web
```

手动启动：

```bash
cd /www/wwwroot/example.com/release-current/apps/web
./node_modules/.bin/next start -p 3000
```

如果端口占用，可先换端口排障：

```bash
./node_modules/.bin/next start -p 3100
```

## Supervisor 建议

### `umi-api`

- 启动用户：`www`
- 进程数量：`1`
- 进程目录：

```bash
/www/wwwroot/example.com/release-current/apps/api
```

- 启动命令：

```bash
./node_modules/.bin/tsx src/index.ts
```

如果子目录无 `.bin/tsx`，改成：

```bash
../../node_modules/.bin/tsx src/index.ts
```

### `umi-web`

- 启动用户：`www`
- 进程数量：`1`
- 进程目录：

```bash
/www/wwwroot/example.com/release-current/apps/web
```

- 启动命令：

```bash
./node_modules/.bin/next start -p 3000
```

如果 3000 被占用，先查端口：

```bash
sudo ss -lntp '( sport = :3000 )'
sudo lsof -nP -iTCP:3000 -sTCP:LISTEN
```

## Nginx 配置建议

站点根目录：

```bash
/www/wwwroot/example.com
```

核心配置示例：

```nginx
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

location = /admin {
    return 301 /admin/;
}

location ^~ /admin/ {
    alias /www/wwwroot/example.com/release-current/apps/admin/dist/;
    try_files $uri $uri/ /index.html;
}

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

如果你更习惯把后台静态文件单独同步到站点根目录 `/admin/`，也可以继续用那套方式；当前文档只是给出“直接从 release-current 挂静态目录”的口径。

## 当前不建议的做法

- 不建议在服务器跑整仓 `pnpm build`
- 不建议继续依赖 `pnpm exec` 作为唯一诊断入口
- 不建议直接拿 macOS 安装出来的 `node_modules` 上传到 Linux
- 不建议继续使用旧的 `/umi/` 目录和旧依赖混跑新发布包

## 当前部署风险

当前最大的部署风险不是“服务起不来”，而是“上线后业务闭环还不够完整”。

当前仍应重点关注：

- 用户端 `invite`、`checkin` 链路仍需确认后端承接是否完整
- 页面级自动化测试明显少于 API integration / smoke
- 仍有不少页面在 [docs/feature-progress.md](/Users/ezreal/Downloads/joy/umi/docs/feature-progress.md:1) 中只能标成 `老系统对齐状态 = 未核对`

## 当前不在本文档范围内

本文档当前不展开：

- CI/CD 流程
- 自动回滚
- 灰度发布
- 镜像仓库管理
- 多环境 compose 编排

当前优先级仍是先把“可稳定发版、可稳定运行”收口。 
