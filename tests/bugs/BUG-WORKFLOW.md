# Bug Workflow

最后更新：2026-04-20

这份文档定义“测试发现问题后，怎么落 Bug、怎么修、怎么验证”。

## Roles

| 角色 | 责任 | 不负责 |
| --- | --- | --- |
| Detector | 跑测试、做页面对齐、生成运行报告、发现问题 | 不直接改业务代码 |
| Triage | 去重、定级、补充复现步骤、建 Bug 单 | 不跳过复现直接判关闭 |
| Fixer | 按单修复、回写修改说明和验证结果 | 不自己关闭 Bug |
| Verifier | 独立复测、确认是否真的修好 | 不代替 Fixer 写实现说明 |

## Domain Ownership

| 域 | 默认复核方 | 说明 |
| --- | --- | --- |
| 用户端 `apps/web` 及用户侧接口/链路 | 测试猫 | 负责用户端页面对齐、用户态接口、用户链路 Bug 的独立复核，并推进到 `verified` |
| 管理后台 `apps/admin` 及后台接口/链路 | 测试狗 | 负责后台页面对齐、后台鉴权和后台链路 Bug 的独立复核，并推进到 `verified` |
| 跨域或归属不明确 | 总控线程 | 先定归属；无法拆清时由总控线程收口并负责最终关闭决策 |

## States

| 状态 | 含义 |
| --- | --- |
| `new` | 新发现，尚未归类 |
| `triaged` | 已定级、已确认复现、可分派 |
| `in_progress` | 已有线程认领并在修 |
| `fixed_pending_verify` | 修复线程已完成改动和自测，等待独立复测 |
| `verified` | Verifier 独立复测通过，问题已确认修复 |
| `closed` | 已由总控线程归档，不再活跃 |
| `flaky` | 不稳定，待更多证据 |
| `blocked` | 依赖未满足，暂时无法修 |

## Severity

| 级别 | 含义 |
| --- | --- |
| `P0` | 核心链路不可用，阻塞上线或主流程 |
| `P1` | 用户明显错误、数据错误、关键页面严重偏差 |
| `P2` | 有功能缺口或明显 UI / 交互偏差，但有绕过方式 |
| `P3` | 低风险文案、样式、边缘行为问题 |

## Required Files

| 文件 | 作用 |
| --- | --- |
| [tests/bugs/index.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/index.md) | 当前 Bug 总表 |
| [tests/bugs/templates/bug.md](/Users/ezreal/Downloads/joy/umi/tests/bugs/templates/bug.md) | 新 Bug 模板 |
| `tests/bugs/open/BUG-xxxx.md` | 活跃 Bug 单 |
| `tests/bugs/closed/BUG-xxxx.md` | 已关闭 Bug |
| `tests/reports/*.md` | 每轮运行报告 |

## Workflow

| 步骤 | 动作 | 输出 |
| --- | --- | --- |
| 1 | 跑自动化测试或逐页对齐 | `run report` |
| 2 | 提取失败点和差异点 | 候选 Bug 列表 |
| 3 | 用 `fingerprint` 去重 | 新建或更新 Bug 单 |
| 4 | 在 `index.md` 更新状态和 owner | 总表同步 |
| 5 | 修复线程认领 Bug | `status=in_progress` |
| 6 | 修复完成后回写变更和验证命令 | `status=fixed_pending_verify` |
| 7 | 独立复测 | `verified` 或退回 `triaged` |
| 8 | 测试总监按 `Repro` 逐单真复测待关闭 bug | `closed` 或退回 |
| 9 | 确认关闭后移到 `closed/` | `status=closed` |

## Close Authority

| 动作 | 允许角色 | 说明 |
| --- | --- | --- |
| 改到 `in_progress` | `Fixer` | 认领后立即更新 |
| 改到 `fixed_pending_verify` | `Fixer` | 必须回写改动说明和自测结果 |
| 改到 `verified` | `Verifier` | 必须由对应域的验证方独立复跑 `repro` 或定向验证 |
| 改到 `closed` | 总控线程 | 只有在 `verified` 后，再经过测试总监按 `Repro` 逐单真复测通过，才能关闭并归档 |

这里的硬规则是：

- `Fixer` 不能直接把自己修的 Bug 改成 `verified` 或 `closed`
- `closed` 不等于“修的人说修好了”，只等于“独立复核通过并归档”
- 用户端 Bug 只能由测试猫或总控线程改到 `verified`
- 管理后台 Bug 只能由测试狗或总控线程改到 `verified`
- 所有 bug 在进入 `closed` 前，都必须由测试总监按 bug 单 `Repro` 逐单真复测
- 如果复测失败，不新建重复 Bug，而是把原单退回 `triaged` 或 `in_progress`

## Fingerprint Rule

同一个 Bug 的去重键建议用：

`area + page_or_endpoint + error_class + key_message`

示例：

- `order + /api/orders + assertion + shipping status mismatch`
- `web-me + /me + parity + profile card missing stats`
- `admin-roles + #/system/roles + typecheck + invalid table columns`

## Working Rules

| 规则 | 说明 |
| --- | --- |
| 一次只认领一个 Bug | 降低多线程撞车概率 |
| 先改状态再开工 | 认领前先在 `index.md` 标记 owner |
| 证据要落文档 | 不接受“我看起来修好了” |
| 关闭必须独立验证 | Fixer 不能直接把自己修的 Bug 标为 `verified` 或 `closed` |
| 关闭必须真复测 | 总控线程不能只看代码、文档或机械校验就关闭，必须亲自执行 `Repro` |
| 页面差异也要建单 | UI 不对齐不算“可忽略”，除非明确标记 `not_applicable` |

## Scope Split

| 类型 | 放在哪 |
| --- | --- |
| 本轮执行结果 | `tests/reports/` |
| 当前活跃问题 | `tests/bugs/open/` |
| 已关闭问题 | `tests/bugs/closed/` |
| 页面与接口对齐状态 | `tests/parity/` |
