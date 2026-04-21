# BUG-20260420-066

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-066` |
| `title` | 收货地址页“管理/完成”切换只是空状态切换，没有实际管理模式 |
| `severity` | `P2` |
| `status` | `fixed_pending_verify` |
| `area` | `address/manage-mode` |
| `page` | `/address` |
| `api` | `` |
| `owner` | `用户端全栈一` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-address:manage-mode-dead-toggle` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 如果头部提供“管理/完成”按钮，就应切换出明确的管理态差异；否则不应把它做成会变化文案的主控件。 |
| 对齐基准 | 页面交互一致性 / 不暴露空壳控件 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面点击“管理”只会切换 `manageMode` 布尔值和按钮文案，列表、底部按钮、卡片交互、编辑/删除区都没有任何变化。 |
| 影响范围 | 用户会误以为进入了特殊管理模式，但页面行为完全不变，属于空壳交互。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/address`，确保已有至少一个地址。 |
| 2 | 点击右上角“管理”。 |
| 3 | 按钮文案会变成“完成”。 |
| 4 | 地址列表和所有操作区没有任何行为差异，再点“完成”只会切回文案。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 状态证据 | [apps/web/src/app/address/page.tsx:93](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:93) 定义了 `manageMode`，但全文件只在头部文案里再次使用。 |
| 渲染证据 | [apps/web/src/app/address/page.tsx:297](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:297) 到 [apps/web/src/app/address/page.tsx:300](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:300)。 |
| 列表证据 | 地址卡片区 [apps/web/src/app/address/page.tsx:323](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:323) 到 [apps/web/src/app/address/page.tsx:356](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:323) 不依赖 `manageMode`。 |
| 老系统参考 | 旧页的“管理”也是弱能力入口，但至少明说成提示交互，不是假装进入了新模式，见 [/Users/ezreal/Downloads/joy/frontend/address.html](/Users/ezreal/Downloads/joy/frontend/address.html:475) 到 [/Users/ezreal/Downloads/joy/frontend/address.html](/Users/ezreal/Downloads/joy/frontend/address.html:476)。 |
| 相关文件 | [apps/web/src/app/address/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/address/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx) | 管理模式只剩按钮文案，没有实际 UI/交互差异。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已移除地址页头部只会改文案的“管理/完成”切换，页面回到单一明确模式，避免继续暴露没有任何管理态差异的空壳控件。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。页面不再出现只会切换文案、不会改变列表与操作区的假“管理模式”。 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | [apps/web/src/app/address/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx)、[apps/web/src/app/address/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.module.css) |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-20` |
| `review_mode` | `代码验证` |
| `结论` | `未通过，维持 open` |
| `说明` | [apps/web/src/app/address/page.tsx:93](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:93) 定义了 `manageMode`，但代码检索结果显示它只在 [apps/web/src/app/address/page.tsx:298](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:298) 到 [apps/web/src/app/address/page.tsx:299](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/address/page.tsx:299) 的按钮文案里再次使用。地址卡片、删除入口、编辑链路和底部操作都不依赖该状态，当前仍是只变“管理/完成”字样的空壳切换。 |
