# packages/db/sql

这个目录当前只保留“与 `umi/docs/` 已对齐、可继续复用”的数据库 SQL 资产。

当前状态：

- 旧模型 SQL 已清理
- 还没有重建出覆盖当前 `joy-test` 事实的完整建库 / 迁移 SQL 集

因此：

- 不要把这个目录当成当前数据库的完整恢复源
- 当前数据库事实仍以 `docs/db.md`、`docs/schema-reference.md`、`docs/status-codes.md` 为准
- 后续只有在 SQL 已与当前文档完全对齐后，才允许重新放回这个目录
