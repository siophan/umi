# Admin Chat / Equity / Rankings QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | `#/system/chats` `#/equity` `#/system/rankings` |
| 本轮重点 | 聊天管理详情链、概览统计消费、权益总览、排行榜管理动作 |
| 已确认 Bug | `4` |
| 阻塞项 | `0` |
| 结论 | 三个模块都已经接入真实 admin API，但都存在“后台已产出数据或旧页已有能力，当前页面却没有承接”的明显退化：聊天管理缺少消息明细和统计概览，权益管理缺少总览统计，排行榜管理则退化成只读结果页。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/system/chats` | `parity_gap` | 会话列表已接真实数据，但只有摘要表和摘要抽屉，缺少消息明细和概览统计消费。 |
| `#/equity` | `parity_gap` | 账户列表、详情和调账链已接真实 API，但总览统计没有在页面展示。 |
| `#/system/rankings` | `parity_gap` | 当前能读榜单列表和明细，但管理动作退化成只读，没有刷新榜单入口。 |
| `/api/admin/chats` | `parity_gap` | 后端已返回 summary/basis，但页面未消费；admin 侧也缺少聊天明细接口。 |
| `/api/admin/equity` | `parity_gap` | 列表接口已经返回 summary，但页面未承接。 |
| `/api/admin/rankings` | `parity_gap` | 当前只剩结果读取接口，缺少 refresh 写链路。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-117` | `P1` | `#/system/chats` | 聊天管理页只有会话摘要，缺少消息明细审查链路 | [tests/bugs/open/BUG-20260420-117-admin-system-chats-lacks-message-detail-review-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-117-admin-system-chats-lacks-message-detail-review-chain.md) |
| `BUG-20260420-118` | `P2` | `#/system/chats` | 聊天管理页丢失统计概览，只把后端 summary 闲置在接口里 | [tests/bugs/open/BUG-20260420-118-admin-system-chats-drops-summary-stats-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-118-admin-system-chats-drops-summary-stats-chain.md) |
| `BUG-20260420-119` | `P2` | `#/equity` | 权益管理页丢失总览统计展示，列表接口返回的 summary 没有被消费 | [tests/bugs/open/BUG-20260420-119-admin-equity-page-drops-summary-overview.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-119-admin-equity-page-drops-summary-overview.md) |
| `BUG-20260420-120` | `P2` | `#/system/rankings` | 排行榜管理页丢失“刷新排行榜”管理动作和 refresh 链路 | [tests/bugs/open/BUG-20260420-120-admin-rankings-page-lacks-refresh-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-120-admin-rankings-page-lacks-refresh-chain.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 聊天管理 | 当前只做到风险会话摘要浏览，缺少真正的消息审查能力。 |
| 统计概览 | 聊天和权益两个模块都已经有 summary 或旧 stats 语义，但页面没有消费。 |
| 管理动作 | 排行榜模块当前只剩结果读取，没有后台重算入口。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/system-chats-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-chats-page.tsx) [apps/admin/src/pages/equity-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/equity-page.tsx) [apps/admin/src/pages/system-rankings-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/system-rankings-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/system.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/system.ts) [apps/admin/src/lib/api/equity.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/equity.ts) [apps/admin/src/lib/api/rankings.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/rankings.ts) |
| 后端实现 / OpenAPI | [apps/api/src/modules/admin/system.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/system.ts) [apps/api/src/modules/admin/equity.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/equity.ts) [apps/api/src/routes/openapi/paths/admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) [apps/api/src/routes/openapi/paths/chats.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/chats.ts) |
| 老系统参考 | [admin/src/pages/chats/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/chats/index.tsx) [admin/src/pages/equity/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/equity/index.tsx) [admin/src/pages/rankings/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/rankings/index.tsx) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 给聊天管理补上 admin 侧消息明细查看链路，否则这页无法承担风险审查职责。 |
| `P2` | 让聊天管理和权益管理把现有 summary/stats 正常展示出来。 |
| `P2` | 给排行榜管理补回 refresh 管理动作和对应接口链路。 |
