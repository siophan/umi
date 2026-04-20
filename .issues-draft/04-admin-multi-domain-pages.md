TITLE: 管理台多个页面名字就暴露了"多业务塞一个文件"，违反 AGENTS.md 单页单文件规则

LABELS: frontend, admin, refactor

BODY:
## 现象

`apps/admin/src/pages/` 下有一批明显是多业务混合的单文件：

| 文件 | 行数 | 合并了的业务域 |
| --- | --- | --- |
| `content-system-page.tsx` | 849 | 内容 + 系统 |
| `user-merchant-page.tsx` | 824 | 用户 + 商户 |
| `product-guess-page.tsx` | 719 | 商品 + 竞猜 |
| `marketing-page.tsx` | 701 | 运营活动（多子模块） |
| `order-fulfillment-page.tsx` | 552 | 订单 + 履约 |

## 为什么不合理

`AGENTS.md` 里是硬性规则：

> 后台页面优先按"单页单文件"组织。不要再为了省事把多个路由长期塞进一个页面文件里；如果暂时合并，只能作为短期过渡，并且下一步要继续拆掉。

这些文件的**命名本身**就承认自己塞了两块业务（`user-merchant`、`product-guess`、`content-system`、`order-fulfillment`）。700–900 行单文件也让 review 和冲突非常痛苦。

## 建议

按业务域重新拆：

- `content-system-page.tsx` → `content-*-page.tsx` + `system-*-page.tsx`
- `user-merchant-page.tsx` → `users-page.tsx`（已有，需合并）+ `merchants-page.tsx`
- `product-guess-page.tsx` → `products-page.tsx`（已有）+ `guesses-page.tsx`（已有）
- `order-fulfillment-page.tsx` → `orders-page.tsx`（已有）+ `fulfillment-page.tsx`
- `marketing-page.tsx` → 按真实子模块拆（优惠券、签到、排行榜、邀请等）

同一轮里要把路由、菜单 key、引用、空目录一起收完，保证 `pnpm --filter @umi/admin typecheck` 通过（AGENTS.md "不允许半拆"）。
