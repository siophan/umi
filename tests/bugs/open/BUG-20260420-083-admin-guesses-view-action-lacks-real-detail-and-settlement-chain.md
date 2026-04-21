# BUG-20260420-083

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-083` |
| `title` | 竞猜列表“查看”只有摘要抽屉，缺少真实详情、审核上下文和开奖链路 |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/guesses/detail` |
| `scope` | `admin` |
| `page` | `#/guesses/list` |
| `api` | `/api/admin/guesses` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-guesses:view-action-lacks-real-detail-chain` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | “查看”应进入真实详情链路，能够复核竞猜基础信息、审核备注、统计、评论、Oracle 证据和开奖动作。 |
| 对齐基准 | 老后台详情页已承接 `guessApi.get/stats/comments/review/settle/cancel`，并带审核、开奖、证据链路。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前列表页“查看”只打开本地摘要抽屉，抽屉只展示商品、品牌、价格和选项热度；当前路由表里也没有 `#/guesses/:id` 详情页。 |
| 影响范围 | 后台无法在当前实现里完成竞猜详情复核、审核原因回看、开奖或证据追溯。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | “查看”只执行 `setSelected(record)` 打开抽屉，抽屉内容只展示商品信息、审核状态和选项热度，见 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:196) 到 [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx:385)。 |
| 路由证据 | 当前后台只注册了 `#/guesses/list`、`#/guesses/create`、`#/guesses/friends`，没有竞猜详情页路由，见 [App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx:86) 到 [App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx:95)。 |
| 老后台对照 | 老后台详情页会读取竞猜详情、统计、评论，并支持审核、取消、开奖和 Oracle 证据，见 [detail.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/detail.tsx:67) 到 [detail.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/guesses/detail.tsx:215)。 |
| 项目目标证据 | README 已明确下一阶段要在 `apps/admin` 接“竞猜审核、开奖、订单履约”，见 [README.md](/Users/ezreal/Downloads/joy/umi/README.md:234) 到 [README.md](/Users/ezreal/Downloads/joy/umi/README.md:240)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [guesses-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx) | 查看动作只剩本地摘要抽屉。 |
| [App.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/App.tsx) | 缺少竞猜详情路由承接。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已把“查看”从本地摘要抽屉切回真实详情链路：新增 `GET /api/admin/guesses/{id}` 聚合详情接口，返回竞猜基础信息、选项与投注统计、审核日志、评论和 Oracle 证据；后台新增 `#/guesses/detail/:id` 详情页和对应路由承接，列表“查看”改为跳转详情页，旧摘要抽屉已删除。当前工作区尚无后台开奖/取消写接口，因此详情页不会再暴露假动作按钮。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。竞猜列表“查看”现在会进入真实详情页，能查看基础信息、审核日志、下注统计、评论和 Oracle 证据，并可在详情页继续完成审核通过/拒绝；API 与 admin 构建验证均通过。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/guess-management.ts`；`/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/routes/content-routes.ts`；`/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts`；`/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guess-detail-page.tsx`；`/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/guesses-page.tsx`；`/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-page-registry.tsx`；`/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-navigation.tsx`；`/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog-guesses.ts`；`/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/catalog-shared.ts` |
