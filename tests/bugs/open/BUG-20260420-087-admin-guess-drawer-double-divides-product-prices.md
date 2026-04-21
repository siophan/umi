# BUG-20260420-087

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-087` |
| `title` | 竞猜详情抽屉把商品价格再次按分格式化，奖品价值和竞猜成本会缩小 100 倍 |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/guesses/detail-price` |
| `scope` | `admin` |
| `page` | `#/guesses/list` |
| `api` | `/api/admin/guesses` |
| `owner` | `测试狗` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-guesses:drawer-double-divides-prices` |
| `fix_owner` | `用户端全栈一` |
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
| 修复说明 | 旧的竞猜摘要抽屉链路已经被真实详情页替换，当前 `#/guesses/detail/:id` 走独立的 `/api/admin/guesses/:id` 详情接口；该接口返回的商品金额仍然是“分”，页面继续用 `formatAmount()` 格式化为元，不再存在“列表里已转元再二次除 100”的旧问题。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过：当前代码里已无旧摘要抽屉链路，竞猜详情页金额来源和格式化口径一致，后台类型检查和构建成功。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | [apps/admin/src/pages/guess-detail-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guess-detail-page.tsx)；[apps/api/src/modules/admin/guess-management.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guess-management.ts) |
