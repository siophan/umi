# BUG-20260420-064

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-064` |
| `title` | 我的店铺页暴露了未承接的店铺设置和商品管理操作 |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `shop/my-shop-actions` |
| `page` | `/my-shop` |
| `api` | `/api/shops/me` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-my-shop:non-functional-management-actions-exposed` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 我的店铺页只应暴露真实可用的经营动作；未接线的店铺设置、商品编辑、上下架按钮应隐藏、禁用或明确标成未开通，而不是做成可点击主操作。 |
| 对齐基准 | 当前页面能力边界 / 未闭环能力不伪装可用 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面右上角“店铺设置”、商品卡片里的“编辑”“下架”都保持可点击主按钮，但点击后只弹 toast：`店铺设置尚未接入`、`编辑商品尚未接入`、`商品上下架尚未接入`。 |
| 影响范围 | 商家会误以为这些经营操作已可用，直到点击后才发现没有真实链路；这属于把未闭环能力伪装成已上线。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/my-shop`，确保店铺处于已开通状态。 |
| 2 | 点击右上角齿轮按钮，或点击任一商品上的“编辑”“下架”。 |
| 3 | 页面不会进入真实设置/编辑/上下架链路，只会提示“尚未接入”。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/my-shop/page.tsx:390](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:390) 到 [apps/web/src/app/my-shop/page.tsx:404](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:390)。 |
| 商品区证据 | [apps/web/src/app/my-shop/page.tsx:521](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:521) 到 [apps/web/src/app/my-shop/page.tsx:570](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:521)。 |
| 日志/断言 | 这些按钮都没有路由或真实 API 行为，只调用 `showToast('...尚未接入')`。 |
| 相关文件 | [apps/web/src/app/my-shop/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/my-shop/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx) | 已开店成功态仍暴露未接线的经营操作。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已把 `/my-shop` 成功态里未承接的管理动作降掉：右上角店铺设置按钮已移除，商品卡上的“编辑/下架”按钮已移除，并改成统一说明当前只开放查看与上架商品，避免再把 toast 演示态暴露成真实管理入口。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。页面不再暴露会触发“尚未接入”toast 的店铺设置、商品编辑、商品上下架按钮，只保留真实可用动作。 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | [apps/web/src/app/my-shop/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx)、[apps/web/src/app/my-shop/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.module.css) |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `结论` | `未通过，维持 open` |
| `说明` | [apps/web/src/app/my-shop/page.tsx:456](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:456) 的齿轮按钮仍只执行 `showToast('店铺设置尚未接入')`；[apps/web/src/app/my-shop/page.tsx:555](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:555) 到 [apps/web/src/app/my-shop/page.tsx:561](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/my-shop/page.tsx:561) 的“编辑”“下架”仍分别弹出 `编辑商品尚未接入`、`商品上下架尚未接入`。当前页面还在把未闭环管理动作暴露成可点击主操作，没有修复成立证据。 |
