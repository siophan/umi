# BUG-20260420-079

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-079` |
| `title` | 品牌授权页把审核列表和授权记录绑成同一失败面，一条请求失败会清空两页数据 |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `admin/brand-auth/load` |
| `scope` | `admin` |
| `page` | `#/shops/brand-auth` |
| `api` | `/api/admin/brands/auth-applies` `/api/admin/brands/auth-records` |
| `owner` | `测试狗` |
| `source_run` | `admin-brand-auth-qa-2026-04-20.md` |
| `fingerprint` | `admin-brand-auth:one-request-failure-clears-both-tabs` |
| `fix_owner` |  |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 授权审核和授权记录应各自独立加载；一侧接口失败最多影响对应 tab，不应把另一侧已成功数据一起清空。 |
| 对齐基准 | 两个 tab 对应两条独立业务列表。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 页面初始化把 `fetchAdminBrandAuthApplies()` 和 `fetchAdminBrandAuthRecords()` 绑进同一个 `Promise.all`。只要任意一条失败，就会同时 `setApplyRows(emptyApplyRows)` 和 `setRecordRows(emptyRecordRows)`。 |
| 影响范围 | 后台会把单侧读链异常误展示成“两侧都没有数据”。 |
| 是否稳定复现 | `yes` |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | 页面初始化把审核列表和记录列表绑成同一个 `Promise.all`，失败后同时清空两组数据，见 [shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx:79) 到 [shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx:95)。 |
| 接口证据 | 审核列表和授权记录本来就是两条独立请求，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts:189) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts:220)。 |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [shop-brand-auth-applies-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shop-brand-auth-applies-page.tsx) | 两个 tab 的主表被绑成同一失败面。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 审核列表和授权记录应拆开失败处理，分别维护 loading / issue / rows。 |
| 验证命令 | 待补 |
| Fixer 自测结果 | 待补 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | 待补 |
