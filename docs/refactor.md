# 重构说明

最后更新：2026-04-18

本文档用于说明 `umi` 这条新主线工程的重构背景、目标、范围、原则、当前完成情况和后续计划。  
它和 [progress.md](/Users/ezreal/Downloads/joy/umi/docs/progress.md) 的区别是：

- `refactor.md` 解释“为什么这样重构、重构到哪一层、下一阶段做什么”
- `progress.md` 只记录“哪些功能已经完成、哪些还没完成”

## 1. 重构背景

旧项目 `joy` 在继续迭代时暴露出几类问题：

1. 原型代码、迁移中代码、正式代码混在同一仓库里。
2. 用户端仍大量依赖静态 HTML 页面，难以继续承接复杂交互。
3. 前后端接口和数据库结构已经经历多轮调整，旧代码继续叠加维护成本过高。
4. 业务复杂度已经上升到竞猜、订单、仓库、权益、后台审核联动，但工程边界还不够清晰。

因此这次没有继续在旧代码上补丁式维护，而是选择在 `umi` 目录下建立新主线工程。

## 2. 重构目标

本轮重构的目标不是“换个脚手架”，而是建立一条可以长期承载业务迭代的新工程主线。

核心目标：

1. 以当前新的数据库结构为基线重建系统。
2. 用 monorepo 统一承载用户端、管理台、后端和共享层。
3. 先把核心业务闭环做扎实：
- 登录
- 竞猜
- 订单
- 仓库
- 后台审核 / 履约
4. 暂缓非核心模块：
- AI
- 社区深层功能
- 直播
- 营销活动
- 复杂运营能力

## 3. 重构范围

### 3.1 当前纳入重构的工程

| 目录 | 作用 |
| --- | --- |
| `apps/web` | 新用户端 |
| `apps/admin` | 新管理台 |
| `apps/api` | 新后端 |
| `packages/shared` | 共享类型、状态枚举、API 契约 |
| `packages/db` | 数据库相关资产和说明 |
| `packages/config` | 共享工程配置 |
| `docs` | 架构、进度、规则、交接文档 |

### 3.2 当前不纳入正式实现的旧资产

| 目录 | 当前定位 |
| --- | --- |
| `frontend` | 旧用户端静态页面，仅作为 UI 与行为对照基准 |
| `admin` | 旧管理台参考实现，不再作为新主线正式目录 |
| `backend` | 旧后端参考实现，不再作为 `umi` 主线正式实现 |

## 4. 重构原则

### 4.1 工程原则

1. 新主线只认当前新数据库结构。
2. 不再在 `umi` 中沿用旧目录结构。
3. 新代码必须按模块边界组织，不再继续堆“全局脚本式”实现。
4. 用户端、管理台、后端共用一套状态字典和类型定义。

### 4.2 数据原则

1. 当前数据库已经完成第一阶段重构，`umi` 要直接建立在新表结构上。
2. 不再为了兼容旧逻辑退回旧表设计。
3. 不在数据库层依赖外键，关系约束交由应用层维护。
4. 后端后续必须围绕事务、状态流和权限边界实现真实业务。

### 4.3 UI 原则

1. 用户端页面 UI 必须与旧 `frontend` 保持一致。
2. 不允许猜颜色、字号、间距、图标、按钮行为。
3. 所有用户端页面先对齐 UI 和交互，再接真实接口。

更细规则见：

- [ui-rules.md](/Users/ezreal/Downloads/joy/umi/docs/ui-rules.md)

## 5. 当前技术方案

| 层 | 技术方案 |
| --- | --- |
| Workspace | `pnpm workspace` + `turbo` |
| 用户端 | `Next.js` + `React` + `TypeScript` |
| 管理台 | `Vite` + `React` + `TypeScript` |
| 后端 | `Express` + `TypeScript` |
| 共享层 | workspace package |

说明：

1. 这轮重构没有先切换到更重的框架迁移路线。
2. 当前目标是先把新主线工程搭稳，再逐步接入真实数据库和业务逻辑。

## 6. 当前完成到哪一步

### 6.1 已完成

1. `umi` monorepo 基础工程已经建立。
2. `apps/web / apps/admin / apps/api / packages/* / docs` 已拆分完成。
3. `apps/api` 已有首批演示路由骨架。
4. `apps/web` 已完成大量旧静态页对应的新路由铺设。
5. 用户端页面正在按旧系统逐页进行 UI 与功能行为对齐。
6. `packages/shared` 已抽出共享类型、状态枚举和 API 契约基础层。
7. 文档体系已建立：
- [db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md)
- [progress.md](/Users/ezreal/Downloads/joy/umi/docs/progress.md)
- [ui-rules.md](/Users/ezreal/Downloads/joy/umi/docs/ui-rules.md)
- [handoff.md](/Users/ezreal/Downloads/joy/umi/docs/handoff.md)

### 6.2 当前未完成

1. `apps/api` 仍主要返回 demo 数据。
2. `apps/web` 仍主要依赖 demo / mock 内容。
3. `apps/admin` 还只是骨架，不是完整后台。
4. 真实权限、事务、状态机、幂等等核心业务机制尚未在 `umi` 落地。

## 7. 当前阶段重点

当前阶段重点很明确：

### 第一优先级

把用户端静态页面和旧系统 UI / 行为对齐。

理由：

1. 旧 `frontend` 是最明确的视觉和交互基准。
2. 先把页面和交互层稳定下来，后面接真实接口改动更可控。
3. 如果一边联调接口一边改页面结构，返工成本会更高。

### 第二优先级

等用户端核心页基本对齐后，再推进：

1. `apps/api` 真实数据库读取
2. `apps/web` 接真实接口
3. `apps/admin` 建最小运营闭环

## 8. 分阶段路线

### Phase 1：新工程底座

目标：

1. 建立 monorepo
2. 建立 web / admin / api 骨架
3. 抽 shared
4. 建立文档体系

当前状态：已完成

### Phase 2：用户端页面迁移

目标：

1. 覆盖旧静态页路由
2. 逐页对齐 UI
3. 逐页补旧页面行为

当前状态：进行中

### Phase 3：API 接数据库

目标：

1. 替换 demo 数据
2. 接入真实读取
3. 建 service 层
4. 落事务、状态、权限

当前状态：未开始

### Phase 4：业务闭环联调

目标：

1. 用户端接真实接口
2. 后台接真实业务操作
3. 跑通竞猜、订单、仓库闭环

当前状态：未开始

## 9. 当前最大的风险和限制

1. 用户端页面数量多，UI 对齐是持续性工作。
2. 当前新后端还未接数据库，离真实业务还有明显距离。
3. 管理台尚未开始真正的业务页开发。
4. 如果不持续维护文档，后续线程切换仍会产生上下文损耗。

## 10. 后续维护要求

后面继续推进时，至少同步维护这些文档：

1. [progress.md](/Users/ezreal/Downloads/joy/umi/docs/progress.md)
2. [ui-rules.md](/Users/ezreal/Downloads/joy/umi/docs/ui-rules.md)
3. [handoff.md](/Users/ezreal/Downloads/joy/umi/docs/handoff.md)
4. [refactor.md](/Users/ezreal/Downloads/joy/umi/docs/refactor.md)

更新场景：

1. 重构范围发生变化
2. 阶段目标发生变化
3. 主要技术路线调整
4. 某阶段完成或切换

## 11. 一句话结论

`umi` 不是旧系统的简单复制，而是建立在新数据库结构之上的新主线工程。  
当前阶段重点不是联调真实接口，而是先把用户端页面与旧系统的 UI 和行为对齐，再进入真实业务接入阶段。
