// server.js
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
// 托管静态文件（前端页面）
app.use(express.static('public'));

app.post('/api/export', async (req, res) => {
    const { host, token, outputDir } = req.body;

    if (!host || !token || !outputDir) {
        return res.status(400).json({ success: false, message: '请提供完整的 URL、Token 和输出路径' });
    }

    try {
        let nextPageToken = "";
        let allMemos = [];
        let hasMore = true;

        // 规范化 URL
        const baseUrl = host.replace(/\/$/, '');

        console.log('开始拉取数据...');

        // 循环处理分页，Memos 0.26+ 使用 pageToken
        while (hasMore) {
            const url = `${baseUrl}/api/v1/memos?pageSize=200${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
            
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const memos = response.data.memos || [];
            allMemos = allMemos.concat(memos);

            nextPageToken = response.data.nextPageToken;
            if (!nextPageToken) {
                hasMore = false;
            }
        }

        console.log(`共获取到 ${allMemos.length} 条 Memos，准备写入本地...`);

        // 确保输出目录存在
        const resolvedPath = path.resolve(outputDir);
        if (!fs.existsSync(resolvedPath)){
            fs.mkdirSync(resolvedPath, { recursive: true });
        }

        // 遍历并写入 Markdown 文件
        allMemos.forEach(memo => {
            // 解析时间戳 (Memos v0.26 返回的时间格式类似 2024-04-10T12:00:00Z)
            const dateObj = new Date(memo.createTime);
            const dateStr = dateObj.toISOString().split('T')[0]; 
            const timeStr = dateObj.toTimeString().split(' ')[0].replace(/:/g, '-');
            
            // 文件名格式：YYYY-MM-DD_UID.md 以防重名
            const filename = `${dateStr}_${memo.uid}.md`;
            const filepath = path.join(resolvedPath, filename);

            // 构建 Markdown 内容 (包含 Frontmatter 元数据)
            const markdownContent = `---
uid: ${memo.uid}
createTime: ${memo.createTime}
updateTime: ${memo.updateTime}
visibility: ${memo.visibility}
---

${memo.content}
`;
            fs.writeFileSync(filepath, markdownContent, 'utf8');
        });

        res.json({ 
            success: true, 
            message: `导出成功！共导出了 ${allMemos.length} 条 Memos 到 ${resolvedPath}` 
        });

    } catch (error) {
        console.error('导出失败:', error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.message || error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ 服务已启动! 请在浏览器中访问 http://localhost:${PORT}`);
});