# 品牌发券改造设计

> 日期：2026-05-08
> 关闭：CLAUDE.md #29（签到奖励发券）+ #30（邀请奖励发券 + 闭环）
> 关联 memory：`project_coupon_brand_issued.md`（2026-05-02 拍板"优惠券走品牌发券模型"）

## 1. 背景

平台优惠券模型从"店铺发券"改为"品牌发券"。`coupon_template` 现有 `shop_id` 字段已被运营冻结使用（memory 2026-05-02），取而代之是 `brand_id` 维度。

签到奖励（#29）和邀请有礼（#30）两个 P1 都因为优惠券模板还没有"按品牌"的入口而搁置——admin 配不出可发的模板，发券逻辑无处下钩。

本次改造一次性把"品牌发券基建"+"两个发券触达点"+"邀请闭环"打通。

## 2. 范围 + 切片

分两批 PR：

### 批次 1：品牌发券基建 + 签到发券

- `coupon_template` schema：DROP `shop_id`，ADD `brand_id` + `brand_product_ids` JSON
- `coupon` schema：ADD `brand_id` + `brand_product_ids` + `scope_type`（快照入库）
- `coupon_template.scope_type` 编码语义改：`10=platform / 20=brand`（重用 20，drop shop）
- admin 后台「优惠券模板」CRUD 表单 + 列表改为按 `品牌 + 限定 SPU` 维度
- 用户端 `listClaimableCouponTemplates` 改为 `brandId + brandProductId` 维度过滤
- 购物车 / payment 用券逻辑：brand 券抵扣按 order_item 子小计，platform 券继续抵全单
- 签到 `performCheckin` 接通 `claimCouponFromTemplate`（事务外、失败仅 log）

### 批次 2：邀请闭环 + 邀请发券

- `invite_reward_config` schema：ADD `tier_no` + `UNIQUE (tier_no)`，admin 改多行 CRUD
- 新增 `invite_reward_grant` 表（防重复发同一 tier）
- 用户端 `/invite` 拉真配置替换写死的 4 档
- 新增 `GET /api/invite/reward-tiers` + `GET /api/invite/records`
- 注册路径：解析 `?invite=`，写 `user.invited_by` + `invite_record`
- 老账号 `invite_code` lazy backfill（`ensureUserInviteCode`，参考 `ensureUserUidCode` pattern）
- `triggerInviteReward(inviterId, inviteeId)`：注册 commit 后跨阈值发 inviter 券 + 给 invitee 发 tier_no=1 的 invitee 券

## 3. 数据模型

### 3.1 `coupon_template`

```
DROP shop_id
ADD brand_id BIGINT NULL  → INDEX idx_brand
ADD brand_product_ids JSON NULL  → 范围限定，NULL = 该品牌全量 SPU
```

`scope_type` 编码改：

| 编码 | 旧语义 | 新语义 |
|---|---|---|
| `10` | `platform` | `platform` |
| `20` | `shop`（drop） | `brand` |

### 3.2 `coupon`（已发券快照表）

```
ADD scope_type TINYINT UNSIGNED NOT NULL DEFAULT 10
ADD brand_id BIGINT NULL
ADD brand_product_ids JSON NULL
```

`claimCouponFromTemplate` INSERT 时从 template 行直接拷贝这 3 列。语义快照后冻结，模板后续修改不影响已发券。

### 3.3 `invite_reward_config`

```
ADD tier_no TINYINT UNSIGNED NOT NULL
UNIQUE (tier_no)
```

`tier_no` = 邀请人累计成功邀请数阈值（运营自由配，例如 1/3/10/30）。每行一档梯度。

`invitee_reward_*` 三列保留：仅 `tier_no=1` 那一行的 invitee 字段会在 register 时发券，其余 tier 的 invitee 字段本期不读（二期可扩"被邀请人随邀请人达阈值补发"）。

### 3.4 `invite_reward_grant`（新增）

```sql
CREATE TABLE invite_reward_grant (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  inviter_id BIGINT NOT NULL,
  tier_no TINYINT UNSIGNED NOT NULL,
  inviter_coupon_id BIGINT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_inviter_tier (inviter_id, tier_no)
);
```

防"同一 inviter 同一 tier 重复发券"。INSERT IGNORE 在 `claimCouponFromTemplate` 成功后写，失败则不写、下次可补。

### 3.5 `user`

字段已有（`invite_code` UNIQUE，`invited_by` BIGINT NULL）。无 schema 变更。

### 3.6 `invite_record`

字段已有。register 路径接通即可。

## 4. API + 业务流

### 4.1 admin coupon_template

`apps/api/src/modules/admin/coupons-shared.ts` 常量：

```ts
COUPON_SCOPE_PLATFORM = 10
COUPON_SCOPE_BRAND    = 20  // 重用编码（drop SHOP）
```

`normalizeCouponTemplatePayload`：
- `scopeType: 'platform' | 'brand'`
- `scopeType=brand` 时 `brandId` 必填，校验 `brand.status=10`
- `brandProductIds`：传非 null 时校验所有 id 都属于该 brand 且 `bp.status=10`，避免跨品牌脏数据
- 校验 SQL：`SELECT brand_id FROM brand_product WHERE id IN (...)` 必须 GROUP 出唯一 brand_id

admin 表单 UI（`apps/admin/src/lib/admin-coupon-page.tsx` + `marketing-coupons-page.tsx`）：
- 「适用范围」select 改 `平台通用 / 指定品牌`
- scope=brand 时显示「品牌」select（拉 `brand` 表 status=10）+ 「限定 SPU」多选（按选中品牌过滤 `brand_product`，未选/置空 = 品牌全量）
- 列表「适用范围」列改 `平台通用` / `品牌·{name}{ · N 个 SPU}`

shared types（`api-admin-ops.ts`）：`AdminCouponTemplateScopeType = 'platform' | 'brand'`，新增 `brandId / brandName / brandProductIds / brandProductCount` 字段。

### 4.2 用户端可领券

`apps/api/src/modules/coupon/store.ts: listClaimableCouponTemplates` 签名：

```ts
listClaimableCouponTemplates(userId, options: {
  brandId?: string | null;
  brandProductId?: string | null;
})
```

WHERE 子句：

```sql
ct.status = 10
AND (ct.end_at IS NULL OR ct.end_at > NOW())
AND (
  ct.scope_type = 10                                                   -- platform
  OR (
    ct.scope_type = 20
    AND ct.brand_id = ?
    AND (
      ct.brand_product_ids IS NULL
      OR JSON_CONTAINS(ct.brand_product_ids, JSON_QUOTE(?))
    )
  )
)
```

调用方：
- 商品详情页：`brandId + brandProductId`
- 品牌页：`brandId + brandProductId=null`（看品牌全量）
- 首页 / 我的页：`brandId=null`（仅 platform 券）

### 4.3 `claimCouponFromTemplate` 快照入库

INSERT 增加 3 列 `scope_type, brand_id, brand_product_ids`，全部从 template 行拷贝。

### 4.4 购物车 / payment 用券

`order_item` 没有 `brand_id` 直存列，要拿 brand 必须 JOIN：

```sql
order_item oi
  INNER JOIN brand_product_sku bps ON bps.id = oi.brand_product_sku_id
  INNER JOIN brand_product bp ON bp.id = bps.brand_product_id
-- bp.brand_id, bp.id 即 SPU id（用于 brand_product_ids 限定校验）
```

- `cart/store.ts`：列出该 cart 可用券时，先 JOIN 算出 cart 内 brand 集合，过滤 `coupon` 表（用户已领的）：platform 券全部展示 + brand 券需 brand_id ∈ 集合且（brand_product_ids IS NULL 或与 cart SPU 集合有交集）
- payment 抵扣语义：
  - **platform 券**：抵全单
  - **brand 券**：JOIN 算 `subtotal_brand = SUM(oi.item_amount WHERE bp.brand_id=券.brand_id)`；若 brand_product_ids 非空，过滤到命中 SPU 子集再求和；需 `subtotal_brand ≥ min_amount` 才能用，仅扣 `subtotal_brand`
- **本期单订单只能选一张券**：API 契约 `couponId: string | null`（不改成数组），前端 UI 单选；二期再开放多张同选

### 4.5 签到接通发券

`checkin/store.ts: performCheckin`：

1. 事务内 INSERT user_checkin（不变）
2. **commit 后**（事务外）查 `checkin_reward_config WHERE day_no=streak AND status=10`
3. 命中且 `reward_type=20 (coupon)` → 调 `claimCouponFromTemplate(userId, reward_ref_id)`
4. 整段包 try/catch，失败仅 console.error，不抛回前端
5. `reward_value` 字段语义本期忽略（coupon_template 已含面额）

### 4.6 admin invite_reward_config 改多行

`admin/invites.ts`：

- `getAdminInviteRewardConfig` → `getAdminInviteRewardConfigs`（多行）
- 新增 `createAdminInviteRewardConfig` / `updateAdminInviteRewardConfig` / `deleteAdminInviteRewardConfig` / `updateAdminInviteRewardConfigStatus`
- 路由：`GET / POST / PUT /:id / DELETE /:id / PUT /:id/status`（与 `/api/admin/checkin/rewards` 同款）
- normalize：tier_no 1-365；reward_type=coupon 时 reward_ref_id 必填

admin 前端：套用 checkin reward 页面同款 layout（列表 + 抽屉表单 + 状态切换）。

### 4.7 用户端 `/invite` 拉真配置

`fetchInviteRewardTiers()` 拉 `GET /api/invite/reward-tiers` → 按 `tier_no asc` 列出。每档展示用 `title` + `tier_no` 计算文案"邀请 N 位好友"+ 命中关联 coupon_template 的 name/amount。写死 `REWARD_TIERS` 数组下线。

`GET /api/invite/records` 返回 `{ items: [{ name, avatar, time, tierLabel? }] }`。

### 4.8 注册闭环

`RegisterPayload` 加 `inviteCode?: string`（shared + OpenAPI schema）。

web 注册页：解析 `URLSearchParams.get('invite')`，写 sessionStorage 防刷新丢，提交时塞 payload。

后端 `auth/store.ts` register handler：
1. payload.inviteCode 非空 → `SELECT id FROM user WHERE invite_code=? AND status<>banned`
2. 找到 → INSERT user 时 `invited_by=inviter_id`；同事务里 `INSERT invite_record(inviter_id, invitee_id)`
3. invite_code 不存在 / 失效 → 仍正常注册，`invited_by=NULL`，不报错（被邀人体验优先）
4. 主事务 commit 后，事务外调 `triggerInviteReward(inviterId, inviteeId)`

### 4.9 lazy backfill `invite_code`

参考 `ensureUserUidCode` pattern：

`query-store.ts: attachUserUidCode` → 改名 `attachUserCodes`，并行读 uid_code + invite_code，命中 NULL 时生成。

生成算法：6 位字母数字（去歧义字符 `0OIl1`）+ UNIQUE 冲突重试 3 次；仅 `WHERE invite_code IS NULL` 时 UPDATE，避免覆盖；并发安全靠 UNIQUE 兜底。重试 3 次仍失败 → `inviteCode=null`，UI 显示"敬请期待"，不阻塞登录。

### 4.10 `triggerInviteReward`

```ts
async function triggerInviteReward(inviterId: string, inviteeId: string) {
  // 1) 计算 inviter 的累计成功邀请数
  const [{ cnt }] = await db.query(
    'SELECT COUNT(*) AS cnt FROM invite_record WHERE inviter_id = ?',
    [inviterId],
  );

  // 2) 找跨过的所有 active tier（未发过的）
  const tiers = await db.query(`
    SELECT * FROM invite_reward_config
    WHERE status = 10 AND tier_no <= ?
      AND tier_no NOT IN (
        SELECT tier_no FROM invite_reward_grant WHERE inviter_id = ?
      )
    ORDER BY tier_no ASC
  `, [cnt, inviterId]);

  // 3) 每个 tier：先发券再写 grant 记录（顺序很重要，见 §5.1）
  for (const tier of tiers) {
    if (tier.inviter_reward_type === 20 /* coupon */) {
      try {
        const { couponId } = await claimCouponFromTemplate(inviterId, tier.inviter_reward_ref_id);
        await db.execute(
          'INSERT IGNORE INTO invite_reward_grant (inviter_id, tier_no, inviter_coupon_id) VALUES (?, ?, ?)',
          [inviterId, tier.tier_no, couponId],
        );
      } catch (e) {
        console.error('inviter reward grant failed', { inviterId, tier_no: tier.tier_no, e });
      }
    }
  }

  // 4) 给 invitee 发 tier_no=1 的 invitee 券
  const [tier1] = await db.query(
    'SELECT * FROM invite_reward_config WHERE tier_no=1 AND status=10 LIMIT 1',
  );
  if (tier1?.invitee_reward_type === 20 && tier1.invitee_reward_ref_id) {
    try {
      await claimCouponFromTemplate(inviteeId, tier1.invitee_reward_ref_id);
    } catch (e) {
      console.error('invitee reward grant failed', { inviteeId, e });
    }
  }
}
```

整段包 try/catch，失败仅 log，不影响注册成功响应。

### 4.11 OpenAPI / shared 同步

- `RegisterPayload` 加 `inviteCode`
- 新增 `InviteRewardTierItem` / `InviteRecordItem` types
- `GET /api/invite/reward-tiers` / `GET /api/invite/records` 加 OpenAPI 路径
- `AdminInviteRewardConfig*` types 改多行
- admin coupon types 加 `brandId / brandName / brandProductIds / brandProductCount`

## 5. 错误处理 + 边界

### 5.1 跨阈值竞态

同一 inviter 同时跨 tier_no=3 阈值时有两个 invitee 注册：两条并发 register handler 都看到 cnt=3、都尝试发 tier=3 → 第二条 INSERT IGNORE invite_reward_grant 撞 UNIQUE → affectedRows=0。

**修法**：先 `claimCouponFromTemplate` → 成功后 INSERT IGNORE → 若 affectedRows=0（被另一方抢先）也只是多发了一张券，可接受（运营 admin 配置库存兜底）。如果坚持严格防双发，可以改成"先 INSERT IGNORE 看 affectedRows=1 才发券"；但 INSERT 不能回滚已发券，反向更难处理。本期采用"先发后记"+ 偶发重复一张券的取舍。

### 5.2 错误处理矩阵

| 场景 | 行为 |
|---|---|
| 签到发券：`claimCouponFromTemplate` 抛错（模板停用 / 已领完 / 超 user_limit） | console.error；签到 INSERT 已 commit，前端正常返回签到成功 |
| 签到发券：`reward_ref_id` 指向 template 不存在 | 视为"无奖励"，签到正常完成 |
| 注册带 `?invite=` 但 invite_code 不存在 / 被封号 | invited_by 写 NULL，注册成功 |
| 注册主事务回滚 | 不走到 `triggerInviteReward`，自然不发券 |
| `triggerInviteReward` 内任何异常 | 整段包 catch + log，不抛回 register handler |
| 邀请阈值并发 | 见 §5.1（先发后记，偶发多发可接受） |
| `claimCouponFromTemplate` 在 invite 路径抛错 | grant 记录不写，下次跨阈值时该 tier 仍可被检出补发 |
| brand_product_ids 校验在 admin update 改动 | 已发 coupon 快照 brand_product_ids，模板改动不影响历史券 |
| 老账号 invite_code lazy gen 撞 UNIQUE | 重试 3 次仍失败 → fetchMe 返回 inviteCode=null，UI "敬请期待" |
| payment 抵扣 brand 券子小计 < min_amount | UI 提示"该券不满足品牌小计 ¥X"，按钮禁用；不阻塞下单 |

## 6. 上线策略

部署顺序与 #26 SKU 改造同样规则：DB schema 一次性执行 → 同窗口部署代码 PR；不分两段切换。

### 6.1 批次 1 上线步骤

1. 运维清空 `coupon_template` / `coupon` / `coupon_grant_batch` 旧测试数据
2. 执行 `packages/db/sql/coupon_brand_refactor.sql`：
   - DROP `coupon_template.shop_id`
   - ADD `coupon_template.brand_id` + idx + `brand_product_ids`
   - ADD `coupon.brand_id` + `brand_product_ids` + `scope_type`
3. 部署批次 1 代码
4. 运营在 admin 重新配模板（按 brand）
5. 运营在 admin「签到奖励」配置 `day_no=N → reward_type=coupon → reward_ref_id=新模板 id`

### 6.2 批次 2 上线步骤

1. 执行 `packages/db/sql/invite_reward_tier.sql`：
   - 清空 `invite_reward_config`（旧单行废）
   - ADD `tier_no` + UNIQUE
   - CREATE TABLE `invite_reward_grant`
2. 部署批次 2 代码
3. 运营在 admin「邀请奖励」按 tier 配 4 行（或更多）

### 6.3 文档收尾

- `docs/full-schema.md`：`coupon_template` / `coupon` / `invite_reward_config` 三张表更新；新增 `invite_reward_grant` 段
- `docs/status-codes.md`：`coupon_template.scope_type` 第二行从 `shop` 改 `brand`
- `CLAUDE.md`：#29 / #30 移到「已完成」段；P1 计数从 2 → 0

## 7. 测试范围

跨多模块改造，下面这些路径**必须人工跑过一次**才能算完：

- admin 创建 brand 模板 → 用户端 `/coupons` 拉到 → 商品详情可领 → 领取 → 我的优惠券显示
- 签到 day_no=2 配 coupon → 第二天签到后我的优惠券多一张
- 注册 `?invite=B` → B 已邀请 +1 → 跨 tier=1 → B 收到 inviter 券 + A 收到 invitee 新人券
- 老账号 fetchMe 后看到 inviteCode 已生成
- 购物车多 brand 同场，选一张 brand 券 → 仅扣该品牌子小计

## 8. 二期遗留

- 多张券同时叠加（platform + brand × 2）的 UI + 抵扣
- "被邀请人随邀请人达阈值补发"：tier_no=3/10/30 的 invitee_reward_ref_id 也发
- coupon_grant_batch 按品牌发券的 audience 扩展（admin 主动批发）
