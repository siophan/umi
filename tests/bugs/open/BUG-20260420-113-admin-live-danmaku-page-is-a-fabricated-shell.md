# BUG-20260420-113

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-113` |
| `title` | 管理后台弹幕管理页是伪造样例壳，当前没有真实承接链却仍展示可用页面 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/live/danmaku-shell` |
| `scope` | `admin` |
| `page` | `#/live/danmaku` |
| `api` | `` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-live-qa-2026-04-20.md` |
| `fingerprint` | `admin-live-danmaku:fabricated-shell-without-real-chain` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 在弹幕承接链尚未建设前，后台不应伪造“弹幕管理”正常页面；要么隐藏入口，要么明确标注未承接，而不是展示假数据。 |
| 对齐基准 | 后台禁止长期保留 demo/mock/fallback 数据；当前文档也明确直播互动子表暂缓。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页面写死两条弹幕样例，本地做搜索和状态筛选，看起来像可用治理页；但当前工作区文档没有 `live_message` / `live_danmaku` 承接表，而且接手规则明确它们暂缓。 |
| 影响范围 | 页面会误导运营以为弹幕治理已承接，实际上没有真实数据也没有真实风控动作。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/live/danmaku`。 |
| 2 | 查看页面数据来源。 |
| 3 | 对照当前工作区数据库文档和接手规则。 |
| 4 | 当前页面会展示两条固定弹幕样例，但仓库里并没有对应的真实承接链。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/live-danmaku-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-danmaku-page.tsx:27) 到 [apps/admin/src/pages/live-danmaku-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-danmaku-page.tsx:30) 直接定义本地 `rows`；[apps/admin/src/pages/live-danmaku-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-danmaku-page.tsx:55) 到 [apps/admin/src/pages/live-danmaku-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-danmaku-page.tsx:71) 操作区只有“查看”；[apps/admin/src/pages/live-danmaku-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-danmaku-page.tsx:103) 到 [apps/admin/src/pages/live-danmaku-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-danmaku-page.tsx:114) 表格直接消费本地 `filteredRows`。 |
| 数据文档证据 | [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:198) 到 [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md:205) 当前数据库只列出 `live` 主表，未见弹幕/直播消息承接表。 |
| 接手规则证据 | [AGENTS.md](/Users/ezreal/Downloads/joy/umi/AGENTS.md:274) 到 [AGENTS.md](/Users/ezreal/Downloads/joy/umi/AGENTS.md:280) 已明确“直播互动子表暂缓，不优先补 `live_message` / `live_danmaku`”。 |
| 相关文件 | [apps/admin/src/pages/live-danmaku-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-danmaku-page.tsx) [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md) [AGENTS.md](/Users/ezreal/Downloads/joy/umi/AGENTS.md) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/live-danmaku-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-danmaku-page.tsx) | 通过本地样例把未承接能力伪装成可用页面。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
