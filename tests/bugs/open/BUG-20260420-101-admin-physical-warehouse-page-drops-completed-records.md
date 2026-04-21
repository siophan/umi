# BUG-20260420-101

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-101` |
| `title` | 实体仓页面把后端返回的 `completed` 记录直接过滤掉 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/warehouse/physical-visibility` |
| `scope` | `admin` |
| `page` | `#/warehouse/physical` |
| `api` | `/api/warehouse/admin/physical` |
| `owner` | `测试狗` |
| `source_run` | `admin-warehouse-qa-2026-04-20.md` |
| `fingerprint` | `admin-warehouse:physical-page-drops-completed-records` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 只要 `/api/warehouse/admin/physical` 返回了实体仓记录，页面就应提供查看入口，或者明确给出阶段拆分说明。 |
| 对齐基准 | 后台不应把已完成的实体仓记录静默吞掉。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 后端会把 `physical_warehouse.status = 30` 映射成 `completed`，但前端在 `visibleItems` 和 tab 统计前先把 `completed` 直接过滤掉。 |
| 影响范围 | 已完成的实体仓记录在当前管理后台没有可见入口，运营无法在实体仓模块复核这批数据。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 后端证据 | `/api/warehouse/admin/physical` 会把 `PHYSICAL_STATUS_FULFILLED` 映射成 `completed` 并返回给管理台，见 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/router.ts:179) 到 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/router.ts:217)。 |
| 页面证据 | 当前实体仓页在渲染前直接过滤 `item.status !== 'completed'`，见 [warehouse-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-page.tsx:80) 到 [warehouse-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-page.tsx:107) 和 [warehouse-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-page.tsx:218) 到 [warehouse-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-page.tsx:225)。 |
| 旁路证据 | 当前寄售市场页读取的是 `/api/admin/orders/consign`，不是 `/api/warehouse/admin/physical`，因此不会承接这批 `completed` 实体仓记录，见 [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx:52) 到 [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx:73)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [warehouse-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-page.tsx) | 前端主动丢弃 `completed` 实体仓记录。 |
| [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/warehouse/router.ts) | 后端仍在返回这批记录。 |
| [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx) | 当前寄售页并不承接实体仓 completed 记录。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 给 `completed` 实体仓记录保留后台可见入口，不要在页面层直接吞掉。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
