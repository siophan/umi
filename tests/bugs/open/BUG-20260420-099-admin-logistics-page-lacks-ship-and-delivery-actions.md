# BUG-20260420-099

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-099` |
| `title` | 物流管理页只剩只读列表，缺少发货和标记签收链路 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/logistics/actions` |
| `scope` | `admin` |
| `page` | `#/orders/logistics` |
| `api` | `/api/admin/orders/logistics` |
| `owner` | `测试狗` |
| `source_run` | `admin-orders-qa-2026-04-20.md` |
| `fingerprint` | `admin-logistics:page-lacks-ship-and-delivery-actions` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 物流管理页应支持对待发货订单录入物流信息，对已发货订单执行“标记签收”等履约动作。 |
| 对齐基准 | 老后台物流页已承接 `ship` 和 `deliver` 两条动作链。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前物流管理页只有查看抽屉，没有发货按钮、签收按钮，也没有对应写接口封装。 |
| 影响范围 | 履约管理在新后台退化成只读页，无法直接完成发货和签收推进。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 当前物流管理页操作列只有“查看”，见 [order-logistics-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-logistics-page.tsx:90) 到 [order-logistics-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-logistics-page.tsx:97)。 |
| 前端 API 证据 | 当前订单前端 API 只有 `fetchAdminLogistics()` 读链，没有 `ship` / `deliver` 动作封装，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts:145) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts:154)。 |
| 老后台对照 | 老后台物流页提供发货弹窗和标记签收动作，见 [logistics.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/logistics.tsx:70) 到 [logistics.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/logistics.tsx:99) 以及 [logistics.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/logistics.tsx:132) 到 [logistics.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/orders/logistics.tsx:149)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [order-logistics-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-logistics-page.tsx) | 物流页退化成只读抽屉。 |
| [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/orders.ts) | 缺少履约动作 API 封装。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 把物流页接回发货和签收动作链；未接通前不要把它当成可运营履约页。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
