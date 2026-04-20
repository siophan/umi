# BUG-20260420-044

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-044` |
| `title` | 店铺列表“查看”动作只有摘要抽屉，缺少真实详情链路和关联记录 |
| `severity` | `P1` |
| `status` | `fixed_pending_verify` |
| `area` | `admin/shops/detail` |
| `scope` | `admin` |
| `page` | `#/shops/list` |
| `api` | `/api/admin/shops` |
| `owner` | `用户端全栈一` |
| `source_run` | `admin-shops-list-qa-2026-04-20.md` |
| `fingerprint` | `admin-shops:view-action-summary-only-no-detail-chain` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试狗` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-20` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 店铺列表的“查看”应进入真实详情链路，至少能看到店铺基础信息、当前状态和关联记录；不应只把列表行摘要重新包成一个抽屉。 |
| 对齐基准 | `AGENTS.md` 详情页规则 / 老后台店铺详情页结构 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 当前“查看”按钮只执行 `setSelected(record)` 打开本地抽屉，抽屉内容完全来自列表行已有字段；前端没有 `fetchAdminShopDetail()`，OpenAPI 里也没有 `/api/admin/shops/{id}` 详情读链。 |
| 影响范围 | 后台运营无法从店铺列表直接查看该店铺的商品、订单、竞猜、品牌授权等关联记录；“查看”动作实际上只是重复显示列表摘要，难以支撑审核和运营判断。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `#/shops/list`。 |
| 2 | 点击任一店铺的“查看”。 |
| 3 | 页面只打开一个摘要抽屉，内容与列表行基本重复，不会继续请求真实详情，也没有关联记录 tab 或详情链路。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | “查看”按钮只执行 `setSelected(record)`，见 [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:184) 到 [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:188)；抽屉内容直接消费 `selected`，见 [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:310) 到 [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx:339)。 |
| 接口证据 | 前端店铺 API 只提供列表与状态更新，未提供详情读取，见 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts:181) 到 [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts:191)；当前 OpenAPI 也只声明了 `/api/admin/shops` 和 `/api/admin/shops/{id}/status`，见 [admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:455) 到 [admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts:723)。 |
| 日志/断言 | 老后台店铺详情页会继续请求 `/api/admin/shops/${shopId}`，并展示商品、订单、竞猜、品牌授权 tab，见 [detail.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/shops/detail.tsx:47) 到 [detail.tsx](/Users/ezreal/Downloads/joy/admin/src/pages/shops/detail.tsx:187)。 |
| 相关文件 | [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx) [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts) [admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [shops-page.tsx](/Users/ezreal/Downloads/joy/umi/apps/admin/src/pages/shops-page.tsx) | “查看”只有摘要抽屉，没有真实详情链路。 |
| [merchant.ts](/Users/ezreal/Downloads/joy/umi/apps/admin/src/lib/api/merchant.ts) | 缺少店铺详情读取封装。 |
| [admin.ts](/Users/ezreal/Downloads/joy/umi/apps/api/src/routes/openapi/paths/admin.ts) | 未暴露店铺详情接口契约。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已为后台店铺列表补 `GET /api/admin/shops/{id}` 真实详情接口，返回店铺基础信息、商品、订单、竞猜、品牌授权 5 组数据；列表页“查看”改成真实详情抽屉，不再重复消费列表摘要。 |
| 验证命令 | `pnpm --filter @umi/api typecheck`；`pnpm --filter @umi/admin typecheck`；`pnpm --filter @umi/admin build` |
| Fixer 自测结果 | 通过。后台与接口类型检查通过，管理台生产构建通过；“查看”动作已改为请求真实详情链路。 |
| Verifier 复测结果 | 待补 |
| 修复提交/变更 | `packages/shared/src/api.ts`；`apps/api/src/modules/admin/merchant.ts`；`apps/api/src/modules/admin/router.ts`；`apps/api/src/routes/openapi/paths/admin.ts`；`apps/admin/src/lib/api/merchant.ts`；`apps/admin/src/pages/shops-page.tsx` |

## Fixer

- 已新增后台店铺详情接口 `GET /api/admin/shops/{id}`，覆盖基础信息、商品、订单、竞猜、品牌授权关联记录。
- 已把店铺列表“查看”改成真实详情抽屉；抽屉内的 tab 数据不再来自列表行摘要。
- 已补前端 API 封装和 OpenAPI 路径声明。
