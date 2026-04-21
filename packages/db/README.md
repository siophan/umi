# @umi/db

当前 `umi/` 工作区的数据库事实来源，优先级固定如下：

1. `docs/db.md`
2. `docs/schema-reference.md`
3. `docs/status-codes.md`
4. `.env` 中的本地 `DATABASE_URL`（当前默认 `joy-test`）

这个包目前不是可直接执行的建库/迁移系统。

- 这里暂时不提供一套可直接恢复当前线上事实的完整 schema
- 这里暂时也没有统一 migration runner
- 在补齐当前真实 SQL 资产之前，不应把 `packages/db/` 当成数据库结构唯一来源

`packages/db/sql/` 现在只允许放“已经和当前 `umi/docs/` 对齐”的 SQL 资产。

- 已失真、仍沿用旧字符串 ID / 字符串状态 / 自由文本分类 / 元金额口径的旧 SQL 已移除
- 后续新增 SQL 前，必须先和 `docs/db.md`、`docs/schema-reference.md`、`docs/status-codes.md` 对齐
- 如果文档和 SQL 不一致，以 `umi/docs/` 为准，先修文档或重建 SQL，不允许继续复用旧脚本
