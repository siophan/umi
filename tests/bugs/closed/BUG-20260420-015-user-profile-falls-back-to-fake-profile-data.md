# BUG-20260420-015

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-015` |
| `title` | 用户主页读取失败后回退成伪造的默认主页数据 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `user/profile` |
| `page` | `/user/[uid]` |
| `api` | `/api/users/:id` `/api/users/:id/activity` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-user-profile:api-failure-falls-back-to-fake-profile` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 用户主页读取失败时，应显示明确错误态或空态，不应回退成伪造的“默认主页/预置主页”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面内置了 `fallbackProfiles` 和 `buildDefaultProfile()`，接口失败后直接展示这些伪造数据，并提示“已显示默认主页”。 |
| 影响范围 | 用户会看到并操作不存在的主页内容，页面与真实接口状态完全脱节。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开任意 `/user/[uid]`。 |
| 2 | 让 `/api/users/:id` 或 `/api/users/:id/activity` 返回失败。 |
| 3 | 页面不会显示错误，而会展示预置的假主页数据。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/user/[uid]/page.tsx:56](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[uid]/page.tsx:56) 到 [apps/web/src/app/user/[uid]/page.tsx:213](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[uid]/page.tsx:213)，以及 [apps/web/src/app/user/[uid]/page.tsx:365](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[uid]/page.tsx:365) 到 [apps/web/src/app/user/[uid]/page.tsx:371](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[uid]/page.tsx:365)。 |
| 接口证据 | 页面主链路依赖 `/api/users/:id` 和 `/api/users/:id/activity`。 |
| 日志/断言 | `catch` 分支直接 `setProfile(fallbackProfile)` 并 `setToast('已显示默认主页')`。 |
| 相关文件 | [apps/web/src/app/user/[uid]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[uid]/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/user/[uid]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[uid]/page.tsx) | 页面把失败分支伪装成了“有默认数据的正常主页”。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 去掉正式链路里的 `fallbackProfiles / buildDefaultProfile` 回退；接口失败时改成显式错误页和重试入口，不再展示演示主页数据。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；用户主页失败时不再回退成默认假主页。 |
| Verifier 复测结果 | 通过。已复核失败分支不再注入 `fallbackProfiles` 或默认主页，页面改为显式错误态和重试入口；并通过 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build`。 |
| 修复提交/变更 | [apps/web/src/app/user/[uid]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[uid]/page.tsx)、[apps/web/src/app/user/[uid]/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/user/[uid]/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了用户主页首屏加载链、失败分支以及 `!profile` 时的渲染路径；当前接口失败只会清空 `profile` 并展示“用户主页加载失败 + 重新加载”的错误页，没有看到旧的 `fallbackProfiles`、默认主页数据或“已显示默认主页”提示残留。 |
