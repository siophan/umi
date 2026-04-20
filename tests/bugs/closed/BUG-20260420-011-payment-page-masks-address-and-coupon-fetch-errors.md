# BUG-20260420-011

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-011` |
| `title` | 支付页把地址和优惠券请求失败伪装成“无数据” |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `order/payment` |
| `page` | `/payment` |
| `api` | `/api/address` `/api/coupons` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-payment:address-coupon-failures-masked-as-empty-data` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 地址和优惠券请求失败时，支付页应明确暴露失败，而不是让用户以为自己“没有地址/没有券”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `fetchAddresses()` 和 `fetchCoupons()` 都在 `load()` 内部被 `.catch(() => [])` 吞掉，页面继续按“无地址”“无券”渲染。 |
| 影响范围 | 会直接影响下单判断和支付决策，用户无法区分数据为空和接口异常。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/payment`。 |
| 2 | 让 `/api/address` 或 `/api/coupons` 返回失败。 |
| 3 | 页面仍显示“请先新增收货地址”或“无可用券”，不暴露真实故障。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/payment/page.tsx:79](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:79) 到 [apps/web/src/app/payment/page.tsx:91](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:91)。 |
| 接口证据 | 页面依赖地址和优惠券链路来完成支付前决策。 |
| 日志/断言 | 这两条请求都被就地降级成 `[]`，没有错误态。 |
| 相关文件 | [apps/web/src/app/payment/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/payment/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx) | 地址和优惠券装配失败被伪装成正常空数据。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 地址和优惠券改成独立错误态并提供重试入口；地址失败时不再回退成“请先新增收货地址”，优惠券失败时也不再伪装成无券。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；地址和优惠券失败都已显式暴露，不再伪装成无数据。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/payment/page.tsx:79](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:79) 到 [apps/web/src/app/payment/page.tsx:117](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:117) 的加载逻辑，以及 [apps/web/src/app/payment/page.tsx:278](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:278) 到 [apps/web/src/app/payment/page.tsx:284](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:284) 和 [apps/web/src/app/payment/page.tsx:385](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:385) 到 [apps/web/src/app/payment/page.tsx:393](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx:393) 的渲染分支；地址失败会展示“收货地址加载失败”和重试按钮，优惠券失败会展示独立的内联错误卡，提交按钮也会因地址错误被禁用，不再伪装成单纯“无数据”。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/payment/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.tsx)、[apps/web/src/app/payment/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/payment/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了支付页对 `fetchAddresses`、`fetchCoupons` 的独立异常处理，以及地址区和优惠券区的渲染分支；当前地址失败会展示“收货地址加载失败 + 重新加载”，优惠券失败会展示独立内联错误和重试入口，不再把异常回退成“请先新增收货地址”或“无可用券”的正常空数据语义。 |
