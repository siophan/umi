# BUG-20260420-005

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-005` |
| `title` | 仓库页把接口失败静默吞成空列表 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `warehouse/list` |
| `page` | `/warehouse` |
| `api` | `/api/warehouse/virtual` `/api/warehouse/physical` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-warehouse:virtual-physical-errors-swallowed-to-empty-state` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 仓库接口失败时，页面应明确提示读取失败，不应把失败渲染成“暂无商品”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 任一仓库请求失败后，页面直接 `setItems([])`，用户看到的是空仓库而不是异常页。 |
| 影响范围 | 用户会误判仓库为空；测试和运营也无法从页面区分“无货”和“接口坏了”。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/warehouse`。 |
| 2 | 让 `/api/warehouse/virtual` 或 `/api/warehouse/physical` 请求失败。 |
| 3 | 页面不暴露异常，只显示空仓库态。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/warehouse/page.tsx:78](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx:78) 到 [apps/web/src/app/warehouse/page.tsx:93](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx:93)。 |
| 接口证据 | `/api/warehouse/virtual` 和 `/api/warehouse/physical` 都已有真实用户链路和集成测试覆盖。 |
| 日志/断言 | `catch` 分支直接 `setItems([])`，没有错误态。 |
| 相关文件 | [apps/web/src/app/warehouse/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/warehouse/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx) | 页面把失败分支伪装成了正常空态。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 仓库页已引入显式 `error` 状态和重试入口；虚拟仓或实体仓接口失败时不再 `setItems([])` 伪装成空仓库，而是展示“仓库加载失败”错误态和重新加载按钮。空仓库态与错误态已分离。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；失败分支不再把异常吞成“暂无商品”。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/warehouse/page.tsx:62](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx:62) 到 [apps/web/src/app/warehouse/page.tsx:90](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx:90) 和 [apps/web/src/app/warehouse/page.tsx:254](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx:254) 到 [apps/web/src/app/warehouse/page.tsx:261](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx:261)；失败分支现在只设置显式 `error`，页面会展示“仓库加载失败”和重试按钮，空仓库态只在真实无数据时出现。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/warehouse/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.tsx)、[apps/web/src/app/warehouse/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/warehouse/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了仓库页 `loadWarehouse` 的聚合加载逻辑、两个仓库接口的非 2xx 抛错路径，以及主渲染区对 `error`/空态的分支；当前虚拟仓或实体仓任一请求失败都会设置显式 `error` 并展示“仓库加载失败 + 重新加载”，不会再通过清空 `items` 伪装成空仓库。 |
