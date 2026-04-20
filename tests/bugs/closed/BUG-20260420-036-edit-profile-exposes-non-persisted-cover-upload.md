# BUG-20260420-036

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-036` |
| `title` | 编辑主页页暴露了未承接的封面上传入口 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `user/edit-profile` |
| `page` | `/edit-profile` |
| `api` | `/api/auth/me` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-edit-profile:non-persisted-cover-upload` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 编辑主页页只应暴露当前 `updateMe` payload 能真实保存的资料项；如果没有封面字段，就不应展示“更换封面”。 |
| 对齐基准 | 当前接口契约 / 页面能力边界一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面展示“更换封面”入口，但保存时 `updateMe` payload 没有 `cover` 字段；封面弹层还直接复用了 `rotateAvatar`，表面上像在改封面，实际只会切头像预设。 |
| 影响范围 | 用户会误以为封面可编辑且已保存，实际能力并不存在，属于典型假配置 UI。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/edit-profile`。 |
| 2 | 点击“更换封面”，任选“从相册选择”或“拍照”。 |
| 3 | 再点保存。 |
| 4 | 页面没有任何封面字段提交，且弹层实际触发的是头像切换逻辑。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/edit-profile/page.tsx:198](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:198) 到 [apps/web/src/app/edit-profile/page.tsx:209](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:209)、[apps/web/src/app/edit-profile/page.tsx:269](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:269) 到 [apps/web/src/app/edit-profile/page.tsx:276](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:276)、[apps/web/src/app/edit-profile/page.tsx:418](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:418) 到 [apps/web/src/app/edit-profile/page.tsx:425](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:425)。 |
| 接口证据 | [packages/shared/src/api.ts:303](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:303) 到 [packages/shared/src/api.ts:311](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts:311) 的 `UpdateMePayload` 不包含封面字段。 |
| 日志/断言 | “封面”弹层的两个按钮都直接调用 `rotateAvatar`。 |
| 相关文件 | [apps/web/src/app/edit-profile/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx)、[packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/edit-profile/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx) | 暴露未承接的封面编辑入口，并复用头像切换逻辑。 |
| [packages/shared/src/api.ts](/Users/ezreal/Downloads/joy/umi/packages/shared/src/api.ts) | 当前 `UpdateMePayload` 没有封面字段。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 直接移除未承接的封面编辑入口和相关弹层分支，只保留当前接口真实能保存的头像/资料编辑能力。 |
| 验证命令 | `cd /Users/ezreal/Downloads/joy/umi/apps/web && pnpm typecheck`；`cd /Users/ezreal/Downloads/joy/umi && pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/edit-profile/page.tsx:190](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:190) 到 [apps/web/src/app/edit-profile/page.tsx:214](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:190) 的 `updateMe` payload，以及 [apps/web/src/app/edit-profile/page.tsx:271](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:271) 到 [apps/web/src/app/edit-profile/page.tsx:279](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:271) 和 [apps/web/src/app/edit-profile/page.tsx:406](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:406) 到 [apps/web/src/app/edit-profile/page.tsx:419](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:406) 的头像弹层；页面已不再暴露封面上传入口，只保留当前接口真实可保存的头像与资料编辑能力。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/edit-profile/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx)、[apps/web/src/app/edit-profile/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.module.css) |

## Fixer

| 字段 | 值 |
| --- | --- |
| `fix_owner` | `用户端全栈一` |
| `fix_result` | 编辑主页页不再暴露不会落库的封面上传入口，页面能力和 `updateMe` 契约保持一致。 |
| `self_check` | 已完成代码自查，并通过 `typecheck` / `build`。 |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/web/src/app/edit-profile/page.tsx:194](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:194) 到 [apps/web/src/app/edit-profile/page.tsx:216](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/edit-profile/page.tsx:216) 的保存逻辑，`updateMe` 只提交 `name / avatar / signature / gender / birthday / region / worksPrivacy / favPrivacy`，没有 `cover`；同时当前页面只保留头像入口，代码中已经没有“更换封面”或封面上传分支。按这张单原始问题“暴露未承接的封面上传入口”的口径，可以重新关闭。 |
