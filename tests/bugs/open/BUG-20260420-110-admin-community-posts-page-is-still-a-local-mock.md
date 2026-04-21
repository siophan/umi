# BUG-20260420-110

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-110` |
| `title` | 管理后台社区动态页仍是本地假数据壳，缺少真实内容治理链路 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/community/posts-mock` |
| `scope` | `admin` |
| `page` | `#/community/posts` |
| `api` | `/api/admin/posts` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-community-qa-2026-04-20.md` |
| `fingerprint` | `admin-community-posts:still-a-local-mock` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 社区动态管理页应接入真实动态列表，并保留至少删除等治理动作。 |
| 对齐基准 | 老后台社区管理页实时读取帖子数据并支持删除。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面写死两条帖子样例，本地做搜索和状态筛选，操作区只剩“查看”抽屉，没有真实删除或治理动作。 |
| 影响范围 | 后台无法对真实社区内容进行治理，帖子管理页当前不具备业务价值。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/community/posts`。 |
| 2 | 查看列表数据来源和操作。 |
| 3 | 对照老后台社区管理页。 |
| 4 | 当前只有两条本地样例帖子，没有实时数据，也没有删除动作。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/community-posts-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-posts-page.tsx:27) 到 [apps/admin/src/pages/community-posts-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-posts-page.tsx:30) 直接定义本地 `rows`；[apps/admin/src/pages/community-posts-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-posts-page.tsx:55) 到 [apps/admin/src/pages/community-posts-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-posts-page.tsx:72) 操作区只有“查看”；[apps/admin/src/pages/community-posts-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-posts-page.tsx:104) 到 [apps/admin/src/pages/community-posts-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-posts-page.tsx:115) 表格直接消费本地 `filteredRows`。 |
| 对照证据 | [admin/src/pages/community/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/index.tsx:28) 到 [admin/src/pages/community/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/index.tsx:38) 老页会通过 `socialApi.posts()` 读取实时帖子；[admin/src/pages/community/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/index.tsx:47) 到 [admin/src/pages/community/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/index.tsx:55) 支持删除帖子。 |
| 数据承接证据 | [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:825) 到 [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:882) 当前工作区已有 `post` 和 `post_interaction` 事实文档，说明治理对象已存在真实承接层。 |
| 相关文件 | [apps/admin/src/pages/community-posts-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-posts-page.tsx) [admin/src/pages/community/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/index.tsx) [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/community-posts-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-posts-page.tsx) | 仍是本地样例数据页，没有真实内容治理动作。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
