# BUG-20260420-014

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-014` |
| `title` | 搜索页在缺少评分时伪造商品评分 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `search/results` |
| `page` | `/search` |
| `api` | `/api/search` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-search:fabricated-rating-fallbacks` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 搜索结果里的评分应来自真实接口字段；没有评分时应显示无评分或不显示，不应伪造 `4.6/4.7/4.8...`。 |
| 对齐基准 | 页面与接口契约一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `formatProductItem()` 在 `item.rating <= 0` 时按索引生成 `4.6 + 0.1*n` 的假评分。 |
| 影响范围 | 用户搜索时会看到不存在的评分信息，影响购买判断。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/search?q=...`。 |
| 2 | 搜索结果里存在无评分或评分为 0 的商品。 |
| 3 | 页面仍会显示 4.x 的评分，而不是空态。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/search/page.tsx:40](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx:40) 到 [apps/web/src/app/search/page.tsx:46](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx:46)。 |
| 接口证据 | 搜索页消费 `/api/search` 返回的商品结果。 |
| 日志/断言 | `ratingText` 在无评分时回退到 `4.6 + ((index % 4) * 0.1)`。 |
| 相关文件 | [apps/web/src/app/search/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/search/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx) | 搜索结果格式化层伪造了评分展示。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 评分字段只展示真实值；无评分时改为显式“暂无评分”，不再生成 4.x 的伪评分。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；搜索结果不再伪造评分。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/search/page.tsx:37](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx:37) 到 [apps/web/src/app/search/page.tsx:45](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx:37) 的格式化逻辑，以及 [apps/web/src/app/search/page.tsx:517](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx:517) 到 [apps/web/src/app/search/page.tsx:520](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx:517) 的渲染分支；`rating<=0` 时现在返回 `null`，页面展示“暂无评分”，不再伪造评分数字。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/search/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.tsx)、[apps/web/src/app/search/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/search/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了搜索结果格式化函数和商品卡片渲染分支；当前 `ratingText` 只在真实 `item.rating > 0` 时生成，页面缺失评分时明确展示“暂无评分”，没有看到旧的 `4.6/4.7/4.8...` 这类本地伪评分残留。 |
