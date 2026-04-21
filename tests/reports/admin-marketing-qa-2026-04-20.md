# Admin Marketing QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 营销模块 `#/marketing/banners` `#/marketing/checkin` `#/marketing/coupons` `#/marketing/invite` |
| 本轮重点 | 轮播跳转能力、签到统计与 tab 口径、优惠券运营统计、邀请奖励发放上下文 |
| 已确认 Bug | `5` |
| 阻塞项 | `0` |
| 结论 | 营销组当前并非本地空壳，四个页面都已经接上 admin API；但统计链和运营上下文回退明显，签到、优惠券、邀请都丢了老页的关键概览能力，轮播则失去站内页面跳转类型。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/marketing/banners` | `parity_gap` | 基础 CRUD 已接通，但站内页面跳转类型已消失。 |
| `#/marketing/checkin` | `parity_gap` | 奖励配置 CRUD 可用，但统计概览缺失，状态 tab 还会把当前筛选结果冒充全局数量。 |
| `#/marketing/coupons` | `parity_gap` | 模板和发券批次链路可读写，但老页的运营统计卡片和 stats 接口已经不见。 |
| `#/marketing/invite` | `parity_gap` | 奖励配置和邀请关系能读取，但奖励金额、奖励状态和奖励总额统计都已丢失。 |
| `/api/admin/banners` | `parity_gap` | 已承接基础轮播数据，但契约层不再支持站内页面跳转。 |
| `/api/admin/checkin/rewards` | `parity_gap` | 配置链可用，但页面没有正确消费 summary，且缺少 stats 能力。 |
| `/api/admin/coupons` `/api/admin/coupons/{id}/batches` | `parity_gap` | 模板和发券批次可读，但缺少老页使用的统计接口。 |
| `/api/admin/invites/config` `/api/admin/invites/records` | `parity_gap` | 当前只承接邀请关系和配置，未保留奖励发放结果上下文。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-104` | `P2` | `#/marketing/checkin` | 签到配置页状态 tab 只统计当前筛选结果，筛选口径会冒充全局数量 | [tests/bugs/open/BUG-20260420-104-admin-checkin-status-tabs-recompute-counts-from-filtered-rows.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-104-admin-checkin-status-tabs-recompute-counts-from-filtered-rows.md) |
| `BUG-20260420-105` | `P2` | `#/marketing/checkin` | 签到配置页丢失签到统计概览和 stats 链路 | [tests/bugs/open/BUG-20260420-105-admin-checkin-page-lacks-stats-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-105-admin-checkin-page-lacks-stats-chain.md) |
| `BUG-20260420-106` | `P1` | `#/marketing/invite` | 邀请模块丢失奖励发放统计和记录状态上下文 | [tests/bugs/open/BUG-20260420-106-admin-invite-module-drops-reward-issuance-context.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-106-admin-invite-module-drops-reward-issuance-context.md) |
| `BUG-20260420-107` | `P2` | `#/marketing/coupons` | 优惠券页缺少发放使用统计概览和 stats 链路 | [tests/bugs/open/BUG-20260420-107-admin-coupons-page-lacks-issuance-stats-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-107-admin-coupons-page-lacks-issuance-stats-chain.md) |
| `BUG-20260420-108` | `P2` | `#/marketing/banners` | 轮播配置不再支持站内页面跳转 | [tests/bugs/open/BUG-20260420-108-admin-banners-page-no-longer-supports-internal-page-links.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-108-admin-banners-page-no-longer-supports-internal-page-links.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 统计链 | 签到、优惠券、邀请三个模块都存在老页统计能力回退。 |
| 口径真实性 | 签到状态 tab 已出现“当前筛选数量冒充全局数量”的前端假统计。 |
| 运营上下文 | 邀请模块丢失奖励金额和发放状态，后台无法复核奖励是否真的到账。 |
| 配置能力 | 轮播不再支持站内页面跳转，运营可配置类型较老页收缩。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/marketing-banners-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-banners-page.tsx) [apps/admin/src/pages/marketing-checkin-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-checkin-page.tsx) [apps/admin/src/pages/marketing-coupons-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-coupons-page.tsx) [apps/admin/src/pages/marketing-invite-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-invite-page.tsx) |
| 前端 API / 契约 | [apps/admin/src/lib/api/marketing.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/marketing.ts) [apps/admin/src/lib/api/checkin.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/checkin.ts) [apps/admin/src/lib/api/invite.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/invite.ts) [packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts) |
| 后端实现 | [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) [apps/api/src/modules/admin/banners.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/banners.ts) [apps/api/src/modules/admin/checkin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/checkin.ts) [apps/api/src/modules/admin/invites.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/invites.ts) |
| 对照实现 | [admin/src/pages/marketing/banners.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/banners.tsx) [admin/src/pages/marketing/checkin.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/checkin.tsx) [admin/src/pages/marketing/coupons.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/coupons.tsx) [admin/src/pages/marketing/invite.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/invite.tsx) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 补回邀请奖励发放结果上下文，至少让后台能看见奖励金额和发放状态。 |
| `P2` | 给签到页补回统计概览，并改用接口 summary 做 tab 计数。 |
| `P2` | 给优惠券页补回发放/使用统计链，避免只剩模板态。 |
| `P2` | 评估是否恢复轮播站内页面跳转类型。 |
