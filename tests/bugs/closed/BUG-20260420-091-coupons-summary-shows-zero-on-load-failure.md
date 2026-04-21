# BUG-20260420-091

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-091` |
| `title` | 优惠券页在读取失败时仍把可用券数量显示成真实 `0` |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `coupon/summary-count` |
| `scope` | `user` |
| `page` | `/coupons` |
| `api` | `/api/coupons` |
| `owner` | `测试猫` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-coupons:summary-count-zero-on-load-failure` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | 当 `/api/coupons` 读取失败时，顶部“可用优惠券”统计不应继续显示成真实 `0`；应改成错误态、占位态，或和列表错误态一起收起。 |
| 对齐基准 | 页面统计口径真实性要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 读取失败分支虽然已经显示错误卡和重试按钮，但顶部统计仍直接基于被清空的 `couponsData=[]` 计算 `availableCount=0` 并展示给用户。 |
| 影响范围 | 用户会同时看到“加载失败”和“可用优惠券 0”，统计口径被继续伪装成真实业务结果。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/coupons`。 |
| 2 | 让 `/api/coupons` 请求失败。 |
| 3 | 观察页面顶部统计。 |
| 4 | 列表区域会显示错误信息，但顶部仍显示“可用优惠券 0”。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:29) 到 [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:33) 在失败时把 `couponsData` 清空；[apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:53) 到 [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:68) 仍直接计算并展示 `availableCount`。 |
| 日志/断言 | 错误态和统计态同时出现，说明统计区仍把失败解释成“真实没有可用券”。 |
| 相关文件 | [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx) | 顶部统计没有区分“加载失败”和“真实为 0”。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 优惠券页顶部摘要已区分加载失败和真实 `0`：当 `/api/coupons` 失败时，统计值改显示为 `--`，标签改成“优惠券读取失败”，不再把错误态伪装成真实可用券数量。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。失败态下顶部不再显示“可用优惠券 0”，而是明确显示读取失败。 |
| Verifier 复测结果 | 通过。当前优惠券页顶部摘要在错误态下已改成显示 `--` 和“优惠券读取失败”，不再把读取失败继续展示成真实可用券数量 `0`。 |
| 修复提交/变更 | [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx) |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `已复核通过` |
| `说明` | `2026-04-21` 按 `/coupons` 同页合并复核时重新核对当前工作树：[apps/web/src/app/coupons/page.tsx:39](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:39) 到 [apps/web/src/app/coupons/page.tsx:41](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:39) 已把错误态摘要改为 `summaryCount='--'`、`summaryLabel='优惠券读取失败'`；失败时不再把统计继续伪装成真实 `0`。 |
