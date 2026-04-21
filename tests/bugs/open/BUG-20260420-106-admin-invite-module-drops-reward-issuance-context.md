# BUG-20260420-106

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-106` |
| `title` | 管理后台邀请模块丢失奖励发放统计和记录状态上下文 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/marketing/invite-reward-context` |
| `scope` | `admin` |
| `page` | `#/marketing/invite` |
| `api` | `/api/admin/invites/records` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-marketing-qa-2026-04-20.md` |
| `fingerprint` | `admin-marketing-invite:drops-reward-issuance-context` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 邀请后台应能像老页一样查看总邀请数、成功注册数、奖励发放总额，以及单条邀请记录的奖励金额和发放状态，方便运营核对奖励是否真的发出。 |
| 对齐基准 | 老后台邀请页的统计卡片和奖励状态字段。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面和接口只保留“邀请关系”信息：邀请人、被邀请人、邀请码、注册时间；奖励金额、奖励发放状态、奖励总额统计都已经消失。 |
| 影响范围 | 后台无法复核邀请奖励是否发放成功，也无法判断发放失败或待发放的记录。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/marketing/invite`。 |
| 2 | 查看邀请列表列和详情抽屉。 |
| 3 | 对照老后台邀请页。 |
| 4 | 当前只能看到邀请关系和注册时间，看不到奖励金额、奖励状态和奖励总额统计。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/marketing-invite-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-invite-page.tsx:112) 到 [apps/admin/src/pages/marketing-invite-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-invite-page.tsx:126) 页面只保存配置和记录列表；[apps/admin/src/pages/marketing-invite-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-invite-page.tsx:148) 到 [apps/admin/src/pages/marketing-invite-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-invite-page.tsx:180) 当前列表列只有邀请关系和注册时间。 |
| 类型定义证据 | [packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:751) 到 [packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:770) `AdminInviteRecordItem` 只保留 inviter/invitee/uid/phone/registeredAt，没有奖励金额或奖励状态字段。 |
| 后端证据 | [apps/api/src/modules/admin/invites.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/invites.ts:348) 到 [apps/api/src/modules/admin/invites.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/invites.ts:390) `/api/admin/invites/records` 只从 `user` 和 `user_profile` 取邀请关系，没有任何奖励发放结果字段；[apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:833) 到 [apps/api/src/modules/admin/router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:873) 当前也未暴露旧页使用的 `/api/admin/invites/stats`。 |
| 对照证据 | [admin/src/pages/marketing/invite.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/invite.tsx:21) 到 [admin/src/pages/marketing/invite.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/invite.tsx:28) 老页记录包含 `rewardStatus` 和 `rewardAmount`，并维护 `totalRewardAmount`；[admin/src/pages/marketing/invite.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/invite.tsx:56) 到 [admin/src/pages/marketing/invite.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/invite.tsx:63) 会同时请求 stats/list/config；[admin/src/pages/marketing/invite.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/invite.tsx:106) 到 [admin/src/pages/marketing/invite.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/invite.tsx:126) 列表和统计卡都展示奖励上下文。 |
| 相关文件 | [apps/admin/src/pages/marketing-invite-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-invite-page.tsx) [apps/api/src/modules/admin/invites.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/invites.ts) [packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts) [admin/src/pages/marketing/invite.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/invite.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/marketing-invite-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-invite-page.tsx) | 页面只消费邀请关系，没有奖励结果展示。 |
| [apps/api/src/modules/admin/invites.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/invites.ts) | records 查询没有奖励结果字段。 |
| [packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts) | 契约层已丢失奖励状态和金额。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
