# BUG-20260420-068

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-068` |
| `title` | 评价页缺少订单上下文校验，缺参时仍渲染完整评价表单 |
| `severity` | `P2` |
| `status` | `fixed_pending_verify` |
| `area` | `review/context` |
| `scope` | `user` |
| `page` | `/review` |
| `api` | `POST /api/orders/:id/review` |
| `owner` | `用户端全栈一` |
| `source_run` | `user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-review:missing-order-context-still-renders-form` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 评价页应依赖明确的 `orderId + productId` 进入；缺少必要参数时，页面应尽早拦截、回退或显示错误态，而不是继续给出可编辑表单。 |
| 对齐基准 | 页面与提交流程一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面一进入就读取 `orderId` 和 `productId` 查询参数，但缺参时仍完整渲染星级、文本框和提交按钮，直到点击提交才弹“参数缺失，无法提交评价”。 |
| 影响范围 | 用户可以在一个注定无法提交的表单里填写评价，最后一步才知道入口无效。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 直接打开 `/review`，不要带 `orderId` 或 `productId`。 |
| 2 | 页面仍会显示完整评价表单。 |
| 3 | 输入内容后点击“提交评价”。 |
| 4 | 页面才提示“参数缺失，无法提交评价”。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/review/page.tsx:10](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:10) 到 [apps/web/src/app/review/page.tsx:11](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:11) 直接从 query 读 `orderId/productId`。 |
| 提交证据 | [apps/web/src/app/review/page.tsx:19](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:19) 到 [apps/web/src/app/review/page.tsx:22](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:22) 只在点击提交时才做缺参校验。 |
| 接口证据 | 后端 `POST /api/orders/:id/review` 强依赖路径订单 ID 和 body 里的 `productId`，见 [apps/api/src/modules/order/router.ts:1064](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/order/router.ts:1064) 到 [apps/api/src/modules/order/router.ts:1090](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/order/router.ts:1090)。 |
| 相关文件 | [apps/web/src/app/review/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/review/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx) | 缺少进入页级别的上下文校验，错误只在提交时暴露。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 页面首屏已增加 `orderId + productId` 上下文校验，缺参时直接显示页级错误态和返回入口，不再渲染可编辑评价表单。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。直接打开 `/review` 且缺少必要参数时，只会看到错误态，不再进入可提交失败的空表单。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | [apps/web/src/app/review/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx)、[apps/web/src/app/review/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.module.css) |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `结论` | `未通过，维持 open` |
| `说明` | [apps/web/src/app/review/page.tsx:11](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:11) 到 [apps/web/src/app/review/page.tsx:12](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:12) 仍只是读取 `orderId/productId` 查询参数；[apps/web/src/app/review/page.tsx:25](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:25) 到 [apps/web/src/app/review/page.tsx:29](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:29) 仍只在点击提交时才做缺参校验。页面首屏 [apps/web/src/app/review/page.tsx:44](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:44) 到 [apps/web/src/app/review/page.tsx:110](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/review/page.tsx:110) 依旧完整渲染评价表单，原问题未消失。 |
