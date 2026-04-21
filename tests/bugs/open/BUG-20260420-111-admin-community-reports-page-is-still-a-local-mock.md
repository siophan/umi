# BUG-20260420-111

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-111` |
| `title` | 管理后台举报处理页仍是本地假数据壳，缺少通过/驳回/封禁处理链路 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/community/reports-mock` |
| `scope` | `admin` |
| `page` | `#/community/reports` |
| `api` | `/api/admin/reports` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-community-qa-2026-04-20.md` |
| `fingerprint` | `admin-community-reports:still-a-local-mock` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 举报处理页应接入真实举报记录，并提供通过、驳回、封禁等处理动作。 |
| 对齐基准 | 老后台举报页 `/api/admin/reports` 读链和 `/handle` 处理动作。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面写死两条举报样例，本地做搜索和状态 tab，操作区只有“查看”抽屉，没有任何处理动作。 |
| 影响范围 | 后台无法处理真实举报工单，举报模块当前完全不具备治理闭环。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/community/reports`。 |
| 2 | 查看列表数据来源和操作。 |
| 3 | 对照老后台举报处理页。 |
| 4 | 当前只会展示本地样例举报，且没有通过、驳回、封禁动作。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/community-reports-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-reports-page.tsx:26) 到 [apps/admin/src/pages/community-reports-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-reports-page.tsx:29) 直接定义本地 `rows`；[apps/admin/src/pages/community-reports-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-reports-page.tsx:54) 到 [apps/admin/src/pages/community-reports-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-reports-page.tsx:70) 操作区只有“查看”；[apps/admin/src/pages/community-reports-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-reports-page.tsx:102) 到 [apps/admin/src/pages/community-reports-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-reports-page.tsx:113) 表格直接消费本地 `filteredRows`。 |
| 对照证据 | [admin/src/pages/community/reports.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/reports.tsx:32) 到 [admin/src/pages/community/reports.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/reports.tsx:41) 老页会请求 `/api/admin/reports`；[admin/src/pages/community/reports.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/reports.tsx:44) 到 [admin/src/pages/community/reports.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/reports.tsx:77) 还支持通过、驳回、封禁三类处理动作。 |
| 数据承接证据 | [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:196) 到 [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:196) 和 [docs/schema-reference.md](/Users/ezreal/Downloads/joy/umi/docs/schema-reference.md:348) 到 [docs/schema-reference.md](/Users/ezreal/Downloads/joy/umi/docs/schema-reference.md:348) 当前工作区已有 `report_item` 承接层。 |
| 相关文件 | [apps/admin/src/pages/community-reports-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-reports-page.tsx) [admin/src/pages/community/reports.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/reports.tsx) [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md) [docs/schema-reference.md](/Users/ezreal/Downloads/joy/umi/docs/schema-reference.md) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/community-reports-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-reports-page.tsx) | 仍是本地样例数据页，没有任何举报处理动作。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
