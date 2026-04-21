# BUG-20260420-072

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-072` |
| `title` | 品牌列表搜索范围退化为只搜品牌名，无法再按联系人定位品牌 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/brands/search` |
| `scope` | `admin` |
| `page` | `#/brands/list` |
| `api` | `/api/admin/brands` |
| `owner` | `测试狗` |
| `source_run` | `admin-brands-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-brands:search-no-longer-covers-contact-fields` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

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
| 修复说明 | 如果要保持老后台搜索能力，应把联系人姓名/电话重新纳入搜索范围，并同步到接口或本地过滤语义。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
