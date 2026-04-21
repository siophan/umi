# Admin Guesses QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 竞猜模块 `#/guesses/list` `#/guesses/create` `#/guesses/friends` `#/pk` |
| 本轮重点 | 主列表读链、分类筛选、查看动作、创建入口、金额口径、好友竞猜状态与操作链、PK 统计概览 |
| 已确认 Bug | `9` |
| 阻塞项 | `0` |
| 结论 | 竞猜模块当前已经接上基础读链和审核写链，但列表把分类字典失败扩大成整页失败，查看动作仍停留在摘要抽屉，创建入口则直接落到空壳页；同时分类筛选、金额展示、好友竞猜状态机和 PK 首屏概览也存在明显口径问题。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/guesses/list` 列表 / 筛选 / 查看 / 审核 | `parity_gap` | 主表与分类失败面耦合，查看动作缺真实详情链路，分类筛选存在停用分类漏数和同名精度问题，抽屉金额展示错口径。 |
| `#/guesses/create` | `parity_gap` | 入口可达，但页面本体只是检查卡片，没有创建表单或写链。 |
| `#/guesses/friends` | `parity_gap` | 详情和强制结算链缺失，状态机把“待确认”压扁进泛化状态。 |
| `#/pk` | `parity_gap` | 列表仍在，但旧页统计概览和对应 stats 链路已经缺失。 |
| `/api/admin/guesses` `/api/admin/guesses/{id}/review` | `parity_gap` | 只覆盖列表读链和审核写链，缺少 admin 创建和详情承接。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-082` | `P2` | `#/guesses/list` | 竞猜列表把分类接口失败误当成整页失败，辅助字典异常会清空主表 | [tests/bugs/open/BUG-20260420-082-admin-guesses-page-clears-main-table-when-categories-request-fails.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-082-admin-guesses-page-clears-main-table-when-categories-request-fails.md) |
| `BUG-20260420-083` | `P1` | `#/guesses/list` | 竞猜列表“查看”只有摘要抽屉，缺少真实详情、审核上下文和开奖链路 | [tests/bugs/open/BUG-20260420-083-admin-guesses-view-action-lacks-real-detail-and-settlement-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-083-admin-guesses-view-action-lacks-real-detail-and-settlement-chain.md) |
| `BUG-20260420-084` | `P1` | `#/guesses/create` | 创建竞猜入口跳到空壳页面，没有表单和创建写链路 | [tests/bugs/open/BUG-20260420-084-admin-guess-create-route-is-an-empty-shell.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-084-admin-guess-create-route-is-an-empty-shell.md) |
| `BUG-20260420-085` | `P2` | `#/guesses/list` | 竞猜分类筛选只显示启用分类，现存停用分类下的竞猜无法被筛出 | [tests/bugs/open/BUG-20260420-085-admin-guesses-category-filter-hides-disabled-categories.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-085-admin-guesses-category-filter-hides-disabled-categories.md) |
| `BUG-20260420-086` | `P2` | `#/guesses/list` | 竞猜分类筛选只用分类名称，不足以区分树形分类里的同名节点 | [tests/bugs/open/BUG-20260420-086-admin-guesses-category-filter-uses-name-instead-of-category-id.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-086-admin-guesses-category-filter-uses-name-instead-of-category-id.md) |
| `BUG-20260420-087` | `P1` | `#/guesses/list` | 竞猜详情抽屉把商品价格再次按分格式化，奖品价值和竞猜成本会缩小 100 倍 | [tests/bugs/open/BUG-20260420-087-admin-guess-drawer-double-divides-product-prices.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-087-admin-guess-drawer-double-divides-product-prices.md) |
| `BUG-20260420-088` | `P1` | `#/guesses/friends` | 好友竞猜页只剩摘要抽屉，缺少详情跳转和强制结算链路 | [tests/bugs/open/BUG-20260420-088-admin-friend-guesses-lacks-detail-and-force-settlement-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-088-admin-friend-guesses-lacks-detail-and-force-settlement-chain.md) |
| `BUG-20260420-089` | `P2` | `#/guesses/friends` | 好友竞猜状态被压扁成“待开赛/进行中/已结束”，丢失“待确认”阶段 | [tests/bugs/open/BUG-20260420-089-admin-friend-guesses-collapses-pending-confirm-state.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-089-admin-friend-guesses-collapses-pending-confirm-state.md) |
| `BUG-20260420-090` | `P2` | `#/pk` | PK 对战页缺少旧页统计概览和 stats 链路 | [tests/bugs/open/BUG-20260420-090-admin-pk-page-lacks-summary-stats-chain.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-090-admin-pk-page-lacks-summary-stats-chain.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 失败面 | 列表页把分类字典失败扩大成整页失败。 |
| 详情链路 | 查看动作仍是本地摘要抽屉，没有详情、统计、评论、证据或开奖动作。 |
| 创建链路 | 创建入口存在，但创建页只是只读空壳，后台也没有对应创建写接口。 |
| 筛选口径 | 分类筛选同时存在停用分类漏数和同名分类精度不足。 |
| 金额口径 | 详情抽屉把已转元金额再次按分格式化。 |
| 好友竞猜状态机 | “待确认”阶段被状态压缩吃掉，好友竞猜也失去了详情 / 强制结算动作。 |
| PK 概览 | PK 模块当前只剩列表，没有旧页的总数 / 进行中 / 已结算概览。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx) [apps/admin/src/pages/guess-create-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guess-create-page.tsx) [apps/admin/src/pages/friend-guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/friend-guesses-page.tsx) |
| 前端 API 封装 | [apps/admin/src/lib/api/catalog.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog.ts) [apps/admin/src/lib/api/categories.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/categories.ts) [apps/admin/src/lib/format.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/format.ts) |
| 后端实现 | [apps/api/src/modules/admin/guesses.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guesses.ts) [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) |
| 对照实现 | [admin/src/pages/guesses/detail.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/detail.tsx) [admin/src/pages/guesses/create.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/create.tsx) [admin/src/pages/guesses/friends.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/friends.tsx) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 把竞猜详情和开奖链路接回后台，不再只停留在列表摘要抽屉。 |
| `P1` | 补齐 admin 创建竞猜写链和对应表单页；未接通前不要继续暴露主 CTA。 |
| `P1` | 修正详情抽屉金额单位，避免后台按错误奖品价值审核。 |
| `P1` | 把好友竞猜详情和强制结算链接回后台，不要只剩摘要抽屉。 |
| `P2` | 拆开主表和分类字典的失败处理。 |
| `P2` | 分类筛选补回停用但仍在用的分类，并改成按 `categoryId` 精确筛选。 |
| `P2` | 恢复好友竞猜“待确认”这类可运营状态。 |
| `P2` | 补回 PK stats 链路和首页概览卡。 |
