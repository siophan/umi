# BUG-20260420-008

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-008` |
| `title` | 我的店铺页读取失败后错误回退为“申请开店”状态 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `shop/my-shop` |
| `page` | `/my-shop` |
| `api` | `/api/shops/me/status` `/api/shops/me` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-my-shop:status-fetch-failure-falls-back-to-none-state` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 店铺状态读取失败时，页面应显示明确错误态或重试态，不应回退成“你还没开店”。 |
| 对齐基准 | 当前产品要求 / `AGENTS.md` 反模式约束 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `fetchShopStatus()` 失败后，页面把 `shopStatus` 重置为 `none`，随后渲染开店申请表单。 |
| 影响范围 | 已有店铺的用户可能被误导为“未开店”；页面对真实业务状态失真。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/my-shop`。 |
| 2 | 让 `/api/shops/me/status` 返回失败。 |
| 3 | 页面会展示“开店申请”而不是错误页。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/my-shop/page.tsx:101](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:101) 到 [apps/web/src/app/my-shop/page.tsx:130](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:130)，以及 [apps/web/src/app/my-shop/page.tsx:406](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:406)。 |
| 接口证据 | 页面主链路依赖 `/api/shops/me/status` 和 `/api/shops/me`。 |
| 日志/断言 | `catch` 分支里直接 `setShopStatus(initialShopStatus)`。 |
| 相关文件 | [apps/web/src/app/my-shop/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/my-shop/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx) | 失败分支把错误态伪装成“无店铺/申请中”流程。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 增加显式错误态；读取失败时不重置为 `none`；申请表单只应在真实 `status=none/rejected` 时出现。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；状态读取失败分支不再伪装成“未开店”。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/my-shop/page.tsx:142](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:142) 到 [apps/web/src/app/my-shop/page.tsx:154](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:154) 的失败分支，以及 [apps/web/src/app/my-shop/page.tsx:248](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:248) 到 [apps/web/src/app/my-shop/page.tsx:256](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:256) 的渲染逻辑；读取失败时页面现在会显示“店铺状态读取失败”和重试按钮，申请表单只在真实 `none/rejected` 状态下出现。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/my-shop/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了 `/my-shop` 的 `loadPage` 异常分支、店铺状态接口抛错路径，以及 `renderStatusContent` 的状态分流；当前读取失败只会设置显式 `error` 并渲染“店铺状态读取失败 + 重新加载”，不会再把 `shopStatus` 回退成 `none` 后误展示开店申请表单。 |
