# BUG-20260420-060

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-060` |
| `title` | 分类管理新增弹层仍把停用父分类当成可选项，提交后才会被后端拒绝 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/categories/create` |
| `scope` | `admin` |
| `page` | `#/system/categories` |
| `api` | `/api/admin/categories` |
| `owner` | `测试狗` |
| `source_run` | `admin-permissions-system-qa-2026-04-20.md` |
| `fingerprint` | `admin-categories:disabled-parent-still-selectable` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 新增分类时，“父分类”下拉应只展示当前业务域下可作为父节点的启用分类，不应把后端明确禁止的停用父分类暴露给用户。 |
| 对齐基准 | 后端创建分类时已经明确要求“请先启用父分类”。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 新增分类弹层的 `parentOptions` 只按 `bizTypeCode` 过滤，没有排除 `status === 'disabled'` 的分类；用户可以选中停用父分类，但提交时后端固定拒绝。 |
| 影响范围 | 页面暴露了必然失败的表单选项，运营需要通过试错才能知道某些父分类不可用。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 在 `#/system/categories` 先停用某个父分类。 |
| 2 | 点击“新增”，选择同业务域。 |
| 3 | 在“父分类”下拉里仍然能看到并选中这个停用父分类。 |
| 4 | 提交后接口返回“请先启用父分类”。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 新增/编辑弹层的 `parentOptions` 只按 `bizTypeCode` 过滤，没有排除停用分类，见 [categories-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/categories-page.tsx:153) 到 [categories-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/categories-page.tsx:163)。 |
| 页面证据 | 新增弹层的“父分类”直接使用这组 `parentOptions`，见 [categories-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/categories-page.tsx:357) 到 [categories-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/categories-page.tsx:370)，以及 [categories-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/categories-page.tsx:446) 到 [categories-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/categories-page.tsx:455)。 |
| 接口证据 | 后端创建分类时会检查父分类状态，只要父分类停用就直接报错“请先启用父分类”，见 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts:320) 到 [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts:330)。 |
| 相关文件 | [categories-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/categories-page.tsx) [categories.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/categories.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [categories-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/categories-page.tsx) | 父分类选项来源没有过滤停用节点。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 弹层父分类选项应过滤掉停用节点，或者至少在下拉中标记禁用并解释原因。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
