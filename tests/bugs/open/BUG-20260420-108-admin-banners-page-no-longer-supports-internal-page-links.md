# BUG-20260420-108

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-108` |
| `title` | 管理后台轮播配置不再支持站内页面跳转 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/marketing/banners-link-type` |
| `scope` | `admin` |
| `page` | `#/marketing/banners` |
| `api` | `/api/admin/banners` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-marketing-qa-2026-04-20.md` |
| `fingerprint` | `admin-marketing-banners:no-longer-supports-internal-page-links` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 轮播配置应继续支持老页的“站内页面”跳转类型，运营可以配置站内路径。 |
| 对齐基准 | 老后台轮播页的 `page` 链接类型。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前轮播页和后端契约只支持 `guess / post / product / shop / external`；老页可选的 `page` 类型已经消失，站内路径无法再配置。 |
| 影响范围 | 运营无法继续通过轮播跳转到站内运营页面，能力较老后台直接退化。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/marketing/banners`，点击新增或编辑。 |
| 2 | 查看“跳转类型”下拉。 |
| 3 | 对照老后台轮播页。 |
| 4 | 当前只剩竞猜/动态/商品/店铺/外部链接，找不到“站内页面”；接口层也没有对应类型。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/marketing-banners-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-banners-page.tsx:68) 到 [apps/admin/src/pages/marketing-banners-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-banners-page.tsx:74) 当前 `TARGET_TYPE_OPTIONS` 不包含 `page`；[apps/admin/src/pages/marketing-banners-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-banners-page.tsx:520) 到 [apps/admin/src/pages/marketing-banners-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-banners-page.tsx:542) 表单也只支持外链或目标 ID。 |
| 后端证据 | [apps/api/src/modules/admin/banners.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/banners.ts:22) 到 [apps/api/src/modules/admin/banners.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/banners.ts:26) 目标类型常量没有 `page`；[apps/api/src/modules/admin/banners.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/banners.ts:98) 到 [apps/api/src/modules/admin/banners.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/banners.ts:103) `mapBannerTargetTypeCode()` 也只映射四类实体加外链。 |
| 对照证据 | [admin/src/pages/marketing/banners.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/banners.tsx:20) 到 [admin/src/pages/marketing/banners.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/banners.tsx:25) 老页 `LINK_TYPES` 明确包含 `page`；[admin/src/pages/marketing/banners.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/banners.tsx:359) 到 [admin/src/pages/marketing/banners.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/banners.tsx:368) 还会针对 `page` 渲染“页面路径”输入框。 |
| 相关文件 | [apps/admin/src/pages/marketing-banners-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-banners-page.tsx) [apps/api/src/modules/admin/banners.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/banners.ts) [admin/src/pages/marketing/banners.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/marketing/banners.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/marketing-banners-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/marketing-banners-page.tsx) | 前端下拉和表单都移除了站内页面类型。 |
| [apps/api/src/modules/admin/banners.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/banners.ts) | 目标类型枚举不再承接站内页面。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/api typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
