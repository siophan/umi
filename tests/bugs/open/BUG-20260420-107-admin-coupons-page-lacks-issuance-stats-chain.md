# BUG-20260420-107

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-107` |
| `title` | 管理后台优惠券页缺少发放使用统计概览和 stats 链路 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/marketing/coupons-stats` |
| `scope` | `admin` |
| `page` | `#/marketing/coupons` |
| `api` | `/api/admin/coupons/stats` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-marketing-qa-2026-04-20.md` |
| `fingerprint` | `admin-marketing-coupons:lacks-issuance-stats-chain` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 优惠券后台应像老页一样展示总发放量、已使用、未使用、已过期等运营统计，而不只是模板状态 tab。 |
| 对齐基准 | 老后台优惠券统计卡片和 `/api/admin/coupons/stats` 链路。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面只有模板状态 tab 和模板列表；router 也只暴露 `/coupons`、`/coupons/:id/batches`、模板写接口和发券接口，没有旧页的 `/api/admin/coupons/stats`。 |
| 影响范围 | 运营无法直接看到发券效果，只能看模板配置状态，缺少已发放、已使用、过期这些真实运营指标。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/marketing/coupons`。 |
| 2 | 对照老后台优惠券页。 |
| 3 | 观察页面顶部和数据请求。 |
| 4 | 当前没有任何发放/使用统计卡，也没有 `/api/admin/coupons/stats` 读链路。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/marketing-coupons-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-coupons-page.tsx:202) 到 [apps/admin/src/pages/marketing-coupons-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-coupons-page.tsx:220) 当前只请求 `fetchAdminCoupons()`；[apps/admin/src/pages/marketing-coupons-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-coupons-page.tsx:297) 到 [apps/admin/src/pages/marketing-coupons-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-coupons-page.tsx:306) 顶部只剩模板状态 tab；[apps/admin/src/pages/marketing-coupons-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-coupons-page.tsx:538) 到 [apps/admin/src/pages/marketing-coupons-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-coupons-page.tsx:562) 页面直接进入表格，没有老页那组统计卡。 |
| 路由证据 | [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:875) 到 [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:967) 只暴露模板和发券批次接口，未见 `/api/admin/coupons/stats`。 |
| 对照证据 | [admin/src/pages/marketing/coupons.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/coupons.tsx:50) 到 [admin/src/pages/marketing/coupons.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/coupons.tsx:58) 老页会同时请求 `/api/admin/coupons/stats` 和列表；[admin/src/pages/marketing/coupons.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/coupons.tsx:148) 到 [admin/src/pages/marketing/coupons.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/coupons.tsx:160) 还展示总发放量、已使用、未使用、已过期。 |
| 相关文件 | [apps/admin/src/pages/marketing-coupons-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-coupons-page.tsx) [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) [admin/src/pages/marketing/coupons.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/coupons.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/marketing-coupons-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-coupons-page.tsx) | 页面只保留模板列表和状态 tab。 |
| [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) | 缺少优惠券运营统计接口。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
