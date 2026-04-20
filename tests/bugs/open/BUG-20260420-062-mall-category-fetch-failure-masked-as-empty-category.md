# BUG-20260420-062

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-062` |
| `title` | 商城分类页把分类请求失败静默吞成“当前分类暂无商品” |
| `severity` | `P2` |
| `status` | `triaged` |
| `area` | `mall/category` |
| `page` | `/mall` |
| `api` | `/api/products?categoryId=*` |
| `owner` | `测试猫` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-mall:category-fetch-failure-empty-category-state` |
| `fix_owner` | `` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 分类模式下读取某个分类商品失败时，应显示明确错误态或重试入口，不应伪装成“当前分类暂无商品”。 |
| 对齐基准 | 当前产品要求 / 页面错误处理一致性 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | `/mall` 首屏已经有商品流错误态，但切到具体分类后，如果 `fetchProductList({ categoryId })` 失败，页面会把该分类缓存成空数组，然后直接落到“当前分类暂无商品”。 |
| 影响范围 | 用户会把分类接口故障误判成“该类目没商品”；修复线程也很难从页面表象判断是读链异常还是业务空态。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/mall`。 |
| 2 | 打开“分类”并进入任一具体分类。 |
| 3 | 让该分类的 `/api/products?categoryId=*` 请求失败。 |
| 4 | 页面会显示“当前分类暂无商品”，而不是分类加载失败。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/components/mall-home.tsx:271](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:271) 到 [apps/web/src/components/mall-home.tsx:302](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:302)。 |
| 渲染证据 | [apps/web/src/components/mall-home.tsx:703](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:703) 到 [apps/web/src/components/mall-home.tsx:710](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx:703)。 |
| 日志/断言 | 分类请求 `catch` 分支直接执行 `setCategoryItems((current) => ({ ...current, [activeCategory]: [] }))`，随后 `filteredItems.length === 0` 走到“当前分类暂无商品”。 |
| 老系统参考 | 老系统分类筛选只是在同一份商品池内过滤，没有“按分类二次请求失败后伪装为空类目”这条分支，见 [/Users/ezreal/Downloads/joy/frontend/index.html](/Users/ezreal/Downloads/joy/frontend/index.html:3268) 到 [/Users/ezreal/Downloads/joy/frontend/index.html](/Users/ezreal/Downloads/joy/frontend/index.html:3332)。 |
| 相关文件 | [apps/web/src/components/mall-home.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/components/mall-home.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/components/mall-home.tsx) | 分类分支缺少独立错误态，失败被缓存成空数组。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 给分类模式补独立错误状态或至少区分“分类读取失败”和“该分类确实无商品”，不要把失败缓存成空列表。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 待修复 |
| Verifier 复测结果 | 待复核 |
| 修复提交/变更 | 待补充 |
