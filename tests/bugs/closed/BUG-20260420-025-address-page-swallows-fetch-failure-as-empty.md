# BUG-20260420-025

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-025` |
| `title` | 收货地址页把地址读取失败静默吞成空地址列表 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `address/page` |
| `page` | `/address` |
| `api` | `/api/addresses` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-address:load-failure-empty-state` |
| `fix_owner` |  |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 地址读取失败时，页面应明确暴露错误态或重试态，不能直接渲染成“还没有收货地址”。 |
| 对齐基准 | 当前产品要求 / 页面错误处理一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `/api/addresses` 读取失败会被 `catch` 后直接 `setAddresses([])`，页面随即进入空地址态。 |
| 影响范围 | 用户会误以为自己没有地址数据，回归时也会把接口失败错判成正常空态。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/address`。 |
| 2 | 让 `/api/addresses` 返回非 `200` 或断网。 |
| 3 | 页面会显示“还没有收货地址”，而不是错误提示。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/address/page.tsx:113](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:113) 到 [apps/web/src/app/address/page.tsx:123](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:123)。 |
| 接口证据 | 地址页读取依赖 `/api/addresses`，失败后没有错误状态分支。 |
| 日志/断言 | `catch` 分支只执行 `setAddresses([])`。 |
| 相关文件 | [apps/web/src/app/address/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/address/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx) | 读取失败直接回退为空列表。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 为 `/api/addresses` 失败引入显式错误态和重试，不要把失败伪装成“无地址”。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。已复核地址页新增显式错误态和重试入口，`loadError` 会拦住空态渲染，不再把失败伪装成“还没有收货地址”；并通过 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build`。 |
| 修复提交/变更 | [apps/web/src/app/address/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx)、[apps/web/src/app/address/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.module.css) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 地址读取失败时页面会显示显式错误态和重试，不再伪装成“还没有收货地址”。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了地址页的读取失败分支和 `loadError/empty/addresses` 三态渲染；当前 `/api/addresses` 失败会设置显式 `loadError` 并展示“收货地址加载失败 + 重试”，空地址页只在真实成功且地址为空时出现。 |
