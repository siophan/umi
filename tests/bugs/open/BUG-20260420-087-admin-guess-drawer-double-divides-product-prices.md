# BUG-20260420-087

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-087` |
| `title` | 竞猜详情抽屉把商品价格再次按分格式化，奖品价值和竞猜成本会缩小 100 倍 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/guesses/detail-price` |
| `scope` | `admin` |
| `page` | `#/guesses/list` |
| `api` | `/api/admin/guesses` |
| `owner` | `测试狗` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-guesses:drawer-double-divides-prices` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 竞猜详情抽屉应按真实商品金额展示奖品价值和竞猜成本。 |
| 对齐基准 | `GuessSummary.product.price/guessPrice` 在后端构造时已经被折算成元。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 后端在构造 `GuessSummary.product` 时已经把 `price/guessPrice` 除以 `100`；前端抽屉展示时又把这两个值丢进按“分”格式化的 `formatAmount()`，导致展示金额再除一次 `100`。 |
| 影响范围 | 后台在审核或复核竞猜奖品价值时，会看到缩小 `100` 倍的错误金额。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 后端证据 | admin 竞猜列表构造 `GuessSummary.product` 时已经把 `product_price` 和 `product_guess_price` 转成元，见 [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts:357) 到 [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts:367)。 |
| 页面证据 | 详情抽屉仍对 `selected.product.price` 和 `selected.product.guessPrice` 调用了 `formatAmount()`，见 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:343) 到 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:347)。 |
| 格式化证据 | `formatAmount()` 会把传入值再除以 `100` 后格式化成人民币，见 [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:87) 到 [format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:89)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx) | 详情抽屉对已转元金额再次按分格式化。 |
| [guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts) | 当前返回的金额单位和页面格式化假设不一致。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 统一 admin 竞猜详情金额单位；若列表结果已转元，页面应直接展示元，不再走按分格式化。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
