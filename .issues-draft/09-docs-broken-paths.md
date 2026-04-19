TITLE: `README.md` 和 `AGENTS.md` 里的链接全部是绝对本地路径 `/Users/ezreal/Downloads/joy/umi/...`

LABELS: docs, cleanup

BODY:
## 现象

`README.md` 和 `AGENTS.md` 正文里的所有内链都是这种形式：

```
[docs/db.md](/Users/ezreal/Downloads/joy/umi/docs/db.md)
[AGENTS.md](/Users/ezreal/Downloads/joy/umi/AGENTS.md)
```

对任何不叫 `ezreal` 且没把仓库 clone 到 `~/Downloads/joy/umi` 的人、任何 CI 环境、GitHub 网页渲染都是 404。

同时 `AGENTS.md` 里提到的"老系统后端/前端/管理端"也同样是本地绝对路径，别的线程按这些链接去找也会失败。

## 为什么不合理

这批链接正好是 AGENTS.md 反复强调"新线程接手时先读"的入口文件。入口链接坏掉意味着规则文档本身对别人不可读。

## 建议

把绝对路径全部替换为仓库内相对路径：

- `/Users/ezreal/Downloads/joy/umi/docs/db.md` → `docs/db.md`
- `/Users/ezreal/Downloads/joy/umi/AGENTS.md` → `AGENTS.md`
- `/Users/ezreal/Downloads/joy/umi/README.md` → `README.md`
- `/Users/ezreal/Downloads/joy/umi/.env` → `.env`

老系统（`backend / admin / frontend`）如果不在 `umi/` 仓库内，就只保留说明文字，不做成失效链接；或者在 AGENTS.md 里明确写清楚"这些路径指的是本地另一处 clone，不同机器会不一样"。

一次 `sed -i 's|/Users/ezreal/Downloads/joy/umi/||g'` 基本能收掉。
