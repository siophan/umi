TITLE: `apps/api/src/routes/openapi.ts` 单文件 2591 行，所有模块的 schema 与路径定义都塞在一起

LABELS: architecture, backend, refactor, docs

BODY:
## 现象

`apps/api/src/routes/openapi.ts` 目前是单文件，行数 2591。所有模块（auth、community、chat、notifications、guess、product、order、shop、wallet、warehouse、admin）的路径描述、请求体、响应 schema 都挤在这一个文件里。

## 为什么不合理

- 违反 `AGENTS.md` 的"禁止总入口大杂烩"和"单业务单模块优先"。
- 每加一个接口都要回这个文件做对应修改，触发大范围 diff，review 和冲突成本都高。
- 与代码已经按 `modules/*` 拆好的结构不一致——路由文件是分散的，描述文件却是大一统的。

## 建议

把 openapi 描述与 router 放在一起，按模块拆：

- `modules/auth/openapi.ts`、`modules/community/openapi.ts`、`modules/guess/openapi.ts`…
- `routes/openapi.ts` 只保留组装逻辑（信息、server 列表、把各模块的 paths / components 合并起来）。

这样新增接口时，`router.ts` 和 `openapi.ts` 改动在同一个目录下；对应的 AGENTS.md 约束"改完 API 后至少跑一次 `pnpm --filter @joy/api typecheck`"也更容易走通。
