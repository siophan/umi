# BUG-20260420-090

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-090` |
| `title` | PK 对战页缺少旧页统计概览和 stats 链路 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/pk/stats` |
| `scope` | `admin` |
| `page` | `#/pk` |
| `api` | `/api/admin/pk` |
| `owner` | `测试狗` |
| `source_run` | `admin-guesses-qa-2026-04-20.md` |
| `fingerprint` | `admin-pk:lacks-summary-stats-chain` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | PK 对战页应提供总数、进行中、已结算等概览统计，方便后台快速判断 PK 盘面。 |
| 对齐基准 | 老后台会并发读取列表和 stats，并在页面顶部展示统计卡。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页只渲染列表和详情抽屉，没有任何概览统计；后台路由里也只有 `/api/admin/pk` 单列表接口。 |
| 影响范围 | 后台无法在 PK 模块首屏直接看到整体盘面，只能逐行翻表。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 当前页面证据 | 当前 PK 页从头到尾只有列表筛选、表格和详情抽屉，没有统计卡区块，见 [pk-matches-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/pk-matches-page.tsx:40) 到 [pk-matches-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/pk-matches-page.tsx:197)。 |
| 路由证据 | 当前 admin router 只提供 `/pk` 列表接口，没有 stats 入口，见 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:863) 到 [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts:865)。 |
| 老后台对照 | 老后台会并发读取 `adminPkApi.list()` 和 `adminPkApi.stats()`，并在顶部展示“总PK数 / 进行中 / 已结算”三张统计卡，见 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/pk/index.tsx:48) 到 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/pk/index.tsx:87)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [pk-matches-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/pk-matches-page.tsx) | 页面缺少概览统计区。 |
| [router.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/router.ts) | 当前没有 PK stats 读链。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 补回 PK stats 读链和顶部概览卡，让后台能先看总盘面再下钻到单条对战。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
