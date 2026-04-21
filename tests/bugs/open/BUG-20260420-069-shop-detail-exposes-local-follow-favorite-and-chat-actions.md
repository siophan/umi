# BUG-20260420-069

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-069` |
| `title` | 店铺详情页把关注、收藏、客服保留成本地假互动 |
| `severity` | `P1` |
| `status` | `verified` |
| `area` | `shop/detail-actions` |
| `scope` | `user` |
| `page` | `/shop/[id]` |
| `api` | `/api/shops/:id` |
| `owner` | `测试猫` |
| `source_run` | `user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-shop-detail:local-follow-favorite-chat-actions` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 店铺详情页既然已经接了真实店铺读链，就不应继续把关注、收藏、客服这类主交互留在本地演示态；未承接能力要么隐藏，要么明确禁用。 |
| 对齐基准 | 页面动作真实性要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面里的关注、店铺收藏、商品收藏、客服、聊一聊全部只改本地 state 或弹 toast，没有任何真实读写链路。 |
| 影响范围 | 用户会误以为店铺社交和客服动作已上线，实际刷新后状态即丢失，客服也没有真实入口。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开任意 `/shop/[id]`。 |
| 2 | 点击“+ 关注”、底部“收藏”、商品心形、底部“客服/聊一聊”。 |
| 3 | 页面只会本地改样式或弹 toast，没有真实 API、真实客服、也没有持久化。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/shop/[id]/page.tsx:174](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:174) 到 [apps/web/src/app/shop/[id]/page.tsx:200](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:200)。 |
| 底部操作证据 | [apps/web/src/app/shop/[id]/page.tsx:643](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:643) 到 [apps/web/src/app/shop/[id]/page.tsx:666](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:643)。 |
| 日志/断言 | `toggleFollow`、`toggleShopFavorite`、`toggleCardFav` 都只改本地 state；客服和聊一聊只 `showToast(...)`。 |
| 老系统参考 | 旧页同样是演示态 toast，但新页已接真店铺读链，不应继续把这些主交互长期保留成假动作，见 [/Users/ezreal/Downloads/joy/frontend/shop-detail.html](/Users/ezreal/Downloads/joy/frontend/shop-detail.html:553) 到 [/Users/ezreal/Downloads/joy/frontend/shop-detail.html](/Users/ezreal/Downloads/joy/frontend/shop-detail.html:565)。 |
| 相关文件 | [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx) | 成功态仍暴露本地假互动和客服假入口。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已移除 `/shop/[id]` 成功态里的本地假互动：头部关注按钮、商品卡收藏心形、底部收藏/客服/聊一聊入口都不再暴露。页面只保留真实可用的读链和“全部商品/参与竞猜”主动作，避免继续把本地 state 和 toast 伪装成已上线功能。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。店铺详情已不再显示会修改本地 state 的关注/收藏/客服伪交互，页面只保留真实可用动作。 |
| Verifier 复测结果 | 通过。测试猫复核 [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx) 当前实现后确认，头部关注按钮、商品卡收藏心形、底部收藏/客服/聊一聊等本地假互动入口已不再出现在成功态页面中；当前只保留真实可用的读链和“全部商品 / 参与竞猜”等主动作。 |
| 修复提交/变更 | [apps/web/src/app/shop/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx)、[apps/web/src/app/shop/[id]/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.module.css) |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `结论` | `未通过，维持 open` |
| `说明` | [apps/web/src/app/shop/[id]/page.tsx:174](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:174) 到 [apps/web/src/app/shop/[id]/page.tsx:200](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:200) 的 `toggleFollow`、`toggleShopFavorite`、`toggleCardFav` 仍只改本地 state 并弹 toast；[apps/web/src/app/shop/[id]/page.tsx:643](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:643) 到 [apps/web/src/app/shop/[id]/page.tsx:666](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/shop/[id]/page.tsx:666) 的“收藏”“客服”“聊一聊”仍没有真实读写或客服链路。原问题仍在。 |
