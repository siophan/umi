# Bug Index

最后更新：2026-04-22

当前活跃 Bug 已开始录入，修复线程默认从 `status = new / triaged / in_progress` 的单据里认领。

## Open Bugs

| bug_id | severity | area | page_or_api | title | status | owner | source_run | last_seen_at |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BUG-20260420-052` | `P2` | `post/detail/header` | `/post/[id]` | 动态详情页顶栏缺失旧页作者信息和关注入口 | `triaged` | `测试猫` | `user-page-parity-round1-2026-04-20.md` | `2026-04-20` |

## Rules

| 规则 | 说明 |
| --- | --- |
| 一行一个 Bug | 不在总表写长段说明 |
| 详情放单文件 | `tests/bugs/open/BUG-xxxx.md` |
| 状态变更同步总表 | 包括 owner、last_seen_at |
| 修复后不删记录 | 移到 `closed/` 继续保留历史 |
