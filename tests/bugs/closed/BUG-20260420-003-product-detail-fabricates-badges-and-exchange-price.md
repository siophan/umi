# BUG-20260420-003

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-003` |
| `title` | 商品详情页伪造徽标和换购价格表达 |
| `severity` | `P1` |
| `status` | `closed` |
| `area` | `product/detail` |
| `page` | `/product/[id]` |
| `api` | `/api/products/:id` |
| `owner` | `测试猫` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-product-detail:fabricated-badges-and-exchange-pricing` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

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
| 修复说明 | 商品详情页二次收口后，固定“热卖 / 热门 / 自营 / 认证”等价格与标题徽标已全部删除，固定“正品保证 / 24h发货 / 7天退换 / 顺丰到货”等服务卖点也已改成中性说明；换购链继续保留真实售价、库存抵扣金额和补差价，不再混入页面自造业务表达。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build`；`rg -n "热卖|热门|自营|认证|24h发货|7天退换|顺丰到货|正品保证|优米独家渠道商品" 'apps/web/src/app/product/[id]/page.tsx'` |
| Fixer 自测结果 | 通过。web typecheck 和 Next build 均通过，文本回归检索也确认上述固定业务词已从商品详情页移除。 |
| Verifier 复测结果 | 测试总监代码验证通过，允许关闭。当前详情页已不再本地生成固定“热卖 / 热门 / 自营 / 认证”徽标，也已移除硬编码换购价；换购区剩余提示改为基于真实售价与库存抵扣结果动态计算，不再属于原始伪造问题。 |
| 修复提交/变更 | [apps/web/src/app/product/[id]/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx) |
## Director Re-review

| 字段 | 值 |
| --- | --- |
| `director_owner` | `测试总监` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `director_result` | 通过，关闭。当前 [apps/web/src/app/product/[id]/page.tsx:357](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:357) 已按 `product.tags` 渲染真实标签；代码检索已确认旧的固定“热卖 / 热门 / 自营 / 认证”等文本不再存在；[apps/web/src/app/product/[id]/page.tsx:577](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:577) 到 [apps/web/src/app/product/[id]/page.tsx:595](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/product/[id]/page.tsx:577) 的换购区现在统一使用 `directPrice` 和真实抵扣链路，不再生成 `directPrice - 120` 这类伪造价格。 |
