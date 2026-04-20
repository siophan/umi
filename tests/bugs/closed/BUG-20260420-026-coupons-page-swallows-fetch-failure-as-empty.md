# BUG-20260420-026

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-026` |
| `title` | 优惠券页把优惠券读取失败静默吞成空列表 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `coupon/page` |
| `page` | `/coupons` |
| `api` | `/api/coupons` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-coupons:load-failure-empty-state` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 优惠券列表读取失败时，应显示明确错误态，而不是“暂无优惠券”。 |
| 对齐基准 | 当前产品要求 / 页面错误处理一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `fetchCoupons()` 失败后，页面直接把 `couponsData` 置为空数组，再渲染成正常空券页。 |
| 影响范围 | 用户和修复线程都会把接口异常误判成“没有优惠券”。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/coupons`。 |
| 2 | 让 `/api/coupons` 返回错误或不可达。 |
| 3 | 页面会显示“暂无优惠券”，而不是错误提示。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/coupons/page.tsx:20](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:20) 到 [apps/web/src/app/coupons/page.tsx:30](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:20)。 |
| 接口证据 | 页面通过 [apps/web/src/lib/api/coupons.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/coupons.ts:1) 读取 `/api/coupons`。 |
| 日志/断言 | `catch` 分支执行 `setCouponsData([])`，随后空列表直接走“暂无优惠券”。 |
| 相关文件 | [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx) | 错误态缺失，失败被伪装为空券。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 为券列表引入显式错误态，不要再把读取失败伪装成“暂无优惠券”。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/coupons/page.tsx:21](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:21) 到 [apps/web/src/app/coupons/page.tsx:34](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:21) 的加载逻辑，以及 [apps/web/src/app/coupons/page.tsx:93](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:93) 到 [apps/web/src/app/coupons/page.tsx:101](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:93) 与 [apps/web/src/app/coupons/page.tsx:117](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:117) 到 [apps/web/src/app/coupons/page.tsx:122](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:117) 的渲染分支；失败时页面会显示显式错误信息和重试按钮，只有真实无券时才显示“暂无优惠券”。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx)、[apps/web/src/app/coupons/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了优惠券页 `fetchCoupons()` 的异常分支，以及 `loading/error/coupons.length` 的渲染逻辑；当前读取失败会设置显式 `error` 并展示错误提示和重试按钮，只有真实成功且当前 tab 无券时才显示“暂无优惠券”。 |
