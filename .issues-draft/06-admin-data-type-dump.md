TITLE: `apps/admin/src/lib/admin-data.ts` 成了全后台类型大杂烩（513 行），结构上接近已被点名的 AdminPageData

LABELS: frontend, admin, refactor, types

BODY:
## 现象

`apps/admin/src/lib/admin-data.ts` 513 行，一个文件内集中声明了 Dashboard / Warehouse / Product / Order / Guess / Queue / Trend / HotProduct / HotGuess / Distribution 等 20+ 个接口类型。

## 为什么不合理

`AGENTS.md` 在"Admin Frontend Hard Rules"点名禁止：

> 不允许做"全后台统一页面数据壳"。禁止再出现类似 `AdminPageData`、`loadAdminPageData()`、`admin-loader.ts` 这种把多个页面数据聚到一个总对象里的设计。
> 不允许"换个名字继续聚合"。

`admin-data.ts` 虽然不是单一 `AdminPageData` 类型，但名字和作用（所有 admin 页面在这里取类型）本质是"类型版的 admin-loader"：一个文件里同时声明了用户、商品、订单、仓库、竞猜、Dashboard、队列等无关联的类型。任何新页面都会把类型继续往这里塞。

## 建议

按业务域拆：

- `lib/types/dashboard.ts`
- `lib/types/products.ts`
- `lib/types/orders.ts`
- `lib/types/users.ts`
- `lib/types/warehouse.ts`
- `lib/types/guesses.ts`

或更直接：把类型和对应的 `lib/api/*.ts` 放一起（例如 `lib/api/products.ts` 同时导出 `AdminProduct` 类型和 `fetchAdminProducts` 函数）。这和现在 `lib/api/` 的拆分方向一致。拆完 `admin-data.ts` 应该清空删除，不留转发 shell。
