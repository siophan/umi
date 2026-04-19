TITLE: 每个受保护接口都在 handler 里重复抄写鉴权样板，应改为 `requireUser` 中间件

LABELS: backend, refactor, dx

BODY:
## 现象

`apps/api/src/modules/auth/router.ts` 里大多数 handler 都有这段 5–6 行：

```ts
const token = getBearerToken(request.headers.authorization);
const user = token ? await getUserByToken(token) : null;
if (!user) {
  response.status(401).json({ success: false, message: '请先登录' });
  return;
}
```

粗数整份文件里这段模式至少重复 20+ 次，其他模块（guess / order / product / shop / wallet / warehouse / admin）还在重复同样的结构。

## 为什么不合理

- 每新增一个需要登录的接口，都要再抄一次。
- 如果要改 401 的响应结构（例如补 `code`）或补审计日志，需要在几十处同步改。
- AGENTS.md 要求"不允许把接口失败静默吞掉"、错误暴露要清晰——集中化反而更容易做到。

## 建议

- 新增 `apps/api/src/lib/auth.ts`（或放到 `modules/auth/middleware.ts`），导出：
  - `requireUser`：解析 Bearer token、查 session、写入 `request.user`，否则 401 返回。
  - 可选 `optionalUser`：存在则挂，不存在不拦。
  - Admin 走独立的 `requireAdmin`，和用户端链路边界分开（这一点 AGENTS.md 也明确要求）。
- 路由改成 `authRouter.post('/me', requireUser, handler)` 形式，handler 里直接读 `request.user`。
- 同一轮里把 `try/catch` 里的 `error.message` 处理也抽出一个统一 handler，避免每个 route 自己 `response.status(400).json(...)`。
