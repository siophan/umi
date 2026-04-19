TITLE: 多处无引用的 legacy / demo 死代码未清理

LABELS: cleanup, refactor

BODY:
## 现象

以下文件在当前代码中**没有任何 import 引用**（全仓 grep 过）：

1. `apps/web/src/components/legacy-page.tsx`（106 行）+ 配套 `legacy-page.module.css`
2. `apps/web/src/lib/demo.ts`（163 行，导出 `demoUser / demoProduct / demoProduct2 / ...`）
3. `apps/api/src/lib/demo-data.ts`（142 行，导出 `demoUser / demoAdmin / demoGuesses / demoOrders / demoLedger / demoWarehouse`）

## 为什么不合理

`AGENTS.md` 硬性规则：

> 不允许留死代码、死目录、空目录。旧实现不用了就立即删除，不能保留 `legacy-*`、`admin-page-data` 之类残骸等后面再说。
> 不允许把 demo 数据、mock 数据、fallback 数据和真实接口结果混在一起长期存在。

legacy-page 和两个 demo 文件正是点名要清的类型。保留着会让后续线程误以为还在用、或把新功能接到 demo 上。

## 建议

直接 `git rm` 掉以上 4 个文件（`legacy-page.tsx`、`legacy-page.module.css`、`web/src/lib/demo.ts`、`api/src/lib/demo-data.ts`）。删完跑一次 `pnpm typecheck` 保证 CI 通过。
