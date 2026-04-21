# BUG-20260420-102

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-102` |
| `title` | 寄售市场把已转元金额再次按分格式化，挂单价和成交价会缩小 100 倍 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/warehouse/consign-amount-format` |
| `scope` | `admin` |
| `page` | `#/warehouse/consign` |
| `api` | `/api/admin/orders/consign` |
| `owner` | `测试狗` |
| `source_run` | `admin-warehouse-qa-2026-04-20.md` |
| `fingerprint` | `admin-warehouse:consign-page-double-divides-money-values` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 后端寄售金额转成元后，前端应直接按元展示。 |
| 对齐基准 | 寄售挂单价、成交价、佣金和卖家到账都应与仓库真实金额一致。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `/api/admin/orders/consign` 后端已用 `toMoney()` 把金额转成元，寄售页却继续对 `listingPrice/price/commissionAmount/sellerAmount` 使用 `formatAmount()`，导致所有金额缩小 100 倍。 |
| 影响范围 | 后台会按错误价格复核寄售单和结算金额。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 后端证据 | 寄售读链会把 `sale_amount/consign_price/commission_amount/seller_amount` 统一走 `toMoney()`，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:896) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:923)。 |
| 页面证据 | 寄售页列表和抽屉继续对这些字段使用 `formatAmount()`，见 [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx:136) 到 [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx:139) 以及 [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx:218) 到 [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx:221)。 |
| 格式化证据 | `formatAmount()` 会执行 `value / 100`，见 [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:78) 到 [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:80)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts) | 后端寄售金额已转元。 |
| [warehouse-consign-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/warehouse-consign-page.tsx) | 前端再次按分格式化寄售金额。 |
| [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts) | 金额格式化默认按分处理。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 统一寄售后台金额单位契约，避免后端转元后前端再除一次。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
