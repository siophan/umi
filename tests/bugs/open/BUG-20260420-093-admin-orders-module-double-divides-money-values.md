# BUG-20260420-093

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-093` |
| `title` | 订单列表和交易流水把已转元金额再次按分格式化，金额会缩小 100 倍 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/orders/amount-format` |
| `scope` | `admin` |
| `page` | `#/orders/list` / `#/orders/transactions` |
| `api` | `/api/admin/orders` `/api/admin/orders/transactions` |
| `owner` | `测试狗` |
| `source_run` | `admin-orders-qa-2026-04-20.md` |
| `fingerprint` | `admin-orders:double-divides-money-values` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 后端已经把金额从“分”转成“元”后，前端应直接按元格式化，不应再次除以 100。 |
| 对齐基准 | 订单和流水金额应与数据库语义、老后台金额显示保持一致。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 后端 `toMoney()` 已把金额除以 100 转成元，前端又统一走 `formatAmount()` 再除一次，导致订单金额、优惠金额、明细金额和交易流水金额全部缩小 100 倍。 |
| 影响范围 | 运营会按错误金额复核订单和退款流水，金额越大偏差越明显。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 后端金额证据 | admin orders 模块的 `toMoney()` 已统一 `Number(value ?? 0) / 100`，见 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:289) 到 [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts:291)。 |
| 订单页证据 | 订单列表和抽屉继续对 `amount/originalAmount/couponDiscount/itemAmount` 使用 `formatAmount()`，见 [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx:173) 到 [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx:179) 以及 [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx:294) 到 [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx:338)。 |
| 交易页证据 | 交易流水页金额列和抽屉同样继续使用 `formatAmount()`，见 [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx:114) 到 [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx:120) 以及 [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx:193) 到 [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx:193)。 |
| 格式化证据 | `formatAmount()` 仍会执行 `value / 100`，见 [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:78) 到 [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:80)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [orders.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/orders.ts) | 已把金额转成元。 |
| [orders-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/orders-page.tsx) | 再次按分格式化订单金额。 |
| [order-transactions-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/order-transactions-page.tsx) | 再次按分格式化交易金额。 |
| [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts) | 当前金额格式化默认按“分”处理。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 统一订单后台金额单位契约，避免后端转元后前端再除一次。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
