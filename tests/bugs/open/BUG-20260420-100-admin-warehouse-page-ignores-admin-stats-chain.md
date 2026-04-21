# BUG-20260420-100

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-100` |
| `title` | 仓库主页面没有接入 admin stats，虚拟仓和实体仓统计概览整体缺失 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/warehouse/stats` |
| `scope` | `admin` |
| `page` | `#/warehouse/virtual` / `#/warehouse/physical` |
| `api` | `/api/warehouse/admin/stats` |
| `owner` | `测试狗` |
| `source_run` | `admin-warehouse-qa-2026-04-20.md` |
| `fingerprint` | `admin-warehouse:page-ignores-admin-stats-chain` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 仓库页应展示虚拟仓 / 实体仓核心统计，至少承接后台已有的 stats 链路。 |
| 对齐基准 | 老后台仓库页首屏有虚拟仓、实体仓、寄售市场的统计卡。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前仓库页只请求 `/api/warehouse/admin/virtual` 或 `/api/warehouse/admin/physical`，没有读取 `/api/warehouse/admin/stats`，页面完全没有统计概览。 |
| 影响范围 | 后台进入仓库模块后无法先看库存规模、寄售规模和状态分布，只能直接下钻列表。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 当前仓库页只调用 `fetchAdminWarehouseItems(warehouseType)`，没有使用 stats 读链，见 [warehouse-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-page.tsx:48) 到 [warehouse-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-page.tsx:78)。 |
| 前端 API 证据 | 前端其实已经有 `fetchWarehouseStats()` 封装，但页面未使用，见 [catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts:170) 到 [catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts:175)。 |
| 后端证据 | 后端和 OpenAPI 已暴露 `/api/warehouse/admin/stats`，见 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/router.ts:460) 到 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/router.ts:489) 和 [commerce.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/commerce.ts:881) 到 [commerce.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/commerce.ts:897)。 |
| 老后台对照 | 老后台仓库页首屏会先加载 `warehouseApi.adminStats()` 并渲染统计卡，见 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/warehouse/index.tsx:97) 到 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/warehouse/index.tsx:126)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [warehouse-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-page.tsx) | 当前没有 stats 概览。 |
| [catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts) | stats 封装存在但未被消费。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 把仓库页首屏统计接回 admin stats，不要只剩裸列表。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
