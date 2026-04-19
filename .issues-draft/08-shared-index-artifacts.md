TITLE: `packages/shared/src/` 同时签入 `index.ts`、`index.js`、`index.d.ts`，后两个是手写产物会漂移

LABELS: packaging, shared, cleanup

BODY:
## 现象

`packages/shared/src/` 下三个文件内容完全相同：

```
index.ts   → export * from './api'; export * from './domain'; export * from './status';
index.js   → 同上
index.d.ts → 同上
```

而 `package.json` 的 `exports` 是：

```json
"exports": { ".": "./src/index.ts" }
```

也就是说消费者走的是 `.ts`，`index.js` 和 `index.d.ts` 没有 `tsc build` 产出——两份是手写的或之前某次的遗留，现在依赖人为同步。

## 为什么不合理

- 三份内容同步全靠人工，`api.ts` / `domain.ts` / `status.ts` 任何一次 rename 或新增都可能忘改 `.js` / `.d.ts`。
- 消费者（api / web / admin）走的是 `.ts`，所以 `.js` / `.d.ts` 也根本不被消费——留着只是误导。
- 与 `build` 脚本现状也冲突：`shared/package.json` 里 `build` 目前是 `echo "shared build pending"`，说明根本没有构建输出的规划。

## 建议

两个方向二选一：

- **方案 A（推荐）**：删掉 `src/index.js` 和 `src/index.d.ts`，只保留 `src/index.ts`。消费者继续走源码。
- **方案 B**：如果以后要产出真正的发布产物，改 `exports` 指向 `dist/`，加上 `tsc -p tsconfig.build.json`，把生成的 `.js/.d.ts` 加到 `.gitignore`，不再在 `src/` 里签入。

当前最小改动是方案 A。
