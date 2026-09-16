// 轻食计 AI 后端代理：浏览器 → 本服务 → DeepSeek API
// 用途：让智能助手能回答本地规则引擎答不上来的问题（如品牌食物热量）。
// 密钥只存在服务端环境变量 DEEPSEEK_API_KEY（.env），不会暴露给浏览器。
import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json({ limit: '1mb' }));

const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const PORT = Number(process.env.PORT || 8787);

const SYSTEM_PROMPT = [
  '你是「轻食计」减肥饮食助手中的 AI 助手。人设：一位知识渊博、治学严谨的营养学者，谈吐像语言学家一样用词准确、精炼、有分寸，不说废话、不油嘴滑舌。',
  '',
  '对饮食/营养/减脂类问题的回答结构（按顺序）：',
  '1. 先一句话简要回答核心问题：结论先行，涉及数值必须给出并注明口径，例如「每 100g 约 xx 千卡」「以官方/门店数据为准，不同规格有差异」。',
  '2. 再给出 1-2 条实用建议（结合【用户数据】里的身高体重、目标热量、今日摄入，引用数值，不要编造）。',
  '3. 涉及具体食物时，最后输出一行「营养评分：X/10 分」并给一句理由：从热量密度、蛋白质、脂肪质量、膳食纤维、糖盐含量等维度综合判断，高蛋白低脂高纤维加分，高糖高油高盐减分。',
  '',
  '边界规则（非常重要）：',
  '- 只回答与饮食、营养、热量、减脂、运动消耗、饮食记录、食物相关的问题，以及基于用户数据的个性化建议。',
  '- 与上述无关的问题（如明星八卦、新闻、天气、数学题、编程、游戏、闲聊）一律简短回答「这个问题我不太清楚，我主要擅长饮食与营养方面的知识。」，不展开、不猜测、不编造。',
  '- 不知道的数据明确说明，绝不编造食物成分表数值。',
  '- 始终使用简体中文，回答简洁（一般 3-8 行）。',
  '',
  '机器输出协议（严格遵循）：如果本次回答涉及一种具体食物，并且你给出了它的热量与营养数据，请在回答的最后单独输出一行（独立成行，前面加换行），格式：@@FOOD@@ 食物名称|整份热量千卡|整份蛋白质克|整份脂肪克|整份碳水化合物克|整份重量克。',
  '数据口径：对成品/份装食物（汉堡、薯条、蛋挞、奶茶等），按「实际一份」给出数据，例如一个板烧鸡腿堡约 200g：@@FOOD@@ 板烧鸡腿堡|400|24|20|30|200；对散装食材（鸡胸肉、米饭、苹果等），按每 100g 计算，重量填 100，例如：@@FOOD@@ 鸡胸肉|133|19.4|5|2.5|100。',
  '数值必须与你上文回答一致，只填数字、不带单位，未知填 0。如果回答不涉及具体食物或没有给出营养数据，绝对不要输出这一行，也不要解释这个协议。',
].join('\n');

const buildUserMessage = (question, context) => {
  const parts = [];
  if (context) parts.push(`【用户数据】\n${context}`);
  parts.push(`【用户问题】\n${question}`);
  return parts.join('\n\n');
};

/** 从 AI 回答中提取结构化食物行（@@FOOD@@ 名称|整份千卡|蛋白|脂肪|碳水|整份重量g），并从回答中移除 */
function extractFoods(answer) {
  const foods = [];
  const cleaned = answer
    .split('\n')
    .filter((line) => {
      const m = line.match(/@@FOOD@@\s*(.+)/);
      if (!m) return true;
      const parts = m[1].split('|').map((s) => s.trim());
      const name = parts[0];
      if (name) {
        foods.push({
          name,
          kcal: Number(parts[1]) || 0,
          protein: Number(parts[2]) || 0,
          fat: Number(parts[3]) || 0,
          carbs: Number(parts[4]) || 0,
          weight: Number(parts[5]) || 100,
        });
      }
      return false; // 移除协议行
    })
    .join('\n')
    .trim();
  return { answer: cleaned, foods };
}

app.post('/api/chat', async (req, res) => {
  const { question, context } = req.body || {};
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'question 不能为空' });
  }
  if (!API_KEY) {
    return res.status(500).json({ error: '服务端未配置 DEEPSEEK_API_KEY（请在 .env 中填写）' });
  }

  try {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(question.trim(), context) },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!r.ok) {
      const body = await r.text();
      console.error(`[deepseek] HTTP ${r.status}: ${body.slice(0, 300)}`);
      return res.status(502).json({ error: `DeepSeek 接口返回 ${r.status}` });
    }

    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return res.status(502).json({ error: 'DeepSeek 未返回内容' });
    const { answer, foods } = extractFoods(raw.trim());
    res.json({ answer, foods });
  } catch (err) {
    console.error('[deepseek] 请求失败:', err);
    res.status(502).json({ error: 'AI 服务暂时不可用' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: MODEL, keyConfigured: Boolean(API_KEY) });
});

app.listen(PORT, () => {
  console.log(`轻食计 AI 代理已启动: http://localhost:${PORT} (model=${MODEL})`);
});
