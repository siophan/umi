# BUG-YYYYMMDD-XXX

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-YYYYMMDD-XXX` |
| `title` |  |
| `severity` | `P0 / P1 / P2 / P3` |
| `status` | `new / triaged / in_progress / fixed_pending_verify / verified / closed / flaky / blocked` |
| `area` |  |
| `scope` | `user / admin / cross` |
| `page` |  |
| `api` |  |
| `owner` |  |
| `source_run` |  |
| `fingerprint` |  |
| `fix_owner` |  |
| `verify_owner` |  |
| `created_at` |  |
| `last_seen_at` |  |

默认规则：

- `scope=user` 的 bug，`verify_owner` 默认填测试猫
- `scope=admin` 的 bug，`verify_owner` 默认填测试狗
- `scope=cross` 的 bug，`verify_owner` 由总控线程指定

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 |  |
| 对齐基准 | 老系统 / 当前产品要求 / OpenAPI / 数据库文档 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 |  |
| 影响范围 |  |
| 是否稳定复现 | `yes / no / flaky` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 |  |
| 2 |  |
| 3 |  |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 |  |
| 接口证据 |  |
| 日志/断言 |  |
| 相关文件 |  |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
|  |  |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 |  |
| 验证命令 |  |
| Fixer 自测结果 |  |
| Verifier 复测结果 |  |
| 修复提交/变更 |  |
