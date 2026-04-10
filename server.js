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
app.use(express.static('public'));

// 调用 AI 接口生成摘要的辅助函数
async function generateSummary(content, aiUrl, aiToken) {
    if (!content || content.trim() === '') return '未命名';
    
    const baseUrl = aiUrl.replace(/\/$/, '');
    const endpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

    try {
        const response = await axios.post(endpoint, {
            model: 'deepseek-chat', 
            messages: [
                { 
                    role: 'system', 
                    content: '你是一个文件命名助手。请仔细阅读用户发来的内容，提取核心意思，将其概括为一个不超过20个字的文件名。要求：1. 只能包含中英文和数字；2. 绝对不能包含 \\ / : * ? " < > | 这些系统禁用的特殊字符，也不要包含 # 或 ` 等 Markdown 符号；3. 不要输出任何解释、标点或多余的文字，只输出这几个字。' 
                },
                { 
                    role: 'user', 
                    content: content.substring(0, 800) 
                }
            ],
            temperature: 0.3,
        }, {
            headers: { 
                'Authorization': `Bearer ${aiToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 
        });

        let summary = response.data.choices[0].message.content.trim();
        // 增强清理：去除 Windows 非法字符以及 # 和反引号等常见 markdown 符号
        summary = summary.replace(/[\/\\:\*\?"<>\|\n\r#`]/g, '').substring(0, 20).trim();
        return summary || '未命名';
    } catch (error) {
        console.error(`AI 概括失败，使用降级方案:`, error.message);
        return content.substring(0, 20).replace(/[\/\\:\*\?"<>\|\n\r#`]/g, '').trim() || '未命名';
    }
}

app.post('/api/export', async (req, res) => {
    const { host, token, outputDir, aiUrl, aiToken } = req.body;

    if (!host || !token || !outputDir) {
        return res.status(400).json({ success: false, message: '请提供完整的 Memos URL、Token 和输出路径' });
    }

    const useAI = aiUrl && aiToken; 

    try {
        let nextPageToken = "";
        let allMemos = [];
        let hasMore = true;
        const baseUrl = host.replace(/\/$/, '');

        console.log('开始从 Memos 拉取数据...');

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

        console.log(`共获取到 ${allMemos.length} 条 Memos，准备处理写入...`);

        const resolvedPath = path.resolve(outputDir);
        if (!fs.existsSync(resolvedPath)){
            fs.mkdirSync(resolvedPath, { recursive: true });
        }

        for (let i = 0; i < allMemos.length; i++) {
            const memo = allMemos[i];
            
            const dateObj = new Date(memo.createTime);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            let summary = '';
            if (useAI) {
                console.log(`正在请求 AI 处理第 ${i + 1}/${allMemos.length} 条...`);
                summary = await generateSummary(memo.content, aiUrl, aiToken);
            } else {
                summary = memo.content.substring(0, 20).replace(/[\/\\:\*\?"<>\|\n\r#`]/g, '').trim() || '未命名';
            }

            // 新的命名逻辑：标题_时间
            let baseFilename = `${summary}_${dateStr}`;
            let filename = `${baseFilename}.md`;
            let filepath = path.join(resolvedPath, filename);

            // 防重名逻辑：如果文件已存在，则追加 (1), (2) 等序号
            let counter = 1;
            while (fs.existsSync(filepath)) {
                filename = `${baseFilename}_(${counter}).md`;
                filepath = path.join(resolvedPath, filename);
                counter++;
            }

            const markdownContent = `---
uid: ${memo.uid || 'null'}
createTime: ${memo.createTime}
updateTime: ${memo.updateTime}
visibility: ${memo.visibility}
---

${memo.content}
`;
            fs.writeFileSync(filepath, markdownContent, 'utf8');
        }

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