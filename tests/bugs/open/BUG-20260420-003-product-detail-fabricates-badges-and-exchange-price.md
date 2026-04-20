# BUG-20260420-003

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-003` |
| `title` | 商品详情页伪造徽标和换购价格表达 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `product/detail` |
| `page` | `/product/[id]` |
| `api` | `/api/products/:id` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-product-detail:fabricated-badges-and-exchange-pricing` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 商品详情页的徽标、价格、换购表达应严格基于接口字段和真实业务规则，不应在页面内自行编造“优惠价”或固定标签。 |
| 对齐基准 | 当前产品要求 / `apps/api` 实际接口语义 / 老系统商品详情页信息结构 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面直接用 `directPrice - 120` 生成伪“换购价”，固定渲染“自营 / 认证 / 竞猜”标签，并在换购区域展示固定 `¥0 免费换购` 风格表达。 |
| 影响范围 | 商品价格感知、徽标语义和换购决策都可能错误，页面对外展示的业务语义不可信。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开任意 `/product/[id]`。 |
| 2 | 观察主信息区的徽标、价格和换购板块。 |
| 3 | 对比代码可见这部分不是服务端返回，而是页面本地拼装。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/product/[id]/page.tsx:109](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:109)、[apps/web/src/app/product/[id]/page.tsx:239](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:239)、[apps/web/src/app/product/[id]/page.tsx:500](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:500)、[apps/web/src/app/product/[id]/page.tsx:686](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:686)。 |
| 接口证据 | 页面已接 `/api/products/:id`，但展示层仍自造价格和标签。 |
| 日志/断言 | `invPrice = directPrice - 120` 与固定标签写死在页面内，不是接口契约。 |
| 相关文件 | [apps/web/src/app/product/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/product/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx) | 价格、标签和换购说明混入页面自定义业务逻辑。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 商品详情页已删除固定“热门 / 低价”价格徽标和固定“自营 / 认证 / 竞猜”标题徽标，改成仅展示接口返回的真实 `product.tags`；页面内的伪 `invPrice = directPrice - 120` 已移除，换购区只展示真实商品售价、库存抵扣金额和实时补差价，不再伪造“换购价 / 免费换购”。退回后又移除了 `product.tags` 为空时的本地回退标签，以及“正品保证 / 24h发货 / 7天退换”等固定业务徽标，统一改成真实标签或中性提示。 |
| 验证命令 | `pnpm typecheck`（cwd=`apps/web`）；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。前端 TypeScript 校验通过，Next 生产构建通过；商品详情页不再出现页面本地计算的伪换购价、空标签回退或固定业务徽标。 |
| Verifier 复测结果 | 通过。测试猫独立复核了 [apps/web/src/app/product/[id]/page.tsx:290](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:290) 到 [apps/web/src/app/product/[id]/page.tsx:315](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:290) 的标签区、[apps/web/src/app/product/[id]/page.tsx:452](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:452) 到 [apps/web/src/app/product/[id]/page.tsx:464](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:452) 的服务信息区，以及 [apps/web/src/app/product/[id]/page.tsx:479](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:479) 到 [apps/web/src/app/product/[id]/page.tsx:521](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:479) 的换购区；页面已不再本地计算伪换购价，也不再写死“自营 / 认证 / 竞猜”“正品保证 / 24h发货 / 7天退换”等业务徽标，展示内容收敛到真实商品字段或中性说明。同时沿用本轮已通过的 `pnpm --filter @umi/web typecheck` 与 `pnpm --filter @umi/web build` 作为机械校验。 |
| 修复提交/变更 | [apps/web/src/app/product/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `director_result` | 不通过。换购价伪造问题已经收掉，但当前页面在 [apps/web/src/app/product/[id]/page.tsx:335](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:335) 仍写死了 `热门` 徽标，和 bug 单里“已删除固定热门/低价标签”的修复说明不一致；这说明固定业务徽标仍有残留，当前单不应继续保持 `verified`。 |
