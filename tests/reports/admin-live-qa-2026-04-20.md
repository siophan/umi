# Admin Live QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 直播模块 `#/live/list` `#/live/danmaku` |
| 本轮重点 | 直播列表真实读链、统计概览、强制下播动作、弹幕治理承接状态 |
| 已确认 Bug | `2` |
| 阻塞项 | `0` |
| 结论 | 直播组当前也还是壳。直播列表虽然老页有真实读链和强制下播动作，但新页只剩本地样例；弹幕页更进一步，当前连承接表都没有，却仍展示成正常可用页面。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/live/list` | `parity_gap` | 仍是本地直播间样例，缺少真实列表、统计概览和强制下播动作。 |
| `#/live/danmaku` | `parity_gap` | 仍是本地弹幕样例，且当前工作区未见弹幕承接链。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-112` | `P1` | `#/live/list` | 直播列表页仍是本地假数据壳，缺少真实直播统计和强制下播链路 | [tests/bugs/open/BUG-20260420-112-admin-live-list-page-is-still-a-local-mock.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-112-admin-live-list-page-is-still-a-local-mock.md) |
| `BUG-20260420-113` | `P1` | `#/live/danmaku` | 弹幕管理页是伪造样例壳，当前没有真实承接链却仍展示可用页面 | [tests/bugs/open/BUG-20260420-113-admin-live-danmaku-page-is-a-fabricated-shell.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-113-admin-live-danmaku-page-is-a-fabricated-shell.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 直播治理 | 直播列表退化成样例表格，老页已有的统计和强制下播动作全部丢失。 |
| 弹幕治理 | 当前工作区尚未承接弹幕数据，但后台页面仍用假数据伪装成已可用。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/live-list-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-list-page.tsx) [apps/admin/src/pages/live-danmaku-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/live-danmaku-page.tsx) |
| 对照实现 | [admin/src/pages/live/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/live/index.tsx) |
| 数据文档 | [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md) [AGENTS.md](/Users/ezreal/Downloads/joy/umi/AGENTS.md) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 给直播列表接回真实读链和强制下播动作。 |
| `P1` | 在弹幕承接层未建设前，不要继续把假数据页暴露成可用治理模块。 |
