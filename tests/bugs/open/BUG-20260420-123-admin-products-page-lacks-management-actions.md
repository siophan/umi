# BUG-20260420-123

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-123` |
| `title` | 商品列表页退化成只读摘要页，丢失新增、编辑、上下架和删除链路 |
| `severity` | `P1` |
| `status` | `triaged` |
| `area` | `admin/products-actions` |
| `scope` | `admin` |
| `page` | `#/products/list` |
| `api` | `/api/admin/products` |
| `owner` | `测试狗` |
| `source_run` | `tests/reports/admin-products-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-products:lacks-management-actions` |
| `fix_owner` | `` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 商品管理页应保留新增、编辑、上下架、删除等核心管理动作，而不是只允许查看摘要。 |
| 对齐基准 | 旧后台商品管理页的操作链，以及“商品管理”模块语义。 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前页没有任何操作列，也没有新增按钮；表格行点击后只打开一个只读摘要抽屉，里面只有品牌、分类、店铺、售价、库存、状态和标签。 |
| 影响范围 | `#/products/list` 无法承担商品管理职责，已经退化成只读浏览页。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/products/list`。 |
| 2 | 查看顶部工具栏和表格列。 |
| 3 | 点击任一商品行。 |
| 4 | 页面没有新增/编辑/上下架/删除操作，只有只读抽屉。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:122) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:162) 当前列定义没有任何“操作”列；[apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:202) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:215) 工具栏为空，点行只会 `setSelected(record)`；[apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:219) 到 [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx:251) 抽屉只有只读摘要。 |
| 旧页对照 | [admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx:75) 到 [admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx:101) 旧页支持编辑；[admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx:142) 到 [admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx:186) 旧页支持保存和删除；[admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx:262) 到 [admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx:287) 旧页表格保留编辑、上下架和删除操作；[admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx:277) 到 [admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx:288) 顶部还有链接导入和新增商品入口。 |
| 相关文件 | [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) [admin/src/pages/products/index.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/products/index.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/admin/src/pages/products-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/products-page.tsx) | 当前商品管理页只剩只读列表和摘要抽屉。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 待补 |
| 验证命令 | `pnpm --filter @umi/admin typecheck` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
