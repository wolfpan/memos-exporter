针对 Memos 0.26.2 版本，其 API 已经全面迁移到了符合 gRPC-gateway 标准的 /api/v1/memos。

Node.js 后端：负责与 Memos API 交互，处理分页拉取数据，并将其写入本地文件系统。
Web 前端：提供一个可视化的操作界面，让你输入配置并查看导出进度。

环境准备
在开始之前，请确保你的电脑上已经安装了 Node.js。创建一个新的项目文件夹，并初始化项目：

```bash
mkdir memos-exporter
cd memos-exporter
npm init -y
npm install express axios cors
```
