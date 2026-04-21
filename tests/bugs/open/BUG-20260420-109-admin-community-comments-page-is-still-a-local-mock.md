# BUG-20260420-109

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-109` |
| `title` | 管理后台评论管理页仍是本地假数据壳，缺少真实审核与删除链路 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/community/comments-mock` |
| `scope` | `admin` |
| `page` | `#/community/comments` |
| `api` | `/api/admin/comments` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-community-qa-2026-04-20.md` |
| `fingerprint` | `admin-community-comments:still-a-local-mock` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 评论管理页应接入真实评论列表，并提供至少和老页一致的违规标记、删除等治理动作。 |
| 对齐基准 | 老后台评论管理页 `/api/admin/comments` 读链和删除动作。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面直接写死两条 `rows` 本地数据，只支持查看抽屉；没有任何 API 读取，也没有标记违规或删除动作。 |
| 影响范围 | 后台无法对真实评论做治理，页面现在只是演示壳。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/community/comments`。 |
| 2 | 查看页面源码和实际可用操作。 |
| 3 | 对照老后台评论管理页。 |
| 4 | 当前只会展示固定两条样例评论，操作区只有“查看”，没有真实治理链。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/community-comments-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-comments-page.tsx:26) 到 [apps/admin/src/pages/community-comments-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-comments-page.tsx:29) 直接定义本地 `rows`；[apps/admin/src/pages/community-comments-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-comments-page.tsx:54) 到 [apps/admin/src/pages/community-comments-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-comments-page.tsx:70) 操作区只有“查看”；[apps/admin/src/pages/community-comments-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-comments-page.tsx:102) 到 [apps/admin/src/pages/community-comments-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-comments-page.tsx:113) 表格直接吃本地 `filteredRows`。 |
| 对照证据 | [admin/src/pages/community/comments.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/comments.tsx:31) 到 [admin/src/pages/community/comments.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/comments.tsx:37) 老页会请求 `/api/admin/comments`；[admin/src/pages/community/comments.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/comments.tsx:43) 到 [admin/src/pages/community/comments.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/comments.tsx:58) 还支持删除和标记违规。 |
| 数据承接证据 | [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:903) 到 [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:984) 当前工作区已有 `comment_item` 表及索引说明，说明评论治理不是无表可接。 |
| 相关文件 | [apps/admin/src/pages/community-comments-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-comments-page.tsx) [admin/src/pages/community/comments.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/comments.tsx) [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/community-comments-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-comments-page.tsx) | 仍是本地样例数据页，没有任何真实治理动作。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
