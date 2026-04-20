TITLE: ID 类型在接口层仍是 `string`，和 AGENTS.md 声明的"主键已整型化"不一致

LABELS: types, api, contract

BODY:
## 现象

`AGENTS.md` 明确写：

> 主键和主链路关联 ID 已整型化，不再使用字符串 ID

但 `@umi/shared` 里导出的业务类型仍然用 `string`：

- `UserSummary.id: string`（`packages/shared/src/domain.ts` / `api.ts`）
- `ProductSummary.id: string`、`GuessSummary.id: string`、`OrderSummary.id: string` 等
- `demo-data.ts` 给的示例是 `'user-1' / 'prod-1' / 'guess-1'` 这类字符串 sentinel

后端 router / store 到处是 `String(request.params.id)`、`String(userId)`，web `api.ts` 里的参数签名也是 `(userId: string)`、`(postId: string)`。

## 为什么不合理

- **契约和数据库事实漂移**。AGENTS.md 是当前事实来源（数据库 id 是 `bigint`），但暴露给前端的类型把 id 当字符串描述。
- **大数精度风险**：如果真实 id 超过 `Number.MAX_SAFE_INTEGER`（9e15），JSON 解析会丢精度。现在没有策略（例如"id 序列化成字符串、前端不要当数字处理"），等于同时踩两边的坑。
- 新线程会继续按"字符串 id"的假象写代码，后面整改代价变大。

## 建议

先做一次明确决定（二选一并写进 AGENTS.md）：

- **A. JSON 里 id 就是 number**：`@umi/shared` 把 `id: string` 改成 `id: number`；route path 参数解析时转成 `number`；并在所有 id 列上接受一个安全上限（`bigint` 范围里 id 实际值需要 < 2^53）。
- **B. JSON 里 id 作为 string 传输但表达"整型 id"**：明确 `id: string` 的语义是"big-int-as-string"，同时在 OpenAPI 里标注 `format: int64` 或 `pattern: ^\d+$`。后端仍用 `BigInt` 处理，边界做 string↔bigint 转换。

当前状态（类型 `string` + 用法像数字 id）是最糟糕的折中——两种策略都没落实。
