# BUG-20260420-098

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-098` |
| `title` | 物流管理“物流方式”筛选值和返回文案不一致，大部分选项永远筛不出来 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/logistics/shipping-type-filter` |
| `scope` | `admin` |
| `page` | `#/orders/logistics` |
| `api` | `/api/admin/orders/logistics` |
| `owner` | `测试狗` |
| `source_run` | `admin-orders-qa-2026-04-20.md` |
| `fingerprint` | `admin-logistics:shipping-type-filter-does-not-match-returned-labels` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 筛选器选项值应与列表实际 `shippingTypeLabel` 一致，选中后能正确命中快递/同城/自提/未知记录。 |
| 对齐基准 | 一个筛选控件只能对应一个明确字段和值域。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面筛选用的是“快递 / 同城配送 / 到店自提 / 未知”，但后端返回的是“快递物流 / 同城配送 / 用户自提 / 待确认”；前端又拿 `record.shippingTypeLabel !== filters.shippingType` 直接比较。 |
| 影响范围 | “快递”“到店自提”“未知”这几个选项在当前实现里不会匹配任何记录。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 前端筛选值来自固定 options，过滤时直接与 `shippingTypeLabel` 比较，见 [order-logistics-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-logistics-page.tsx:57) 到 [order-logistics-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-logistics-page.tsx:68) 以及 [order-logistics-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-logistics-page.tsx:118) 到 [order-logistics-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-logistics-page.tsx:128)。 |
| 后端证据 | 后端文案实际返回“快递物流 / 同城配送 / 用户自提 / 待确认”，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:319) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:330)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [order-logistics-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-logistics-page.tsx) | 筛选值和比较字段不一致。 |
| [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts) | 后端返回文案与前端选项口径不一致。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 把物流方式筛选改成对同一语义字段过滤，不要用不同文案直接比较。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
