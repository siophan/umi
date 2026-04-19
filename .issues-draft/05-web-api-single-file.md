TITLE: `apps/web/src/lib/api.ts` 又是单一总接口文件（399 行、29+ 导出），与 admin 已被点名的反模式一致

LABELS: frontend, web, refactor

BODY:
## 现象

`apps/web/src/lib/api.ts` 目前包含：

- auth（login / sendCode / register / fetchMe / updateMe / logout / changePassword 缺席）
- 用户：fetchUserProfile / fetchUserProfileActivity / searchUsers / followUser / unfollowUser
- 通知：fetchNotifications / markAllNotificationsRead / markNotificationRead
- 社交/社区：fetchSocialOverview / fetchCommunityFeed / fetchCommunityDiscovery / fetchCommunityPost / createCommunityPost / createCommunityComment / searchCommunity / likeCommunityPost / unlikeCommunityPost / bookmarkCommunityPost / unbookmarkCommunityPost / likeCommunityComment / unlikeCommunityComment / repostCommunityPost
- 聊天：fetchChats / fetchChatDetail / sendChatMessage
- 好友：acceptFriendRequest / rejectFriendRequest
- 竞猜：fetchGuessList / fetchGuess / fetchGuessHistory
- 商品：fetchProductDetail / fetchProductList
- 订单：fetchOrders
- 仓库：fetchVirtualWarehouse / fetchPhysicalWarehouse
- 店铺：fetchMyShop / fetchShopStatus / submitShopApplication / fetchShopDetail / fetchBrandAuthOverview / submitBrandAuthApplication / fetchBrandProducts / addShopProducts
- 钱包：fetchWalletLedger

全部一个文件 29+ 个导出。

## 为什么不合理

`AGENTS.md` 对 admin 明确禁止：

> 不允许做"单一总接口文件"。禁止把后台所有请求继续堆回一个 `api.ts` 大杂烩；接口必须按业务拆分。

但通用规则更上一层（"Architecture Pass Rules"）也写了"前端禁止把多个页面数据、多个路由状态、多个领域逻辑塞进一个总对象或总调度器"。web 端现在踩的就是同一个坑——只是目前还小，没到 admin 那种体量。

admin 端已经做出 `apps/admin/src/lib/api/{auth,users,catalog,orders,merchant,system}.ts` 的拆分；web 应采用同样思路。

## 建议

拆成 `apps/web/src/lib/api/{auth,users,community,chat,friends,notifications,guesses,products,orders,warehouse,shops,wallet}.ts`，共享 `getJson / postJson / putJson / deleteJson / getAuthToken` 放到 `api/shared.ts` 或 `api/client.ts`。

另外：`getJson` 里现在连续调用两次 `getAuthToken()`（一次判空、一次拼 header），应该调一次存变量。
