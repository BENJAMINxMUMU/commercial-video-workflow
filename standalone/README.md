# 独立网页工作台（无需服务器 / 无需联网）

当你**无法访问 Streamlit 服务**时，用这个纯前端版本：直接用浏览器打开 `workbench.html` 即可，
所有数据存在浏览器 `localStorage`，PPT 用内嵌的 `pptxgen.bundle.js` 在本地生成。

## 打开方式

- **本机**：双击 `workbench.html`，或浏览器地址栏输入 `file:///.../standalone/workbench.html`
- **沙箱/远程环境**：把 `standalone/` 整个文件夹下载到本地，双击 `workbench.html`
  （务必保留同目录下的 `app.js` 和 `pptxgen.bundle.js`，三者需在一起）

> 不依赖任何服务器、不联网（PPT 生成库已本地内置）。

## 与 Streamlit 版功能一致

9 个环节（项目设置 + 需求提炼 → 创意策划 → 创意脚本 → 文字分镜 → 分镜图 → 动态分镜 → 提报资料 → PPT整合），
每个环节自动渲染贴合上下文的 AI 提示词（含视频类型差异化参数），结构化沉淀产出，
一键导出 15 页可提报 PPTX。

## 文件清单

| 文件 | 作用 |
|---|---|
| `workbench.html` | 页面外壳与样式 |
| `app.js` | 全部交互逻辑（状态/提示词/PPT 生成） |
| `pptxgen.bundle.js` | 离线 PPT 生成库（pptxgenjs 3.12） |

## 数据备份

- 环节8 页面有「⬇️ 导出 JSON / ⬆️ 导入 JSON / 🗑 清空重置」。
- 日常自动存 localStorage；换浏览器/清缓存会丢失，重要项目请导出 JSON。
