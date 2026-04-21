# BUG-20260420-112

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-112` |
| `title` | 管理后台直播列表页仍是本地假数据壳，缺少真实直播统计和强制下播链路 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/live/list-mock` |
| `scope` | `admin` |
| `page` | `#/live/list` |
| `api` | `/api/lives` `/api/admin/lives/{id}/stop` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-live-qa-2026-04-20.md` |
| `fingerprint` | `admin-live-list:still-a-local-mock` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 直播列表页应接入真实直播列表、统计概览和强制下播动作，而不是只展示样例直播间。 |
| 对齐基准 | 老后台直播页 `/api/lives` 读链和 `/api/admin/lives/{id}/stop` 动作。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面直接写死两条直播间样例，本地做搜索和状态 tab，操作区只剩“查看”抽屉；强制下播、统计卡、实时直播列表都没有真实链路。 |
| 影响范围 | 后台无法查看真实直播状态，也不能对正在直播的房间执行治理动作。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/live/list`。 |
| 2 | 查看页面数据来源和操作区。 |
| 3 | 对照老后台直播页。 |
| 4 | 当前只会展示两条固定样例直播间，且没有强制下播动作。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/live-list-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-list-page.tsx:27) 到 [apps/admin/src/pages/live-list-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-list-page.tsx:30) 直接定义本地 `rows`；[apps/admin/src/pages/live-list-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-list-page.tsx:55) 到 [apps/admin/src/pages/live-list-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-list-page.tsx:71) 操作区只有“查看”；[apps/admin/src/pages/live-list-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-list-page.tsx:103) 到 [apps/admin/src/pages/live-list-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-list-page.tsx:114) 表格直接消费本地 `filteredRows`。 |
| 对照证据 | [admin/src/pages/live/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/live/index.tsx:30) 到 [admin/src/pages/live/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/live/index.tsx:46) 老页会读取 `/api/lives` 并调用 `/api/admin/lives/{id}/stop`；[admin/src/pages/live/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/live/index.tsx:54) 到 [admin/src/pages/live/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/live/index.tsx:99) 还展示直播中/今日直播/总观看人次统计卡和强制下播动作。 |
| 数据承接证据 | [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:200) 到 [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:200) 当前工作区已有 `live` 主表。 |
| 相关文件 | [apps/admin/src/pages/live-list-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-list-page.tsx) [admin/src/pages/live/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/live/index.tsx) [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/live-list-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-list-page.tsx) | 仍是本地样例数据页，未接真实直播治理链。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
