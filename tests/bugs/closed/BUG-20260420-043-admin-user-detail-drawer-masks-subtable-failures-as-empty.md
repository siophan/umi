# BUG-20260420-043

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-043` |
| `title` | 用户详情抽屉在订单/竞猜子表加载失败时把失败伪装成“0 条记录”和空态 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `admin/users/detail-drawer` |
| `scope` | `admin` |
| `page` | `#/users/list` |
| `api` | `/api/admin/users/:id/orders` / `/api/admin/users/:id/guesses` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-user-detail-drawer-qa-2026-04-20.md` |
| `fingerprint` | `admin-users:detail-drawer-subtable-failure-masked-as-empty` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 用户详情抽屉里的“订单记录 / 竞猜记录”子表请求失败时，应保持明确错误态，不应把 tab 数量清零，也不应把失败结果渲染成“暂无记录”。 |
| 对齐基准 | 当前产品要求 / 管理后台错误态约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 订单或竞猜子表请求失败时，页面会把对应 `total` 直接设成 `0`，并把列表数组清空；随后 tab 标题变成 `订单记录 (0)` / `竞猜记录 (0)`，内容区也会落到 `Empty` 的“暂无订单记录 / 暂无竞猜记录”。 |
| 影响范围 | 后台运营会把接口失败误判成“该用户确实没有订单/竞猜记录”；同时失败后 tab 数量也被改写成 `0`，掩盖了详情主接口里原本已经拿到的真实计数。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/users/list`，点击任一用户的“查看”打开详情抽屉。 |
| 2 | 让 `/api/admin/users/:id/orders` 或 `/api/admin/users/:id/guesses` 其中一个请求失败。 |
| 3 | 抽屉顶部会提示“部分详情加载失败”，但对应 tab 数量会变成 `0`，切进 tab 后还会显示“暂无订单记录 / 暂无竞猜记录”。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 订单子表失败分支在 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:146) 到 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:170)，会执行 `setUserOrders([])` 和 `setOrderTotal(0)`；竞猜子表失败分支在 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:188) 到 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:212)，会执行 `setUserGuesses([])` 和 `setGuessTotal(0)`。 |
| 接口证据 | 两个 tab 的真实读取接口分别是 [users.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts:40) 到 [users.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts:67) 的 `/api/admin/users/:id/orders` 与 `/api/admin/users/:id/guesses`。 |
| 日志/断言 | tab 标签和空态渲染依赖 `orderTotal / guessTotal` 与数组长度，见 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:619) 到 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:670)。因此失败后 UI 会同时表现成“0 条记录”和“暂无记录”。 |
| 相关文件 | [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx) [users.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx) | 订单/竞猜子表失败分支把错误直接收敛成空数组和 `0` 计数。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 订单/竞猜子表读取失败时不再把 `orderTotal / guessTotal` 重写成 `0`，而是保留详情主接口已有的真实计数；同时 tab 内容区改成显式错误告警，不再回落成“暂无订单记录 / 暂无竞猜记录”。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 通过。子表失败时 tab 数量不再被抹成 `0`，内容区会显示明确的“订单记录加载失败 / 竞猜记录加载失败”。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前详情状态已拆到 `apps/admin/src/lib/admin-users-page.ts` 和 `apps/admin/src/components/admin-user-detail-drawer.tsx`；订单/竞猜子表失败时只会写入 `orderIssue / guessIssue` 并显示显式告警，不再把失败伪装成 `0` 条记录和“暂无记录”。 |
| 修复提交/变更 | [apps/admin/src/pages/users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx) |

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/admin/src/pages/users-page.tsx:141](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:141) 到 [apps/admin/src/pages/users-page.tsx:165](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:141) 和 [apps/admin/src/pages/users-page.tsx:182](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:182) 到 [apps/admin/src/pages/users-page.tsx:206](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:182)，订单/竞猜子表失败分支已不再把 `orderTotal / guessTotal` 置成 `0`；同时 [apps/admin/src/pages/users-page.tsx:367](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:367) 到 [apps/admin/src/pages/users-page.tsx:431](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:431) 的 tab 内容区会优先显示显式错误告警，不再把失败伪装成“暂无记录”。 |
