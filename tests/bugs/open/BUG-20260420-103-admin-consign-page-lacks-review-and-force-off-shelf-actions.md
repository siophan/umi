# BUG-20260420-103

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-103` |
| `title` | 寄售市场页只剩查看抽屉，缺少审核和强制下架链路 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/warehouse/consign-actions` |
| `scope` | `admin` |
| `page` | `#/warehouse/consign` |
| `api` | `/api/admin/orders/consign` |
| `owner` | `测试狗` |
| `source_run` | `admin-warehouse-qa-2026-04-20.md` |
| `fingerprint` | `admin-warehouse:consign-page-lacks-review-force-off-shelf-actions` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 寄售市场页应支持审核通过、审核拒绝、强制下架等后台动作。 |
| 对齐基准 | 老后台寄售市场页已承接审核与下架操作。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前寄售市场页操作列只有“查看”，前端也只封装了 `fetchAdminConsignRows()` 读链，没有任何审核或下架动作。 |
| 影响范围 | 当前后台无法在寄售市场页完成审核或强制下架，只能看只读详情。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 当前寄售市场页操作列只有“查看”，见 [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx:144) 到 [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx:151)。 |
| 前端 API 证据 | 当前前端只暴露 `fetchAdminConsignRows()`，没有审核或下架动作封装，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts:153) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts:154)。 |
| 老后台对照 | 老后台寄售市场页有“通过 / 拒绝 / 强制下架”动作，见 [consign.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/warehouse/consign.tsx:94) 到 [consign.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/warehouse/consign.tsx:132) 以及 [consign.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/warehouse/consign.tsx:175) 到 [consign.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/warehouse/consign.tsx:199)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx) | 当前寄售页退化成只读抽屉。 |
| [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts) | 缺少寄售审核和强制下架动作封装。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 把寄售市场审核和下架动作接回后台；未接通前不要把该页当成可运营市场页。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
