# Admin User Detail Drawer QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 后台用户列表详情抽屉 `基本信息 / 订单记录 / 竞猜记录` 审查 |
| 本轮重点 | 子表错误态、tab 数量口径、抽屉失败呈现 |
| 已确认 Bug | `1` |
| 阻塞项 | `0` |
| 结论 | 抽屉主详情读取链路可用，但订单/竞猜子表一旦失败，会被 UI 同时表现成“0 条记录”和“暂无记录”，属于典型的后台错误态被伪装成业务空态。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/users/list` 详情抽屉 - 基本信息 | `checked` | 主详情读取走 `/api/admin/users/:id`，本轮未发现新的字段错位。 |
| `#/users/list` 详情抽屉 - 订单记录 | `parity_gap` | 失败时会把错误伪装成“0 条记录 + 暂无订单记录”。 |
| `#/users/list` 详情抽屉 - 竞猜记录 | `parity_gap` | 失败时会把错误伪装成“0 条记录 + 暂无竞猜记录”。 |
| `/api/admin/users/:id/orders` | `parity_gap` | 页面消费失败分支处理不正确。 |
| `/api/admin/users/:id/guesses` | `parity_gap` | 页面消费失败分支处理不正确。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-043` | `P1` | `#/users/list` | 用户详情抽屉在订单/竞猜子表加载失败时把失败伪装成“0 条记录”和空态 | [tests/bugs/open/BUG-20260420-043-admin-user-detail-drawer-masks-subtable-failures-as-empty.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-043-admin-user-detail-drawer-masks-subtable-failures-as-empty.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 错误态 | 抽屉顶部虽然能提示“部分详情加载失败”，但子表局部仍会退化成业务空态。 |
| 计数口径 | 详情主接口已经提供的 `totalOrders / totalGuess` 会被子表失败分支重写成 `0`。 |
| 复核结论 | 当前抽屉还不能可靠区分“真的无记录”和“记录读取失败”。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/users.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/users.ts) |
| 后端路由 | [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) |
| 后端子表查询 | [apps/api/src/modules/admin/users.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/users.ts) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 让订单/竞猜子表在失败时保持明确错误态，不要清零计数并落成空态。 |
| `P2` | 为抽屉子表补专项 QA 或集成测试，覆盖“有数据 / 无数据 / 接口失败”三种分支。 |
