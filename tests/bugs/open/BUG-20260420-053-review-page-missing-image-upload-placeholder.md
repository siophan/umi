# BUG-20260420-053

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-053` |
| `title` | 评价页缺少图片上传占位，页面能力和矩阵要求不一致 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `review/page` |
| `scope` | `user` |
| `page` | `/review` |
| `api` | `POST /api/orders/:id/review` |
| `owner` | `测试猫` |
| `source_run` | `user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-review:missing-image-upload-placeholder` |
| `fix_owner` |  |
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
| 修复说明 | 待补 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
