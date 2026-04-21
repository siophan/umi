# BUG-20260420-040

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-040` |
| `title` | 用户列表页“店主”标签计数与实际过滤口径不一致 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/users/summary` |
| `scope` | `admin` |
| `page` | `#/users/list` |
| `api` | `/api/admin/users` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-user-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-users:list-shop-owner-tab-count-mismatch` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | “店主”标签页的计数应与页面实际 `shop_owner` 过滤口径完全一致；如果只统计“已认证店铺”，标签名称和过滤逻辑也应同步改成同一语义。 |
| 对齐基准 | 当前产品要求 / 管理后台统计口径一致性要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面把“店主”标签计数绑定到 `summary.verifiedUsers`，但 `shop_owner` 行角色和后端过滤逻辑却使用“已认证店铺 或 只要存在店铺名”这一更宽口径。 |
| 影响范围 | 在存在“有店铺名但未认证”的用户时，列表行会显示为“店主”，并能出现在“店主”筛选结果里，但顶部标签计数不会把这些用户算进去，导致统计与列表不一致。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 准备一个 `shop_name` 非空、但店铺状态不是已认证的用户。 |
| 2 | 打开 `#/users/list` 并查看“店主”标签计数。 |
| 3 | 切换到“店主”标签，可看到该用户仍会进入列表，但顶部计数不会包含它。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | “店主”标签直接显示 `summary.verifiedUsers`，见 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:525) 到 [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:531)。 |
| 接口证据 | 后端汇总 `verifiedUsers` 只统计 `shop.status = 10` 的用户，见 [admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:36) 到 [admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:67)。 |
| 日志/断言 | 但 `shop_owner` 过滤和角色判定都使用更宽的“`shop_verified > 0 OR shop_name 非空`”逻辑，见 [admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:22) 到 [admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:28) 和 [model.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/model.ts:39) 到 [model.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/model.ts:43)。 |
| 相关文件 | [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx) [admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts) [model.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/model.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx) | “店主”标签计数取值和筛选含义不一致。 |
| [admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts) | 汇总统计和 `shop_owner` 过滤使用了两套口径。 |
| [model.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/model.ts) | 行级 `role` 判定也沿用了更宽的店主语义。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 把“店主”标签计数、行级 `role` 和 `shop_owner` 后端过滤统一成“已认证店铺”口径，不再把仅有店铺名但未认证的用户算进店主结果。本轮又把前台展示文案从泛化的“店主”收成“认证店主”，让标签名称、行级角色和真实过滤语义一致。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 通过。后台用户列表中的标签页和角色标签都已显示为“认证店主”，与当前已认证店铺口径一致。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前后端 `shop_owner` 过滤、汇总统计和行级角色都已统一走 `shop_verified` 口径；前端标签与角色文案也已收口为“认证店主”，统计和展示语义一致。 |
| 修复提交/变更 | [apps/api/src/modules/users/admin-store.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts)、[apps/api/src/modules/users/model.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/model.ts)、[apps/admin/src/pages/users-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx)、[apps/admin/src/lib/format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | “认证店主”标签、列表筛选和行级角色已统一到已认证店铺口径，顶部统计、筛选结果和展示文案一致。 |
| `self_check` | 已完成代码自查，并通过 `admin typecheck`。 |

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/api/src/modules/users/admin-store.ts:28](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:28) 到 [apps/api/src/modules/users/admin-store.ts:33](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:33)、[apps/api/src/modules/users/admin-store.ts:47](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:47) 到 [apps/api/src/modules/users/admin-store.ts:60](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/admin-store.ts:47)、[apps/api/src/modules/users/model.ts:32](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/model.ts:32) 到 [apps/api/src/modules/users/model.ts:37](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/users/model.ts:32)，`shop_owner` 过滤、汇总统计和行级角色都已统一使用 `shop_verified`；同时 [apps/admin/src/pages/users-page.tsx:563](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:563) 到 [apps/admin/src/pages/users-page.tsx:568](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/users-page.tsx:568) 与 [apps/admin/src/lib/format.ts:28](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts:28) 已统一展示为“认证店主”。按代码口径，这张单的统计和展示语义已经一致。 |
