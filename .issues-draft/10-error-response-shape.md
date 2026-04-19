TITLE: API 错误响应只有 `message` 字符串，缺结构化错误码与分类

LABELS: backend, api, dx

BODY:
## 现象

所有模块 handler 的错误响应形如：

```ts
response.status(400).json({ success: false, message: error.message });
// 或
response.status(401).json({ success: false, message: '请先登录' });
// 或
response.status(404).json({ success: false, message: '动态不存在或不可见' });
```

错误信息靠 `throw new Error('登录失败' | '注册失败' | '更新资料失败' | ...)` 构造。前端拿到的只有一个中文字符串，没有：

- 稳定的错误码（例如 `AUTH_INVALID_CREDENTIAL`、`SMS_CODE_EXPIRED`、`POST_NOT_VISIBLE`）
- 错误分类（validation / auth / business / server）
- 字段级错误（表单校验需要指向哪个字段）

## 为什么不合理

- 前端想对"手机号已注册"和"验证码错误"做不同 UI，只能靠中文串匹配，一改文案前端就碎。
- 国际化做不了——`message` 本身就是最终展示文本。
- AGENTS.md："不允许把接口失败静默吞掉再回退成假数据... 错误要明确暴露"。仅暴露字符串不算结构化暴露。

## 建议

定一个 `ApiError` 契约（放到 `@joy/shared`）：

```ts
interface ApiErrorEnvelope {
  success: false;
  code: string;          // 'AUTH_INVALID_CREDENTIAL' 等稳定 slug
  message: string;       // 面向用户默认文案，前端可覆盖
  status: number;
  fields?: Record<string, string>;  // 字段级错误
}
```

- 后端抛一个 `HttpError(status, code, message, fields?)`，由统一 error middleware 序列化。
- router 里不再各自 `try/catch` 写同样的 `400 / message` 分支——和 issue #3 的 `requireUser` 中间件一起收敛到一个 `asyncHandler` 或全局 error handler。
- 同步在 `openapi.ts` 里声明错误 schema，Swagger 里能看到完整字段。
