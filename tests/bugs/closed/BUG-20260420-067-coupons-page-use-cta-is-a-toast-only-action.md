# BUG-20260420-067

## Meta

| 字段 | 值 |
| --- | --- |
| `bug_id` | `BUG-20260420-067` |
| `title` | 优惠券页“使用”按钮只是 toast，没有真实去使用链路 |
| `severity` | `P2` |
| `status` | `closed` |
| `area` | `coupon/use-cta` |
| `page` | `/coupons` |
| `api` | `` |
| `owner` | `测试猫` |
| `source_run` | `tests/reports/user-page-parity-round1-2026-04-20.md` |
| `fingerprint` | `web-coupons:use-cta-toast-only` |
| `fix_owner` | `用户端全栈一` |
| `verify_owner` | `测试猫` |
| `created_at` | `2026-04-20` |
| `last_seen_at` | `2026-04-21` |

## Expected

| 项目 | 内容 |
| --- | --- |
| 预期行为 | “使用”按钮要么把用户带到真实可用场景，要么不要作为主 CTA 暴露。 |
| 对齐基准 | 页面动作真实性要求 |

## Actual

| 项目 | 内容 |
| --- | --- |
| 实际行为 | 未使用优惠券卡片上的“使用”按钮只执行 `setToast('去使用')`，没有跳转、没有筛选商品、也没有回到可用下单场景。 |
| 影响范围 | 用户会误以为点完能去可用场景，实际只是一个无落点提示。 |
| 是否稳定复现 | `yes` |

## Repro

| 步骤 | 内容 |
| --- | --- |
| 1 | 打开 `/coupons` 并切到“未使用”。 |
| 2 | 点击任意一张券的“使用”。 |
| 3 | 页面只弹出“去使用”toast，没有任何后续动作。 |

## Evidence

| 类型 | 内容 |
| --- | --- |
| 页面证据 | [apps/web/src/app/coupons/page.tsx:97](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:97) 到 [apps/web/src/app/coupons/page.tsx:103](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:97)。 |
| 老系统参考 | 老页也只有 toast，但那说明这条能力一直没闭环；新页已接真实券数据后仍继续暴露这个空 CTA，见 [/Users/ezreal/Downloads/joy/frontend/coupons.html](/Users/ezreal/Downloads/joy/frontend/coupons.html:87)。 |
| 日志/断言 | 点击事件唯一动作是 `setToast('去使用')`。 |
| 相关文件 | [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx) |

## Suspect Files

| 文件 | 备注 |
| --- | --- |
| [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx) | 券列表主 CTA 没有真实使用落点。 |

## Fix Notes

| 项目 | 内容 |
| --- | --- |
| 修复说明 | 已把未使用优惠券的“使用”按钮改成真实跳转到 `/mall`，不再保留 `setToast('去使用')` 这类空动作提示；同时移除了页面上已经无用途的 toast 状态和样式。 |
| 验证命令 | `pnpm --filter @umi/web typecheck`；`pnpm --filter @umi/web build` |
| Fixer 自测结果 | 通过。点击“使用”会进入真实可用的商城场景，不再只是 toast。 |
| Verifier 复测结果 | 通过。当前未使用优惠券卡片上的“使用”按钮已经改成真实跳转到 `/mall`，页面里也不再保留原先只会 `setToast('去使用')` 的空动作路径。 |
| 修复提交/变更 | [apps/web/src/app/coupons/page.tsx](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx)、[apps/web/src/app/coupons/page.module.css](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.module.css) |

## Director Re-review

| 项目 | 内容 |
| --- | --- |
| `director_owner` | `test-director` |
| `reviewed_at` | `2026-04-21` |
| `review_mode` | `代码验证` |
| `结论` | `已复核通过` |
| `说明` | `2026-04-21` 按 `/coupons` 同页合并复核时重新核对当前工作树：[apps/web/src/app/coupons/page.tsx:96](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:96) 到 [apps/web/src/app/coupons/page.tsx:100](/Users/ezreal/Downloads/joy/umi/apps/web/src/app/coupons/page.tsx:100) 的“使用”按钮已改成 `router.push('/mall')`，页面里也不再保留原先只会 toast 的空动作路径。 |
