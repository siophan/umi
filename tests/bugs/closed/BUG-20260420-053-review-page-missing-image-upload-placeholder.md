# BUG-20260420-053

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-053` |
| `title` | 评价页缺少图片上传占位，页面能力和矩阵要求不一致 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `review/page` |
| `scope` | `user` |
| `page` | `/review` |
| `api` | `POST /api/orders/:id/review` |
| `owner` | `测试猫` |
| `source_run` | `user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-review:missing-image-upload-placeholder` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 评价页至少应按当前矩阵要求保留“图片上传占位”，让页面结构和用户预期完整，即使后端暂未承接图片写链路，也应有明确占位或禁用态。 |
| 对齐基准 | [tests/parity/PAGE-MATRIX.md](/Users/ezreal/Downloads/joy/umi/tests/parity/PAGE-MATRIX.md:68) |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面只有星级评分、文本输入和提交按钮，没有任何晒单图片上传入口、占位框或禁用说明。 |
| 影响范围 | 评价页的信息结构不完整，和当前对齐要求不一致；用户无法理解是否支持晒单图，也没有占位提示。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/review?orderId=...&productId=...`。 |
| 2 | 观察页面主体区。 |
| 3 | 页面仅包含星级、文本框和提交按钮，没有任何图片上传占位。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/review/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:54) 到 [apps/web/src/app/review/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:93) 只渲染了星级、文本输入和提交按钮。 |
| 接口证据 | 当前写链只有 [apps/web/src/lib/api/orders.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/orders.ts:25) 到 [apps/web/src/lib/api/orders.ts](/Users/ezreal/Downloads/joy/umi/apps/web/src/lib/api/orders.ts:27) 的 `reviewOrder(...)`，但页面连上传占位都没有。 |
| 日志/断言 | 当前矩阵已明确写明“对齐星级、文本、图片上传占位”，见 [tests/parity/PAGE-MATRIX.md](/Users/ezreal/Downloads/joy/umi/tests/parity/PAGE-MATRIX.md:68)。 |
| 相关文件 | [apps/web/src/app/review/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/review/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx) | 页面结构缺少晒单图片上传占位。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已为评价页补“晒单图片（暂未开放）”占位区，包含禁用上传卡片、说明文案和占位槽位，和当前矩阵要求保持一致，但不伪装成已接线能力。 |
| 验证命令 | `pnpm typecheck` in `apps/web`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端类型检查和构建通过，评价页已补图片上传占位和禁用说明。 |
| Verifier 复测结果 | 通过。测试猫复核 [apps/web/src/app/review/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx) 当前实现后确认，页面已补“晒单图片（暂未开放）”占位区，包含禁用上传卡片、说明文案和占位槽位，不再缺少矩阵要求的结构。 |
| 修复提交/变更 | `apps/web/src/app/review/page.tsx`；`apps/web/src/app/review/page.module.css` |

## Fixer

- 已补晒单图片上传占位，不再让页面结构缺一块。
- 占位明确标注“暂未开放”，避免把未接线能力伪装成真功能。

## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。复核 [apps/web/src/app/review/page.tsx:86](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:86) 到 [apps/web/src/app/review/page.tsx:99](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:86)，页面已补“晒单图片（暂未开放）”区块，包含禁用上传卡片、说明文案和占位槽位，不再缺少矩阵要求的结构，同时也没有把未接线能力伪装成可用功能。 |
