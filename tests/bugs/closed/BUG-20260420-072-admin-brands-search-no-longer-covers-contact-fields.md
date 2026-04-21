# BUG-20260420-072

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-072` |
| `title` | 品牌列表搜索范围退化为只搜品牌名，无法再按联系人定位品牌 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/brands/search` |
| `scope` | `admin` |
| `page` | `#/brands/list` |
| `api` | `/api/admin/brands` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-brands-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-brands:search-no-longer-covers-contact-fields` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 品牌列表应继续支持按品牌名或联系人搜索。 |
| 对齐基准 | 老后台品牌页搜索框明确写的是“搜索品牌名/联系人”。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 新页面搜索区只保留“品牌名称”输入框，过滤逻辑也只匹配 `record.name`；联系人和联系电话都不再进入搜索范围。 |
| 影响范围 | 运营无法再通过联系人信息快速定位品牌，搜索能力较老后台退化。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 对照老后台品牌页的搜索能力。 |
| 2 | 打开新后台 `#/brands/list`。 |
| 3 | 可以看到新页搜索框只写“品牌名称”，过滤逻辑也只匹配品牌名。 |
| 4 | 输入联系人姓名或手机号，无法筛出对应品牌。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 老页证据 | 老后台品牌页搜索框占位是“搜索品牌名/联系人”，见 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/brands/index.tsx:104) 到 [index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/brands/index.tsx:107)。 |
| 页面证据 | 新页搜索区只有一个“品牌名称”输入框，见 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:229) 到 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:236)。 |
| 过滤证据 | 新页过滤逻辑只检查 `record.name`，没有把联系人或联系电话纳入搜索，见 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:136) 到 [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:145)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [brands-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx) | 搜索 UI 和过滤逻辑都收窄成了品牌名。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已把品牌页搜索恢复到老后台语义：搜索输入框文案改成“搜索品牌名/联系人/电话”，本地过滤同时匹配 `record.name`、`record.contactName` 与 `record.contactPhone`。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。品牌列表现在可以用品牌名、联系人姓名或联系电话定位品牌；admin `typecheck` 与 `build` 均通过。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前品牌页搜索框已恢复为“搜索品牌名/联系人/电话”，页面筛选链路重新覆盖联系人与联系电话字段，不再只搜品牌名。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `通过，关闭` |
| `说明` | [apps/admin/src/pages/brands-page.tsx:217](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:217) 到 [apps/admin/src/pages/brands-page.tsx:223](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:217) 的过滤逻辑当前已同时匹配 `record.name`、`record.contactName`、`record.contactPhone`；[apps/admin/src/pages/brands-page.tsx:319](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/brands-page.tsx:319) 的搜索框占位也已恢复为“搜索品牌名/联系人/电话”。原问题代码路径已消失。 |
