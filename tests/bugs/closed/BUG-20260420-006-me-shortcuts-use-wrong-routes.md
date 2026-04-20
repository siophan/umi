# BUG-20260420-006

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-006` |
| `title` | 个人中心快捷入口使用了错误路由 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `me/navigation` |
| `page` | `/me` |
| `api` |  |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-me:shortcut-links-use-nonexistent-routes` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 个人中心“我的店铺”“全部功能”等快捷入口应跳到真实存在的业务路由。 |
| 对齐基准 | 当前 `apps/web/src/app` 实际路由结构 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `/me` 的快捷入口写成了 `/myshop` 和 `/all-features`，而当前工作区真实页面是 `/my-shop` 和 `/features`。 |
| 影响范围 | 用户从个人中心进入对应功能会跳错页或 404。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/me`。 |
| 2 | 点击“我的店铺”或“全部功能”。 |
| 3 | 页面会跳到错误路由，而不是当前真实页面。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/me/page.tsx:20](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/page.tsx:20) 到 [apps/web/src/app/me/page.tsx:24](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/page.tsx:24)。 |
| 接口证据 | 不涉及接口，属于页面路由对齐错误。 |
| 日志/断言 | 当前工作区真实页面文件分别是 [apps/web/src/app/my-shop/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx) 和 [apps/web/src/app/features/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/features/page.tsx)。 |
| 相关文件 | [apps/web/src/app/me/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/me/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/page.tsx) | 快捷入口 href 和真实路由不一致。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | `/me` 顶部快捷入口和开店弹层跳转已统一切回真实主路由：`/myshop` 改为 `/my-shop`，`/all-features` 改为 `/features`。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；`/me` 页面内已不再引用错误快捷路由。 |
| Verifier 复测结果 | 通过。已复核快捷入口 `href` 已改为真实路由 `/my-shop` 和 `/features`，未再引用旧错误路径；并通过 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build`。 |
| 修复提交/变更 | [apps/web/src/app/me/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/me/page.tsx) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了 `/me` 页面顶部快捷入口数组和开店弹层确认跳转；当前“我的店铺”指向 `/my-shop`，“全部功能”指向 `/features`，申请开店确认动作也落到 `/my-shop`，没有看到旧的 `/myshop` 或 `/all-features` 错误路由残留。 |
