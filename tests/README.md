# Local Smoke Tests

这些脚本放在仓库根目录 `tests/`，用于本地临时验证，不作为正式测试体系的一部分。

更详细的说明见：

- [TESTING.md](/Users/ezreal/Downloads/joy/umi/tests/TESTING.md)
- [TEST-PLAN.md](/Users/ezreal/Downloads/joy/umi/tests/TEST-PLAN.md)
- [parity/PAGE-MATRIX.md](/Users/ezreal/Downloads/joy/umi/tests/parity/PAGE-MATRIX.md)
- [parity/API-MATRIX.md](/Users/ezreal/Downloads/joy/umi/tests/parity/API-MATRIX.md)
- [bugs/BUG-WORKFLOW.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/BUG-WORKFLOW.md)
- [bugs/index.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/index.md)
- [bugs/HANDOFF.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/HANDOFF.md)

## Bug Flow Rule

这套 `tests/` 目录里的 Bug 流程默认按下面的收口规则执行：

- 修复线程最多把 Bug 改到 `fixed_pending_verify`
- 用户端 Bug 默认由测试猫负责独立复测推进到 `verified`
- 管理后台 Bug 默认由测试狗负责独立复测推进到 `verified`
- 跨域或归属不明确的 Bug 由总控线程收口
- `Verifier` 负责独立复测，并决定是否进入 `verified`
- `closed` 只能在域验证方先给出 `verified`，再由测试总监按 bug 单 `Repro` 逐单真复测通过后执行
- 不能把“修复线程自测通过”等同于“已关闭”
- 不能把代码阅读、文档复核、`typecheck / build / smoke / integration` 当成关闭所需的真复测

如果其他线程开始按 Bug 单修复，默认先看：

- [tests/bugs/BUG-WORKFLOW.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/BUG-WORKFLOW.md)
- [tests/bugs/index.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/index.md)
- [tests/bugs/HANDOFF.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/HANDOFF.md)

`smoke/` 脚本默认不连数据库，主要检查：

- API 应用能正常启动
- 基础路由存在
- 未登录访问返回正确状态码
- OpenAPI 文档可用

`integration/` 下的脚本会连本地 `joy-test`，适合验证真实 SQL 聚合和接口结果。

`perf/` 下的脚本用于本地接口压测，默认自己起一个本地 API 实例，不属于正式 CI。

`cleanup/` 下的脚本用于扫描和清理本地测试残留，默认只扫描，不会直接删数据。

## Run

从仓库根目录执行：

```bash
pnpm --filter @umi/api exec node --import tsx ../../tests/smoke/api-auth.smoke.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/smoke/api-order.smoke.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/smoke/api-admin.smoke.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-order-admin-overview.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-order-list.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-warehouse.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-warehouse-admin.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-wallet-ledger.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-product-detail.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-product-guest-404.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-guess.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-guess-404.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-guess-user-history.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-lifecycle.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-code-login.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-code-errors.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-validation.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-social-activity.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-admin-auth.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-admin-guards.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-shop.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-shop-empty.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-shop-guards.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-order-detail.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-auth-notification-chat.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/integration/api-shop-public.db.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/perf/api-user-load.ts
pnpm --filter @umi/api exec node --import tsx ../../tests/cleanup/db-test-residue.ts
```

之所以通过 `@umi/api` 执行，是为了复用 `apps/api` 的 TypeScript 配置和环境加载逻辑。

如果有脚本被强制中断，想清掉本地 `joy-test` 里的残留，可以这样做：

```bash
pnpm --filter @umi/api exec node --import tsx ../../tests/cleanup/db-test-residue.ts
CLEANUP_APPLY=1 pnpm --filter @umi/api exec node --import tsx ../../tests/cleanup/db-test-residue.ts
```

默认 `CLEANUP_SCOPE=user`，只处理用户侧测试残留；如果连后台测试残留一起扫，再传 `CLEANUP_SCOPE=all`。
