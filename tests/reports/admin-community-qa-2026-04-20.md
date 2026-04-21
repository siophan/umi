# Admin Community QA Report

最后更新：2026-04-20

## Summary

| 项目 | 结果 |
| --- | --- |
| 范围 | 社区治理模块 `#/community/comments` `#/community/posts` `#/community/reports` |
| 本轮重点 | 评论治理、动态治理、举报处理的真实读链和动作闭环 |
| 已确认 Bug | `3` |
| 阻塞项 | `0` |
| 结论 | 当前社区治理组三页全部还是本地样例数据页。评论、动态、举报虽然在老后台都有真实读写链，而且当前工作区也有对应表承接，但新后台页面尚未接线。 |

## Reviewed Surface

| 页面/接口 | 当前结论 | 说明 |
| --- | --- | --- |
| `#/community/comments` | `parity_gap` | 仍是本地评论样例，缺少真实评论读取、标记违规和删除动作。 |
| `#/community/posts` | `parity_gap` | 仍是本地帖子样例，缺少实时帖子读取和删除治理动作。 |
| `#/community/reports` | `parity_gap` | 仍是本地举报样例，缺少通过、驳回、封禁等处理链路。 |

## Bugs

| bug_id | severity | page | title | 文件 |
| --- | --- | --- | --- | --- |
| `BUG-20260420-109` | `P1` | `#/community/comments` | 评论管理页仍是本地假数据壳，缺少真实审核与删除链路 | [tests/bugs/open/BUG-20260420-109-admin-community-comments-page-is-still-a-local-mock.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-109-admin-community-comments-page-is-still-a-local-mock.md) |
| `BUG-20260420-110` | `P1` | `#/community/posts` | 社区动态页仍是本地假数据壳，缺少真实内容治理链路 | [tests/bugs/open/BUG-20260420-110-admin-community-posts-page-is-still-a-local-mock.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-110-admin-community-posts-page-is-still-a-local-mock.md) |
| `BUG-20260420-111` | `P1` | `#/community/reports` | 举报处理页仍是本地假数据壳，缺少通过/驳回/封禁处理链路 | [tests/bugs/open/BUG-20260420-111-admin-community-reports-page-is-still-a-local-mock.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/open/BUG-20260420-111-admin-community-reports-page-is-still-a-local-mock.md) |

## Findings

| 类型 | 说明 |
| --- | --- |
| 数据来源 | 三个页面都直接写死本地 `rows`，没有任何真实读链。 |
| 动作链 | 评论缺少标记违规/删除，动态缺少删除，举报缺少通过/驳回/封禁。 |
| 承接层 | 当前工作区已经有 `comment_item`、`post`、`report_item` 表，不是“无数据可接”，而是后台治理链路未接。 |

## Evidence Basis

| 类型 | 内容 |
| --- | --- |
| 页面代码 | [apps/admin/src/pages/community-comments-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-comments-page.tsx) [apps/admin/src/pages/community-posts-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-posts-page.tsx) [apps/admin/src/pages/community-reports-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/community-reports-page.tsx) |
| 对照实现 | [admin/src/pages/community/comments.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/comments.tsx) [admin/src/pages/community/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/index.tsx) [admin/src/pages/community/reports.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/community/reports.tsx) |
| 数据文档 | [docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md) [docs/schema-reference.md](/Users/ezreal/Downloads/joy/umi/docs/schema-reference.md) |

## Next Actions

| 优先级 | 动作 |
| --- | --- |
| `P1` | 给三页接回真实治理读链，先让后台看到真实评论、帖子、举报。 |
| `P1` | 恢复评论删除/违规标记、帖子删除、举报处理这三类核心动作。 |
