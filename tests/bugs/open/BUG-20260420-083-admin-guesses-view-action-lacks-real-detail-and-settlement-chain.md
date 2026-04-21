# BUG-20260420-083

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-083` |
| `title` | 竞猜列表“查看”只有摘要抽屉，缺少真实详情、审核上下文和开奖链路 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/guesses/detail` |
| `scope` | `admin` |
| `page` | `#/guesses/list` |
| `api` | `/api/admin/guesses` |
| `owner` | `测试狗` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-guesses:view-action-lacks-real-detail-chain` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

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
| 修复说明 | 恢复真实竞猜详情链路，把审核备注、统计、评论、证据和开奖动作接回后台详情页，而不是停留在本地摘要抽屉。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
