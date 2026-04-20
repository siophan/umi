# BUG-20260420-013

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-013` |
| `title` | 上架商品页展示了一整套不会落库的配置 UI |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `shop/add-product` |
| `page` | `/add-product` |
| `api` | `/api/shops/products` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-add-product:step3-config-ui-not-sent-to-api` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 页面上展示给用户填写的竞猜价格、选项数量、补偿券、包邮、自动补货等配置，要么真实提交到后端，要么不展示。 |
| 对齐基准 | 当前产品要求 / 页面与接口契约一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 第 3 步展示了完整的“竞猜设置/补偿券设置/其他设置”，但提交时 `addShopProducts()` 只发送 `brandId` 和 `brandProductIds`。 |
| 影响范围 | 用户会误以为这些配置已经生效，实际后端完全收不到。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/add-product` 并走到第 3 步。 |
| 2 | 修改竞猜价格、选项数量、补偿券和开关项。 |
| 3 | 提交时查看代码可见接口只提交 `brandId` 和 `brandProductIds`。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/add-product/page.tsx:320](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/add-product/page.tsx:320) 到 [apps/web/src/app/add-product/page.tsx:410](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/add-product/page.tsx:410)。 |
| 接口证据 | [apps/web/src/app/add-product/page.tsx:197](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/add-product/page.tsx:197) 到 [apps/web/src/app/add-product/page.tsx:202](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/add-product/page.tsx:202) 的提交 payload。 |
| 日志/断言 | `guessPrice`、`optionCount`、`couponVal`、`couponCond`、`couponDays`、`supportPk`、`expressFree`、`autoRestock` 都没有进入接口。 |
| 相关文件 | [apps/web/src/app/add-product/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/add-product/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/add-product/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/add-product/page.tsx) | 页面展示的配置项和真实接口 payload 严重脱节。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 删除第 3 步里不会落库的竞猜/补偿券/开关配置 UI，改成真实提交确认页，只展示本次实际会提交的品牌和商品信息。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；页面不再展示任何不会进入 `addShopProducts()` payload 的伪配置项。 |
| Verifier 复测结果 | 通过。已复核第 3 步只保留实际提交确认内容，提交 payload 仍仅包含 `brandId` 和 `brandProductIds`，页面不再暴露伪配置项；并通过 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build`。 |
| 修复提交/变更 | [apps/web/src/app/add-product/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/add-product/page.tsx)、[apps/web/src/app/add-product/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/add-product/page.module.css) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 通过。重新核对了 `/add-product` 第 3 步的展示内容和 `addShopProducts()` 提交 payload；当前确认页只保留实际会提交的品牌与商品信息，提交仍仅发送 `brandId`、`brandProductIds`，没有看到旧的竞猜设置、补偿券、包邮、自动补货等伪配置 UI 残留。 |
