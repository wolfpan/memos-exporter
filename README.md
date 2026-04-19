# Memos to Markdown Exporter (AI Enhanced)

一个轻量级的 Node.js 工具，用于将 Memos 笔记批量导出为标准 Markdown 文件。本工具已适配 Memos 最新 API 标准，支持调用大语言模型（如 DeepSeek）对笔记内容进行智能摘要并自动命名。

## 项目简介

本工具解决了 Memos 在备份或迁移时文件名混乱、缺乏逻辑的问题。通过本地 Node.js 服务，程序能够抓取 Memos 实例中的笔记，并实现以下核心功能：

- **API 适配**：全面支持 Memos v0.26.2 及后续版本，兼容符合 gRPC-gateway 标准的 `/api/v1/memos` 路径。

- **AI 智能命名**：集成 OpenAI 兼容接口，根据笔记内容（首 800 字）自动概括文件名。

- **文件名清洗**：自动剔除系统禁用字符（如 `\ / : * ? " < > |`），确保跨平台文件系统兼容。

- **元数据保留**：支持在 Markdown 顶部生成 YAML Frontmatter，涵盖 UID、创建时间、可见性等关键属性。

## 版本兼容性

- **Memos v0.26.2+**：完全支持。程序默认请求新版 API 路径。

- **旧版 Memos**：由于 API 架构差异，建议在使用前确认 Memos 实例版本。

## 技术依赖

运行环境需要安装：

- **Node.js** (建议 v16.x 或更高版本)

- **关键依赖包**：
  
  - `express`: 后端路由服务
  
  - `axios`: 处理 API 异步请求
  
  - `cors`: 解决前端跨域配置
  
  - `fs` / `path`: 本地文件读写与路径解析

## 安装与使用步骤

### 1. 克隆仓库并安装依赖

Bash

```
git clone https://github.com/your-username/memos-exporter.git
cd memos-exporter
npm install
```

### 2. 启动服务

在项目根目录下执行：

Bash

```
node server.js
```

服务启动后，默认监听 `http://localhost:3000`。

### 3. 执行导出

1. 在浏览器中打开 `http://localhost:3000`。

2. **Memos 配置**：填写实例地址（Host）及访问令牌（Open API Token）。

3. **保存设置**：指定本地磁盘的存储路径。

4. **AI 配置（可选）**：若需智能摘要，需填写 API 基础路径及 Key。

5. 点击“开始导出”，控制台会实时反馈每条笔记的处理状态。

## 未来升级计划

- **资源同步**：增加对 Memos 内置图片及附件的本地化下载与链接修复功能。

- **性能优化**：引入请求频率限制（Rate Limiting），防止在处理大量笔记时触发 AI 接口的频率封禁。

- **Obsidian 插件化**：将核心逻辑迁移至 Obsidian 环境，开发专属插件，实现从碎片化记录（Memos）到系统化知识库（Obsidian Vault）的无缝同步，打通双向数据流。

---

## 许可证

[MIT License](https://www.google.com/search?q=LICENSE&authuser=1)
