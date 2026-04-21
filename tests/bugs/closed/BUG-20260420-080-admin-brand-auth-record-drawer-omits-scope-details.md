# BUG-20260420-080

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-080` |
| `title` | 品牌授权记录抽屉不展示具体授权对象，指定类目/商品授权无法复核 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `admin/brand-auth/record-detail` |
| `scope` | `admin` |
| `page` | `#/shops/brand-auth` |
| `api` | `/api/admin/brands/auth-records` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-brand-auth-qa-2026-04-20.md` |
| `fingerprint` | `admin-brand-auth:record-drawer-omits-scope-details` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 对于“指定类目授权”或“指定商品授权”，记录详情应能看到具体授权对象，否则无法复核授权边界。 |
| 对齐基准 | 授权记录接口已经返回了 `scopeValue`、`subject`、`operatorName` 等详情字段。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 记录抽屉只展示授权范围标签，不展示 `scopeValue` 里的具体类目/商品对象，也不展示 `subject`、`operatorName`。当记录是 scoped 授权时，后台无法判断实际授权到了什么。 |
| 影响范围 | 指定类目/指定商品授权在后台不可复核，记录抽屉丢失关键审计信息。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 接口证据 | 授权记录接口返回了 `subject`、`scopeValue`、`operatorName`，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:431) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/modules/admin/merchant.ts:456)，以及 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts:96) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts:108)。 |
| 页面证据 | 记录抽屉只展示 `authScopeLabel` 等概要字段，没有任何地方渲染 `scopeValue`、`subject`、`operatorName`，见 [shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx:566) 到 [shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx:595)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx) | 记录抽屉只展示摘要标签，没把 scoped 授权细节带出来。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已把授权记录抽屉补齐到可复核状态：记录行模型透传 `subject`，抽屉新增“授权对象”展示；同时把 `scopeValue` 的展示从原样串改成按数组/对象递归可读化展开，支持 `name/title/label/categoryName/productName/id` 等常见结构，指定类目/指定商品授权不再只看到抽象范围标签。 |
| 验证命令 | `pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。品牌授权记录抽屉现在会展示 `subject` 和可读的 `scopeValue` 明细，指定类目/指定商品授权可直接复核授权对象；admin `typecheck` 与 `build` 均通过。 |
| Verifier 复测结果 | `2026-04-21` 代码复测通过。当前记录详情已迁到 `apps/admin/src/components/admin-brand-auth-detail-drawer.tsx`，抽屉已经补出“授权对象”“范围明细”“操作人”等字段；`apps/admin/src/lib/admin-brand-auth.tsx` 也会把 `scopeValue` 按数组/对象递归展开成人可读文本，指定类目/指定商品授权现在可以直接复核。 |
| 修复提交/变更 | `/Users/ezreal/Downloads/joy/umi/apps/admin/src/components/admin-brand-auth-detail-drawer.tsx`；`/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-brand-auth.tsx` |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `已复核通过` |
| `说明` | `2026-04-21` 按 `#/shops/brand-auth` 同页合并复核时重新核对当前工作树：[apps/admin/src/components/admin-brand-auth-detail-drawer.tsx:18](/Users/ezreal/Downloads/joy/umi/apps/admin/src/components/admin-brand-auth-detail-drawer.tsx:18) 到 [apps/admin/src/components/admin-brand-auth-detail-drawer.tsx:57](/Users/ezreal/Downloads/joy/umi/apps/admin/src/components/admin-brand-auth-detail-drawer.tsx:57) 已展示 `subject`、`scopeValue`、`operatorName`；[apps/admin/src/lib/admin-brand-auth.tsx:74](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-brand-auth.tsx:74) 到 [apps/admin/src/lib/admin-brand-auth.tsx:133](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/admin-brand-auth.tsx:133) 会把 scoped 授权明细展开成可读文本。 |
