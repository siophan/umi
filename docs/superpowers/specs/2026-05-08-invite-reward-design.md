# 邀请有礼闭环 + 发券 设计

> 关闭 CLAUDE.md #30 P1（邀请奖励发券 + 注册带邀请码闭环 + 邀请记录后端）。
> 与 #29（签到发券）共依赖 `claimCouponFromTemplate`，不引入新表。

## 1. 范围

**做：**
- 注册时消费 URL `?invite=<code>` → 反查 inviter user.id → 写 `user.invited_by`
- 注册时同步生成 `user.invite_code`（碰撞重试 20 次，UNIQUE 约束兜底）
- 注册主流程结束后（INSERT user + createUserProfile 完成后）异步触发奖励：根据 `invite_reward_config` 给邀请人 + 被邀请人各发一张券（仅 `reward_type=20 (coupon)` 时调 `claimCouponFromTemplate`，coin/physical 跳过 + console.warn）
- 新增 `GET /api/invite/records`：用户端「我的邀请记录」走 `user.invited_by` JOIN（与 admin 同源）
- `userSelectSql` 加 `invite_count` 子查询，让 `/invite` 页"已邀请 N 人"显示真值
- 前端 `/register` 消费 URL `invite` 参数；`/invite` 页拉 records 接口替换空列表

**不做：**
- 多档梯度触发（`/invite` 页 4 档保持纯文案展示；schema 不动）
- 老账号 `invite_code` lazy backfill helper（用户手动补 SQL）
- `invite_record` 独立表（admin 已经走 `user.invited_by` JOIN，不另起炉灶）
- 发券失败回滚注册（沿用 #29 签到模式：失败仅 log）
- 注册时 invite 码无效的报错路径（静默忽略，invited_by 留 NULL）
- `user_limit` 配置（由 admin 在 coupon_template 层维护，本期不暴露）

## 2. 数据模型（无 schema 变更）

复用现有列：
- `user.invite_code varchar(191) UNIQUE`：注册时生成，8 位 base62
- `user.invited_by bigint MUL`：注册时按 invite 码反查写入
- `invite_reward_config`（单条 active 记录）：admin 后台维护邀请人/被邀请人各一对 `reward_type / reward_value / reward_ref_id`

`reward_type` 枚举（与 admin/invites.ts 一致）：
- `10` = coin → 跳过 + console.warn（金币已下线，#20）
- `20` = coupon → ref_id 当作 coupon_template_id，调 `claimCouponFromTemplate(userId, ref_id)`
- `30` = physical → 跳过 + console.warn（一期无场景）

## 3. 数据流

```
POST /api/auth/register { phone, code, password, name, avatar?, inviteCode? }
  │
  ├─ requireValidPhone / 校验密码 / 昵称 / 验证码（既有）
  ├─ findUserByPhone 查重（既有）
  ├─ 解析 inviterId:
  │     ├─ inviteCode 非空 → SELECT id FROM user WHERE invite_code=? AND banned=0 LIMIT 1
  │     ├─ 找不到 → inviterId = null（静默忽略）
  ├─ generateUniqueUidCode（既有）
  ├─ generateUniqueInviteCode（新增，独立碰撞重试）
  ├─ INSERT user(uid_code, invite_code, invited_by, phone, password, achievements)
  ├─ createUserProfile（既有）
  ├─ createSession → result
  │  --- 主流程返回响应 ---
  │
  └─ 同进程接续（响应已 await 但不阻塞返回）：maybeGrantInviteRewards(inviterId, newUserId)
        ├─ 读 invite_reward_config 单条 active 记录
        ├─ 邀请人侧：type=20 → claimCouponFromTemplate(inviterId, ref_id)
        ├─ 被邀请人侧：type=20 → claimCouponFromTemplate(newUserId, ref_id)
        └─ 整段 try/catch → console.error，不影响 register
```

注：`register()` 当前没有显式事务（与现有代码一致）。发券放在 INSERT user + createUserProfile 之后、`createSession` 之前 await + try/catch 包裹，失败仅 log。

实现要点：发券逻辑放在 `register()` 内的 try/catch 包裹处。被 await 但失败不抛——参考 `checkin/store.ts:141` 的 pattern：
```
await maybeGrantInviteRewards(inviterId, newUserId).catch((e) => {
  console.error('invite reward grant failed', { inviterId, inviteeId: newUserId, e });
});
```

## 4. 文件改动

### 后端新增（`apps/api/src/modules/invite/`）

**`store.ts`**

```
- maybeGrantInviteRewards(inviterId: string | null, inviteeId: string)
  - inviterId 为 null 直接 return
  - 读 invite_reward_config 单条 active
  - 分别尝试两侧发券；coin/physical 跳过 + warn
  - 整段 catch + console.error，不抛
- getMyInviteRecords(userId: string): Promise<InviteRecordListResult>
  - SELECT invitee.id, invitee.phone_number, invitee.created_at,
           profile.name, profile.avatar_url
    FROM user invitee LEFT JOIN user_profile profile ON ...
    WHERE invitee.invited_by = ?
    ORDER BY invitee.created_at DESC
    LIMIT 100
  - 不分页（量小，参考 admin/invites.ts 同类查询）
```

**`router.ts`**

```
- GET /api/invite/records → getMyInviteRecords(viewer.id)
- 走 requireUser 中间件
```

### 后端改动

**`apps/api/src/modules/auth/store.ts`**
- 加 `generateUniqueInviteCode()` 与 `generateUniqueUidCode` 同模式（碰撞重试 20 次，base62 8 位）
- `register(payload)`：
  - 读 `payload.inviteCode`（trim）→ 反查 `user.invite_code` → 拿 inviterId
  - INSERT user 时多两列：`invite_code, invited_by`
  - 主流程 commit/响应后 `maybeGrantInviteRewards(inviterId, result.insertId).catch(...)`

**`apps/api/src/modules/users/query-store.ts`**
- `userSelectSql` 加：
  ```
  COALESCE((
    SELECT COUNT(*) FROM user u2 WHERE u2.invited_by = u.id
  ), 0) AS invite_count
  ```
  让 `/api/users/me` 返回真实 `inviteCount`（之前 model 已有字段但 SELECT 缺失，永远 undefined）

**`apps/api/src/app.ts`**
- 挂载 `/api/invite` router

**`apps/api/src/routes/openapi/`**
- 新增 `/api/invite/records` 路径 schema
- `/api/auth/register` request body schema 加 `inviteCode?: string`

### Shared

**`packages/shared/src/api-auth.ts`**
- `RegisterPayload` 加 `inviteCode?: string`

**`packages/shared/src/api-user-commerce.ts`**
- 新增：
  ```ts
  export interface InviteRecordItem {
    id: string;
    name: string;
    avatar: string | null;
    registeredAt: string;
  }
  export interface InviteRecordListResult {
    items: InviteRecordItem[];
    total: number;
  }
  ```

### 前端

**`apps/web/src/app/register/page.tsx`**
- `searchParams.get('invite')?.trim() || undefined` → state
- `handleRegister` 透传 `inviteCode` 给 `register({...})`
- 注册成功后 toast 文案保持不变（不显式提示"已绑定邀请人"，避免泄漏邀请人 ID 信息）

**`apps/web/src/lib/api/invite.ts`**（新文件）
- `fetchMyInviteRecords()` → GET `/api/invite/records`

**`apps/web/src/app/invite/page.tsx`**
- `useEffect` 中并发拉 `fetchMe()` + `fetchMyInviteRecords()`
- records 数组传给现有 `recordList` section；保持空状态文案
- 行渲染：头像 + 昵称 + 注册日期（rewardLabel 一期不展示，admin 后台才需要）

## 5. 关键决策

| # | 选择 | 理由 |
|---|---|---|
| 1 | 单档触发（每邀请 1 人发一次） | invite_reward_config 现有就是单条 schema，多档要扩列 + admin UI 改造 |
| 2 | 注册主事务外发券 | 与 #29 签到完全一致：发券失败不能拖死主流程 |
| 3 | 无效 invite 码静默忽略 | 邀请者被封禁/打错码不应阻止被邀请人注册；UX 简化 |
| 4 | 老账号 invite_code 不做 lazy gen | 用户手动 SQL 补；省一段公用 helper 代码 |
| 5 | 邀请记录走 `user.invited_by` JOIN | admin/invites.ts 已同模式；不引 invite_record 表 |
| 6 | invite_count 走子查询不存物化列 | 同 followers/following count 模式；index 已有 |
| 7 | reward_type=10/30 跳过 + warn | coin 已下线、physical 没场景；admin 配错时 fail-soft |

## 6. 风险与兜底

- **孤儿 invited_by**：发券失败时 `user.invited_by` 已写但邀请人没拿到券。admin「邀请记录」可见，运营手动补。本期不做自动重试。
- **invite_code 唯一性冲突**：`user.invite_code UNIQUE` 由生成阶段的碰撞预查 + INSERT 兜底解决——`generateUniqueInviteCode` 先 SELECT 看是否已用，未用才返回；INSERT 仍因极小概率竞态撞 UNIQUE 时抛错，整个 register 失败。base62 8 位 = 218 万亿命名空间，碰撞概率可忽略。
- **重复邀请人配额**：admin 在 `coupon_template.user_limit` 配（1 = 终身一次 / 0 = 不限）。超额由 `claimCouponFromTemplate` 抛"已达领取上限"，外层 catch 静默 log。
- **`/api/users/me` 性能**：invite_count 子查询每次 fetchMe 多一次 COUNT。`user.invited_by` 有 MUL 索引，单用户邀请 < 100 量级可接受。
- **register 一致性**：inviterId 反查未在事务里（先查再 INSERT），inviter 在两步之间被封禁 → 注册成功但发券逻辑里再检查一次；可接受。

## 7. 测试计划

人工验收（用户在本地跑）：
1. 用 A 账号在 `/invite` 页复制链接 → URL 含 `?invite=XXX`
2. 退出登录，用链接打开 `/register` → 走完三步注册 B 账号 → 成功
3. admin 在 `coupon_template` 建一张可用券（type=full_off / discount，brand 任意），admin「邀请奖励配置」配 inviter+invitee 都用这个 template_id（reward_type=coupon）
4. 重复 (1)(2)，B 注册成功 → 检查 A 与 B 的 `coupon` 表均有一张快照、`/me/coupons` 看到（B 端走品牌发券：#29 已批次 1 落地的快照字段）
5. A 在 `/invite` 看到「已邀请 1 人」+ 记录列表展示 B 头像 + 昵称 + 时间
6. 反向：注册时 `?invite=NOTEXIST` → 注册成功、`invited_by=NULL`，无报错；A 端 inviteCount=0
7. 反向：admin 配 `reward_type=10/30` → 注册流程不报错，console.warn 提示"邀请奖励类型不支持"

## 8. 部署顺序

1. 后端 PR 1 个：shared types + invite module + auth/store inviteCode + query-store invite_count + OpenAPI
2. 前端 PR 1 个：register 消费 URL + invite 页拉 records
3. 与运维确认 admin 已经配好 `invite_reward_config` 的 `coupon_template_id`；老账号 invite_code 由用户/运维手工 backfill SQL（不在本期范围）

可分两 PR 部署，但代码改动不大也能合并一笔。

## 9. CLAUDE.md 收尾

完成后更新 #30：
- "P1 — 奖励发券" → 移到「已完成」段
- "P1 — 老账号 invite_code 全为 NULL" 保留为遗留（手工 SQL 补）
- "P2 — 邀请记录后端" → 移到「已完成」
- "P2 — 注册带邀请码闭环" → 移到「已完成」
